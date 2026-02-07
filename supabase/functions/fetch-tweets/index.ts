import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { checkRateLimit, rateLimitResponse, addRateLimitHeaders, RATE_LIMITS } from '../_shared/rate-limit.ts'
import { buildOAuthHeader } from '../_shared/twitter-auth.ts'

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

    // Rate limiting: 5 requests per hour per user
    const rateLimitResult = checkRateLimit(`fetch-tweets:${user.id}`, RATE_LIMITS.fetchTweets)
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders)
    }

    const { persona_id } = await req.json()

    // Validate persona_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!persona_id || typeof persona_id !== 'string' || !uuidRegex.test(persona_id)) {
      return new Response(JSON.stringify({ error: 'Invalid persona_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch persona (verify ownership, get twitter_user_id)
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('id, twitter_user_id, user_id')
      .eq('id', persona_id)
      .eq('user_id', user.id)
      .single()

    if (personaError || !persona) {
      return new Response(JSON.stringify({ error: 'Persona not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!persona.twitter_user_id) {
      return new Response(JSON.stringify({ count: 0, total: 0, message: 'No Twitter account linked' }), {
        headers: addRateLimitHeaders({ ...corsHeaders, 'Content-Type': 'application/json' }, rateLimitResult),
      })
    }

    // Read Twitter OAuth credentials
    const consumerKey = Deno.env.get('TWITTER_API_KEY')
    const consumerSecret = Deno.env.get('TWITTER_API_KEY_SECRET')
    const accessToken = Deno.env.get('TWITTER_ACCESS_TOKEN')
    const accessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET')

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      return new Response(JSON.stringify({ error: 'Twitter API credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Query most recent cached tweet for since_id
    const { data: latestCached } = await supabase
      .from('cached_tweets')
      .select('tweet_id')
      .eq('persona_id', persona_id)
      .order('tweeted_at', { ascending: false })
      .limit(1)
      .single()

    // Build Twitter API v2 request
    const baseUrl = `https://api.twitter.com/2/users/${persona.twitter_user_id}/tweets`
    const queryParams: Record<string, string> = {
      'max_results': '100',
      'tweet.fields': 'created_at,public_metrics',
      'exclude': 'retweets,replies',
    }

    if (latestCached?.tweet_id) {
      queryParams['since_id'] = latestCached.tweet_id
    }

    const oauthHeader = await buildOAuthHeader(
      'GET',
      baseUrl,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret,
      queryParams,
    )

    const queryString = Object.entries(queryParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')

    const twitterResponse = await fetch(`${baseUrl}?${queryString}`, {
      method: 'GET',
      headers: { 'Authorization': oauthHeader },
    })

    if (!twitterResponse.ok) {
      const errorText = await twitterResponse.text()
      console.error(`Twitter API error (${twitterResponse.status}):`, errorText)
      return new Response(JSON.stringify({
        error: 'Erro ao buscar tweets do Twitter',
        details: `HTTP ${twitterResponse.status}`,
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const twitterData = await twitterResponse.json()
    const rawTweets = twitterData.data

    let insertedCount = 0

    if (Array.isArray(rawTweets) && rawTweets.length > 0) {
      // Map to flat rows for upsert
      const rows = rawTweets.map((t: {
        id: string
        text: string
        created_at?: string
        public_metrics?: { like_count?: number; retweet_count?: number }
      }) => ({
        persona_id,
        tweet_id: t.id,
        text: t.text,
        tweeted_at: t.created_at ?? new Date().toISOString(),
        like_count: t.public_metrics?.like_count ?? 0,
        retweet_count: t.public_metrics?.retweet_count ?? 0,
      }))

      // Upsert tweets (update metrics on conflict)
      const { data: upserted } = await supabase
        .from('cached_tweets')
        .upsert(rows, { onConflict: 'persona_id,tweet_id' })
        .select('id')

      insertedCount = upserted?.length ?? rows.length
    }

    // Cleanup excess tweets (max 500 per persona)
    try {
      const { count: totalCount } = await supabase
        .from('cached_tweets')
        .select('id', { count: 'exact', head: true })
        .eq('persona_id', persona_id)

      if (totalCount && totalCount > 500) {
        // Get the IDs to keep (500 most recent)
        const { data: keepRows } = await supabase
          .from('cached_tweets')
          .select('id')
          .eq('persona_id', persona_id)
          .order('tweeted_at', { ascending: false })
          .limit(500)

        if (keepRows && keepRows.length > 0) {
          const keepIds = keepRows.map(r => r.id)
          await supabase
            .from('cached_tweets')
            .delete()
            .eq('persona_id', persona_id)
            .not('id', 'in', `(${keepIds.join(',')})`)
        }
      }
    } catch {
      // Cleanup failure is non-critical
    }

    // Update personas.last_tweet_fetch_at
    await supabase
      .from('personas')
      .update({ last_tweet_fetch_at: new Date().toISOString() })
      .eq('id', persona_id)

    // Get final total count
    const { count: finalCount } = await supabase
      .from('cached_tweets')
      .select('id', { count: 'exact', head: true })
      .eq('persona_id', persona_id)

    return new Response(JSON.stringify({ count: insertedCount, total: finalCount ?? 0 }), {
      headers: addRateLimitHeaders({ ...corsHeaders, 'Content-Type': 'application/json' }, rateLimitResult),
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
