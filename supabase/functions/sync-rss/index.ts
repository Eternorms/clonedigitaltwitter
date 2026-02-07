import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, rateLimitResponse, addRateLimitHeaders, RATE_LIMITS } from '../_shared/rate-limit.ts'

// A3: Use origin-aware CORS headers (same pattern as generate-post/publish-post)
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') ?? ''
  const resolvedOrigin = allowedOrigin && origin === allowedOrigin ? origin : ''
  return {
    'Access-Control-Allow-Origin': resolvedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

// A4: SSRF protection — block private/internal addresses
function isUrlSafe(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false
  }
  const hostname = parsed.hostname.toLowerCase()
  // Block localhost
  if (hostname === 'localhost' || hostname === '[::1]') return false
  // Block private IPv4 ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number)
    if (a === 127) return false                              // 127.x.x.x
    if (a === 10) return false                               // 10.x.x.x
    if (a === 172 && b >= 16 && b <= 31) return false        // 172.16-31.x.x
    if (a === 192 && b === 168) return false                 // 192.168.x.x
    if (a === 169 && b === 254) return false                 // 169.254.x.x (link-local)
    if (a === 0) return false                                // 0.x.x.x
  }
  // Block IPv6 loopback
  if (hostname === '::1' || hostname === '[::1]') return false
  // Block metadata endpoints
  if (hostname === 'metadata.google.internal') return false
  if (hostname === '169.254.169.254') return false
  return true
}

// Strip HTML tags and decode common entities
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Extract CDATA or plain text content
function extractText(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`)
  const plainRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)
  const cdataMatch = xml.match(cdataRegex)
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = xml.match(plainRegex)
  if (plainMatch) return stripHtml(plainMatch[1].trim())
  return ''
}

// Generate a simple hash for duplicate detection
function hashContent(content: string): string {
  // Simple hash based on first 100 chars normalized
  const normalized = content.toLowerCase().replace(/\s+/g, ' ').slice(0, 100)
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limiting: 20 syncs per minute per user
    const rateLimitResult = checkRateLimit(`sync:${user.id}`, RATE_LIMITS.syncRss)
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders)
    }

    const { rss_source_id } = await req.json()

    // A5: Validate rss_source_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!rss_source_id || typeof rss_source_id !== 'string' || !uuidRegex.test(rss_source_id)) {
      return new Response(JSON.stringify({ error: 'Invalid rss_source_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // A5: Fetch RSS source with ownership check via personas join
    const { data: source, error: sourceError } = await supabase
      .from('rss_sources')
      .select('*, personas!inner(id, name, user_id)')
      .eq('id', rss_source_id)
      .eq('personas.user_id', user.id)
      .single()

    if (sourceError || !source) {
      return new Response(JSON.stringify({ error: 'RSS source not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const persona = source.personas as unknown as { id: string; name: string; user_id: string }

    // Fetch existing posts for duplicate detection
    const { data: existingPosts } = await supabase
      .from('posts')
      .select('content')
      .eq('persona_id', persona.id)
      .eq('source', 'rss')
      .order('created_at', { ascending: false })
      .limit(50)

    const existingHashes = new Set(
      (existingPosts ?? []).map((p: { content: string }) => hashContent(p.content))
    )

    // A4: SSRF protection — validate URL before fetching
    if (!isUrlSafe(source.url)) {
      return new Response(JSON.stringify({ error: 'URL blocked: private or internal address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch RSS feed with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    let feedResponse: Response
    try {
      feedResponse = await fetch(source.url, { signal: controller.signal })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      await supabase
        .from('rss_sources')
        .update({
          status: 'error',
          error_message: fetchError instanceof Error ? fetchError.message : 'Fetch timeout',
        })
        .eq('id', rss_source_id)

      return new Response(JSON.stringify({ error: 'Failed to fetch RSS feed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    clearTimeout(timeoutId)

    if (!feedResponse.ok) {
      await supabase
        .from('rss_sources')
        .update({
          status: 'error',
          error_message: `HTTP ${feedResponse.status}: ${feedResponse.statusText}`,
        })
        .eq('id', rss_source_id)

      return new Response(JSON.stringify({ error: 'Failed to fetch RSS feed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const feedXml = await feedResponse.text()

    // Parse RSS items (title + description + link)
    const items: { title: string; description: string; link: string }[] = []

    // RSS <item> parsing
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    while ((match = itemRegex.exec(feedXml)) !== null) {
      const itemXml = match[1]
      const title = extractText(itemXml, 'title')
      const description = extractText(itemXml, 'description')
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/)
      const link = linkMatch?.[1]?.trim() || ''
      if (title) {
        items.push({ title, description, link })
      }
    }

    // Atom <entry> parsing
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    while ((match = entryRegex.exec(feedXml)) !== null) {
      const entryXml = match[1]
      const title = extractText(entryXml, 'title')
      const description = extractText(entryXml, 'summary') || extractText(entryXml, 'content')
      const linkMatch = entryXml.match(/<link[^>]*href="([^"]*)"/)
      const link = linkMatch?.[1]?.trim() || ''
      if (title) {
        items.push({ title, description, link })
      }
    }

    // Build posts and filter duplicates
    const postsToInsert: {
      persona_id: string
      content: string
      status: string
      source: string
      source_name: string
      hashtags: string[]
    }[] = []

    for (const item of items.slice(0, 10)) { // Process up to 10 items
      // Build enriched content: title + description
      let content = item.title
      if (item.description) {
        const descTruncated = item.description.length > 180
          ? item.description.slice(0, 177) + '...'
          : item.description
        content = `"${item.title}" — ${descTruncated}`
      }
      // Ensure total content fits tweet limit
      if (content.length > 270) {
        content = content.slice(0, 267) + '...'
      }

      // Check for duplicates using content hash
      const contentHash = hashContent(content)
      if (existingHashes.has(contentHash)) {
        continue // Skip duplicate
      }
      existingHashes.add(contentHash) // Prevent duplicates within same batch

      postsToInsert.push({
        persona_id: persona.id,
        content,
        status: 'pending',
        source: 'rss',
        source_name: source.name,
        hashtags: [],
      })

      // Limit to 5 new posts per sync
      if (postsToInsert.length >= 5) break
    }

    // Insert non-duplicate posts
    if (postsToInsert.length > 0) {
      await supabase.from('posts').insert(postsToInsert)
    }

    // Update source
    await supabase
      .from('rss_sources')
      .update({
        status: 'active',
        last_sync_at: new Date().toISOString(),
        article_count: source.article_count + postsToInsert.length,
        error_message: null,
      })
      .eq('id', rss_source_id)

    // Log activity
    await supabase.from('activities').insert({
      user_id: user.id,
      persona_id: persona.id,
      type: 'source_synced',
      description: `${source.name} sincronizado (${postsToInsert.length} novos artigos)`,
    })

    return new Response(JSON.stringify({ synced: postsToInsert.length }), {
      headers: addRateLimitHeaders({ ...corsHeaders, 'Content-Type': 'application/json' }, rateLimitResult),
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
