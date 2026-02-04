import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    const { rss_source_id } = await req.json()

    // Fetch RSS source
    const { data: source, error: sourceError } = await supabase
      .from('rss_sources')
      .select('*, personas(id, name)')
      .eq('id', rss_source_id)
      .single()

    if (sourceError || !source) {
      return new Response(JSON.stringify({ error: 'RSS source not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch RSS feed
    const feedResponse = await fetch(source.url)
    if (!feedResponse.ok) {
      // Mark source as error
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

    // Simple XML parsing for RSS items
    const items: { title: string; link: string }[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    while ((match = itemRegex.exec(feedXml)) !== null) {
      const itemXml = match[1]
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/)
      const title = titleMatch?.[1] || titleMatch?.[2] || ''
      const link = linkMatch?.[1] || ''
      if (title) {
        items.push({ title: title.trim(), link: link.trim() })
      }
    }

    // Also check for Atom entries
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    while ((match = entryRegex.exec(feedXml)) !== null) {
      const entryXml = match[1]
      const titleMatch = entryXml.match(/<title[^>]*>(.*?)<\/title>/)
      const linkMatch = entryXml.match(/<link[^>]*href="([^"]*)"/)
      const title = titleMatch?.[1] || ''
      const link = linkMatch?.[1] || ''
      if (title) {
        items.push({ title: title.trim(), link: link.trim() })
      }
    }

    // Create draft posts from first 5 new articles
    const newItems = items.slice(0, 5)
    const persona = source.personas as unknown as { id: string; name: string }

    if (newItems.length > 0) {
      await supabase.from('posts').insert(
        newItems.map(item => ({
          persona_id: persona.id,
          content: item.title.length > 250
            ? item.title.slice(0, 247) + '...'
            : item.title,
          status: 'pending',
          source: 'rss',
          source_name: source.name,
          hashtags: [],
        }))
      )
    }

    // Update source
    await supabase
      .from('rss_sources')
      .update({
        status: 'active',
        last_sync_at: new Date().toISOString(),
        article_count: source.article_count + newItems.length,
        error_message: null,
      })
      .eq('id', rss_source_id)

    // Log activity
    await supabase.from('activities').insert({
      user_id: user.id,
      persona_id: persona.id,
      type: 'source_synced',
      description: `${source.name} sincronizado (${newItems.length} novos artigos)`,
    })

    return new Response(JSON.stringify({ synced: newItems.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
