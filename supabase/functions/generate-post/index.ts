import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, rateLimitResponse, addRateLimitHeaders, RATE_LIMITS } from '../_shared/rate-limit.ts'

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

    // Rate limiting: 10 requests per minute per user
    const rateLimitResult = checkRateLimit(`generate:${user.id}`, RATE_LIMITS.generatePost)
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders)
    }

    const body = await req.json()
    const { persona_id, topic, model: requestedModel, rss_source_id } = body

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

    const topics = (persona.topics as string[]) ?? []
    const prompt = `Gere ${count} posts para Twitter para a persona "${persona.name}" (${persona.handle}).
Tom: ${persona.tone ?? 'informativo'}.
Tópicos da persona: ${topics.join(', ')}.
Foco no tópico: ${topic ?? topics[0] ?? 'geral'}.
Idioma: Português-BR.
Máximo 280 caracteres cada. Inclua hashtags relevantes.${rssContext}${trendsContext}
${rssContext || trendsContext ? '\nCrie posts originais inspirados nos dados acima, adaptando ao tom e estilo da persona.\n' : ''}Retorne APENAS um JSON array: [{ "content": "...", "hashtags": ["..."] }]`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
          },
        }),
      },
    )

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

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Failed to parse Gemini response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let generatedPosts: { content: string; hashtags: string[] }[]
    try {
      generatedPosts = JSON.parse(jsonMatch[0])
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse AI response as JSON' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!Array.isArray(generatedPosts)) {
      return new Response(JSON.stringify({ error: 'AI response is not an array' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Filter out posts exceeding 280 characters
    const validPosts = generatedPosts.filter(
      (p) => typeof p.content === 'string' && p.content.length > 0 && p.content.length <= 280
    )

    if (validPosts.length === 0) {
      return new Response(JSON.stringify({ error: 'All generated posts exceeded 280 characters' }), {
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
