import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { checkRateLimit, rateLimitResponse, addRateLimitHeaders, RATE_LIMITS } from '../_shared/rate-limit.ts'
import type { GeneratedPost } from '../_shared/types.ts'

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

/** Call Gemini API with retry logic (max 2 retries, exponential backoff) */
async function callGeminiWithRetry(
  url: string,
  body: object,
  apiKey: string,
  maxRetries = 2,
): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
      })
      // Only retry on 5xx or 429 (rate limit)
      if (response.ok || (response.status < 500 && response.status !== 429)) {
        return response
      }
      lastError = new Error(`Gemini API returned ${response.status}`)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000 // 1s, 2s
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError ?? new Error('Gemini API call failed after retries')
}

/** Extract JSON array from AI response text using multiple patterns */
function extractJsonArray(text: string): GeneratedPost[] | null {
  // Pattern 1: Match [...] directly
  const directMatch = text.match(/\[[\s\S]*\]/)
  if (directMatch) {
    try {
      return JSON.parse(directMatch[0])
    } catch { /* try next pattern */ }
  }

  // Pattern 2: Extract from markdown code block ```json ... ```
  const codeBlockMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1])
    } catch { /* try next pattern */ }
  }

  // Pattern 3: Try parsing the entire response as JSON
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
  } catch { /* all patterns failed */ }

  return null
}

/** Sanitize generated content: trim whitespace, collapse excessive newlines */
function sanitizeContent(content: string): string {
  return content
    .trim()
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+$/gm, '')
}

Deno.serve(async (req) => {
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

    // Rate limiting: 10 requests per minute per user
    const rateLimitResult = checkRateLimit(`generate:${user.id}`, RATE_LIMITS.generatePost)
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders)
    }

    const body = await req.json()
    const { persona_id, topic, model: requestedModel, rss_source_id, use_tweet_style } = body

    // Default use_tweet_style to false (backward compatible)
    const useTweetStyle = use_tweet_style === true

    // Validate persona_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!persona_id || typeof persona_id !== 'string' || !uuidRegex.test(persona_id)) {
      return new Response(JSON.stringify({ error: 'Invalid persona_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate and clamp count to 1-10
    const count = Math.max(1, Math.min(10, Number(body.count) || 3))

    // Validate rss_source_id if provided
    if (rss_source_id && (typeof rss_source_id !== 'string' || !uuidRegex.test(rss_source_id))) {
      return new Response(JSON.stringify({ error: 'Invalid rss_source_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Supported models whitelist
    const SUPPORTED_MODELS = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ]

    // Determine model: request body > user profile > default
    let model = 'gemini-2.0-flash'

    if (requestedModel && SUPPORTED_MODELS.includes(requestedModel)) {
      model = requestedModel
    } else {
      // Fetch user's preferred model from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_model')
        .eq('id', user.id)
        .single()

      if (profile?.preferred_model && SUPPORTED_MODELS.includes(profile.preferred_model)) {
        model = profile.preferred_model
      }
    }

    // Fetch persona for prompt context (verify ownership via user_id)
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', persona_id)
      .eq('user_id', user.id)
      .single()

    if (personaError || !persona) {
      return new Response(JSON.stringify({ error: 'Persona not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate rss_source_id belongs to this persona
    if (rss_source_id) {
      const { data: sourceCheck } = await supabase
        .from('rss_sources')
        .select('id')
        .eq('id', rss_source_id)
        .eq('persona_id', persona_id)
        .single()

      if (!sourceCheck) {
        return new Response(JSON.stringify({ error: 'RSS source not found for this persona' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Call Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Fetch tweet context: real tweets from persona's timeline ---
    let tweetContext = ''
    try {
      if (useTweetStyle) {
        // Top 5 by engagement
        const { data: topTweets } = await supabase
          .from('cached_tweets')
          .select('text, like_count, retweet_count')
          .eq('persona_id', persona_id)
          .order('like_count', { ascending: false })
          .limit(5)

        // 5 most recent
        const { data: recentTweets } = await supabase
          .from('cached_tweets')
          .select('text, like_count, retweet_count')
          .eq('persona_id', persona_id)
          .order('tweeted_at', { ascending: false })
          .limit(5)

        // Deduplicate (a tweet can be both top and recent)
        const seen = new Set<string>()
        const allTweets: { text: string; like_count: number; retweet_count: number; section: string }[] = []

        for (const t of (topTweets ?? [])) {
          if (!seen.has(t.text)) {
            seen.add(t.text)
            allTweets.push({ ...t, section: 'top' })
          }
        }
        for (const t of (recentTweets ?? [])) {
          if (!seen.has(t.text)) {
            seen.add(t.text)
            allTweets.push({ ...t, section: 'recent' })
          }
        }

        if (allTweets.length > 0) {
          const topList = allTweets.filter(t => t.section === 'top')
          const recentList = allTweets.filter(t => t.section === 'recent')
          let idx = 1
          let context = '\n\n=== EXEMPLOS REAIS (tweets mais populares) ==='
          for (const t of topList) {
            context += `\n${idx}. "${t.text}" (${t.like_count} likes, ${t.retweet_count} RTs)`
            idx++
          }
          if (recentList.length > 0) {
            context += '\n\n=== EXEMPLOS RECENTES ==='
            for (const t of recentList) {
              context += `\n${idx}. "${t.text}" (${t.like_count} likes, ${t.retweet_count} RTs)`
              idx++
            }
          }
          tweetContext = context
        }
      }
    } catch {
      // Tweet context is optional — continue without it
    }

    // --- Fetch RSS context: recent RSS-sourced posts for this persona ---
    let rssContext = ''
    let selectedSourceName = ''
    try {
      // If a specific RSS source is selected, get its name and filter posts
      if (rss_source_id) {
        const { data: source } = await supabase
          .from('rss_sources')
          .select('name')
          .eq('id', rss_source_id)
          .single()

        if (source) {
          selectedSourceName = source.name
          const { data: rssArticles } = await supabase
            .from('posts')
            .select('content, source_name')
            .eq('persona_id', persona_id)
            .eq('source', 'rss')
            .eq('source_name', source.name)
            .order('created_at', { ascending: false })
            .limit(10)

          if (rssArticles && rssArticles.length > 0) {
            const articleList = rssArticles
              .map((a: { content: string; source_name: string | null }) =>
                `- ${a.content}`)
              .join('\n')
            rssContext = `\n\nArtigos da fonte "${source.name}" (use como base para os posts):\n${articleList}`
          }
        }
      } else {
        // No specific source selected - use all RSS posts
        const { data: rssArticles } = await supabase
          .from('posts')
          .select('content, source_name')
          .eq('persona_id', persona_id)
          .eq('source', 'rss')
          .order('created_at', { ascending: false })
          .limit(5)

        if (rssArticles && rssArticles.length > 0) {
          const articleList = rssArticles
            .map((a: { content: string; source_name: string | null }) =>
              `- [${a.source_name ?? 'RSS'}] ${a.content}`)
            .join('\n')
          rssContext = `\n\nArtigos recentes das fontes RSS (use como inspiração e contexto):\n${articleList}`
        }
      }
    } catch {
      // RSS context is optional — continue without it
    }

    // --- Fetch Google Trends for Brazil (free alternative to Twitter) ---
    let trendsContext = ''
    try {
      const trendsResponse = await fetch(
        'https://trends.google.com/trending/rss?geo=BR',
        { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AgencyOS/1.0)' } }
      )
      if (trendsResponse.ok) {
        const trendsXml = await trendsResponse.text()
        // Parse <item><title>...</title></item> tags
        const titleRegex = /<item>[\s\S]*?<title>([^<]+)<\/title>/g
        const trends: string[] = []
        let match
        while ((match = titleRegex.exec(trendsXml)) !== null) {
          if (trends.length >= 10) break
          trends.push(match[1].trim())
        }
        if (trends.length > 0) {
          const trendList = trends.map(t => `- ${t}`).join('\n')
          trendsContext = `\n\nTendências de busca no Google Brasil agora:\n${trendList}`
        }
      }
    } catch {
      // Google Trends context is optional — continue without it
    }

    // --- Fetch existing content for duplicate detection ---
    const { data: existingPosts } = await supabase
      .from('posts')
      .select('content')
      .eq('persona_id', persona_id)
      .order('created_at', { ascending: false })
      .limit(50)

    const existingContents = new Set(
      (existingPosts ?? []).map((p: { content: string }) => p.content.toLowerCase().trim())
    )

    const topics = (persona.topics as string[]) ?? []
    const tweetStyleInstruction = tweetContext
      ? '\n\nIMPORTANTE: Imite o estilo, vocabulario e padroes de escrita dos tweets acima.\nMantenha o mesmo nivel de formalidade, uso de emojis, e estrutura de frase.\nCrie posts ORIGINAIS que parecem ter sido escritos pela mesma pessoa.\n'
      : ''
    const prompt = `Gere ${count} posts para Twitter para a persona "${persona.name}" (${persona.handle}).
Tom: ${persona.tone ?? 'informativo'}.
Tópicos da persona: ${topics.join(', ')}.
Foco no tópico: ${topic ?? topics[0] ?? 'geral'}.
Idioma: Português-BR.
Máximo 280 caracteres cada. Inclua hashtags relevantes.${tweetContext}${rssContext}${trendsContext}${tweetStyleInstruction}
${!tweetContext && (rssContext || trendsContext) ? '\nCrie posts originais inspirados nos dados acima, adaptando ao tom e estilo da persona.\n' : ''}Retorne APENAS um JSON array: [{ "content": "...", "hashtags": ["..."] }]`

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    const geminiBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1536,
      },
    }

    let geminiResponse: Response
    try {
      geminiResponse = await callGeminiWithRetry(geminiUrl, geminiBody, geminiApiKey)
    } catch (err) {
      console.error('Gemini API error after retries:', err)
      return new Response(JSON.stringify({ error: 'Gemini API error', details: 'Falha após múltiplas tentativas. Verifique a configuração da API.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      return new Response(JSON.stringify({ error: 'Gemini API error', details: 'Verifique a configuração da API' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiData = await geminiResponse.json()
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'

    // Extract JSON from response using multiple patterns
    const generatedPosts = extractJsonArray(responseText)
    if (!generatedPosts) {
      return new Response(JSON.stringify({ error: 'Failed to parse Gemini response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!Array.isArray(generatedPosts)) {
      return new Response(JSON.stringify({ error: 'AI response is not an array' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Filter, sanitize, and deduplicate posts
    const validPosts = generatedPosts
      .filter((p) => typeof p.content === 'string' && p.content.length > 0)
      .map((p) => ({ ...p, content: sanitizeContent(p.content) }))
      .filter((p) => p.content.length <= 280)
      .filter((p) => !existingContents.has(p.content.toLowerCase().trim()))

    if (validPosts.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhum post válido gerado (duplicados, vazios ou excedendo 280 caracteres)' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert posts
    const sourceName = selectedSourceName
      ? `Gemini AI + ${selectedSourceName}`
      : `Gemini AI (${model})`

    const { data: insertedPosts, error: insertError } = await supabase
      .from('posts')
      .insert(
        validPosts.map((p) => ({
          persona_id,
          content: p.content,
          status: 'pending',
          source: 'claude_ai',
          source_name: sourceName,
          hashtags: p.hashtags ?? [],
        }))
      )
      .select()

    if (insertError) {
      return new Response(JSON.stringify({ error: 'Failed to insert posts', details: insertError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log activity (best-effort, don't block the response)
    try {
      await supabase.from('activities').insert({
        user_id: user.id,
        persona_id,
        type: 'ai_generated',
        description: `${model} gerou ${validPosts.length} novos posts`,
      })
    } catch {
      // Activity logging is non-critical
    }

    return new Response(JSON.stringify({ posts: insertedPosts }), {
      headers: addRateLimitHeaders({ ...corsHeaders, 'Content-Type': 'application/json' }, rateLimitResult),
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
