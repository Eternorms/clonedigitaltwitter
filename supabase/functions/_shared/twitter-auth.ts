/**
 * Shared Twitter OAuth 1.0a utilities.
 * Used by publish-post (POST) and fetch-tweets (GET).
 */

/** Percent-encode per RFC 3986 */
export function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

/** HMAC-SHA1 using Web Crypto API */
export async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Generate OAuth 1.0a Authorization header.
 * For GET requests with query parameters, pass them via `queryParams`
 * so they are included in the OAuth signature base string (required by Twitter).
 */
export async function buildOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
  queryParams?: Record<string, string>,
): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  }

  // Combine oauth params with query params for signature base string
  const allParams: Record<string, string> = { ...oauthParams }
  if (queryParams) {
    for (const [k, v] of Object.entries(queryParams)) {
      allParams[k] = v
    }
  }

  // Sort all params and build param string
  const sortedKeys = Object.keys(allParams).sort()
  const paramString = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&')

  // Create signature base string
  const signatureBase = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`

  // Create signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`

  // Compute HMAC-SHA1 signature
  oauthParams.oauth_signature = await hmacSha1(signingKey, signatureBase)

  // Build header string (only oauth_ params, not query params)
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ')

  return `OAuth ${headerParts}`
}
