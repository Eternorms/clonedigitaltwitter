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

    const { post_id } = await req.json()

    // Fetch post with persona
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*, personas(twitter_access_token, twitter_connected, name)')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const persona = post.personas as unknown as {
      twitter_access_token: string | null
      twitter_connected: boolean
      name: string
    }

    if (!persona?.twitter_connected || !persona?.twitter_access_token) {
      return new Response(JSON.stringify({ error: 'Twitter not connected for this persona' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Publish to Twitter API v2
    const twitterResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${persona.twitter_access_token}`,
      },
      body: JSON.stringify({ text: post.content }),
    })

    if (!twitterResponse.ok) {
      const errorText = await twitterResponse.text()
      return new Response(JSON.stringify({ error: 'Twitter API error', details: errorText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const twitterData = await twitterResponse.json()
    const tweetId = twitterData.data?.id

    // Update post status
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        twitter_post_id: tweetId,
      })
      .eq('id', post_id)

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update post', details: updateError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log activity
    await supabase.from('activities').insert({
      user_id: user.id,
      persona_id: post.persona_id,
      type: 'post_published',
      description: `Post publicado no Twitter via ${persona.name}`,
    })

    return new Response(JSON.stringify({ tweet_id: tweetId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
