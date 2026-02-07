import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'
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

// Percent-encode per RFC 3986
function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

// HMAC-SHA1 using Web Crypto API
async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  return base64Encode(new Uint8Array(signature))
}

// Generate OAuth 1.0a Authorization header
async function buildOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  }

  // Sort params and build param string
  const sortedKeys = Object.keys(oauthParams).sort()
  const paramString = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join('&')

  // Create signature base string
  const signatureBase = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`

  // Create signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`

  // Compute HMAC-SHA1 signature
  oauthParams.oauth_signature = await hmacSha1(signingKey, signatureBase)

  // Build header string
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ')

  return `OAuth ${headerParts}`
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

    // Rate limiting: 30 tweets per 15 minutes per user
    const rateLimitResult = checkRateLimit(`publish:${user.id}`, RATE_LIMITS.publishPost)
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders)
    }

    const { post_id } = await req.json()

    // Validate post_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!post_id || typeof post_id !== 'string' || !uuidRegex.test(post_id)) {
      return new Response(JSON.stringify({ error: 'Invalid post_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch post with persona, verifying ownership through personas.user_id
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*, personas!inner(name, user_id)')
      .eq('id', post_id)
      .eq('personas.user_id', user.id)
      .single()

    if (postError || !post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify post status is publishable
    if (post.status !== 'approved' && post.status !== 'scheduled') {
      return new Response(JSON.stringify({ error: 'Post must be approved or scheduled to publish' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const persona = post.personas as unknown as { name: string; user_id: string }

    // Read Twitter OAuth 1.0a credentials from env vars
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

    // Publish to Twitter API v2 with OAuth 1.0a
    const twitterUrl = 'https://api.twitter.com/2/tweets'
    const oauthHeader = await buildOAuthHeader(
      'POST',
      twitterUrl,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret,
    )

    const twitterResponse = await fetch(twitterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': oauthHeader,
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

    // Log activity (best-effort, don't block the response)
    try {
      await supabase.from('activities').insert({
        user_id: user.id,
        persona_id: post.persona_id,
        type: 'post_published',
        description: `Post publicado no Twitter via ${persona?.name ?? 'persona'}`,
      })
    } catch {
      // Activity logging is non-critical
    }

    return new Response(JSON.stringify({ tweet_id: tweetId }), {
      headers: addRateLimitHeaders({ ...corsHeaders, 'Content-Type': 'application/json' }, rateLimitResult),
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
