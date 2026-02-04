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

    const { persona_id, topic, count = 3 } = await req.json()

    // Fetch persona for prompt context
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', persona_id)
      .single()

    if (personaError || !persona) {
      return new Response(JSON.stringify({ error: 'Persona not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Call Claude API
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
    if (!claudeApiKey) {
      return new Response(JSON.stringify({ error: 'Claude API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const topics = (persona.topics as string[]) ?? []
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Gere ${count} posts para Twitter para a persona "${persona.name}" (${persona.handle}).
Tom: ${persona.tone ?? 'informativo'}.
Tópicos da persona: ${topics.join(', ')}.
Foco no tópico: ${topic ?? topics[0] ?? 'geral'}.
Idioma: Português-BR.
Máximo 280 caracteres cada. Inclua hashtags relevantes.
Retorne APENAS um JSON array: [{ "content": "...", "hashtags": ["..."] }]`,
        }],
      }),
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      return new Response(JSON.stringify({ error: 'Claude API error', details: errorText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const claudeData = await claudeResponse.json()
    const responseText = claudeData.content?.[0]?.text ?? '[]'

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Failed to parse Claude response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const generatedPosts = JSON.parse(jsonMatch[0])

    // Insert posts
    const { data: insertedPosts, error: insertError } = await supabase
      .from('posts')
      .insert(
        generatedPosts.map((p: { content: string; hashtags: string[] }) => ({
          persona_id,
          content: p.content,
          status: 'pending',
          source: 'claude_ai',
          source_name: 'Claude AI',
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

    // Log activity
    await supabase.from('activities').insert({
      user_id: user.id,
      persona_id,
      type: 'ai_generated',
      description: `Claude gerou ${generatedPosts.length} novos posts`,
    })

    return new Response(JSON.stringify({ posts: insertedPosts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
