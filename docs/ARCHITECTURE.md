# Architecture: Tweet-Based Generation Feature (Fase 1)

## Overview

Enhance the AI post generation pipeline to use **real tweets from a persona's Twitter timeline** as few-shot examples, producing posts that authentically match the persona's actual writing style, vocabulary, and patterns.

**Scope**: Fase 1 only (as defined in EVALUATION.md). ~460 LOC across 10 files.

## Known Constraint: Global Twitter Auth

Twitter OAuth credentials are GLOBAL (`Deno.env.get('TWITTER_ACCESS_TOKEN')`), not per-persona. Migration 00010 removed per-persona tokens. The `fetch-tweets` function uses the same global credentials and can only read tweets from the one account those credentials belong to. This is acceptable for Fase 1 but must be documented in the UI.

## Current State

```
User clicks "Gerar com IA"
  -> GenerateAIModal.tsx collects: persona, topic, count, rss_source
  -> mutations.ts calls supabase.functions.invoke('generate-post')
  -> generate-post/index.ts:
     1. Auth + rate limit
     2. Fetch persona (name, handle, tone, topics)
     3. Fetch RSS context (optional)
     4. Fetch Google Trends (optional)
     5. Fetch existing posts (dedup)
     6. Build prompt with persona metadata only
     7. Call Gemini API
     8. Parse, validate, deduplicate, insert posts
```

**Problem**: The prompt only has persona *metadata* (name, tone, topics) -- no examples of how the persona *actually writes*. This produces generic posts that don't match the persona's real voice.

## Target State

```
User clicks "Atualizar tweets" (optional, or auto if stale >24h)
  -> mutations.ts calls supabase.functions.invoke('fetch-tweets')
  -> fetch-tweets/index.ts:
     1. Auth + rate limit (5 req/hour)
     2. Fetch persona (verify ownership, get twitter_user_id)
     3. Check since_id from most recent cached tweet
     4. Call Twitter API v2 GET /users/:id/tweets (incremental via since_id)
     5. Upsert new tweets into cached_tweets table
     6. Cleanup if >500 tweets per persona
     7. Update personas.last_tweet_fetch_at

User clicks "Gerar com IA" with toggle ON
  -> GenerateAIModal.tsx collects: persona, topic, count, rss_source, use_tweet_style
  -> mutations.ts calls supabase.functions.invoke('generate-post')
  -> generate-post/index.ts:
     1. Auth + rate limit
     2. Fetch persona
     3. **NEW: Query cached_tweets (top 5 by engagement + recent 5)**
     4. Fetch RSS context (optional)
     5. Fetch Google Trends (optional)
     6. Fetch existing posts (dedup)
     7. **ENHANCED: Build prompt with real tweet examples**
     8. Call Gemini API (maxOutputTokens: 1536)
     9. Parse, validate, deduplicate, insert posts
```

---

## Data Flow Diagram

```
                    +-------------------+
                    |   Dashboard UI    |
                    | GenerateAIModal   |
                    +--+----------+-----+
                       |          |
          "Atualizar"  |          |  "Gerar Posts"
          button       |          |  (use_tweet_style=true)
                       v          v
              +--------+--+  +----+---------+
              |fetch-tweets|  |generate-post |
              |   (EF)     |  |    (EF)      |
              +-----+------+  +---+----+-----+
                    |             |    |
         Twitter API v2     query |    | Gemini API
         GET /users/:id/   cached |    |
         tweets             tweets|    |
                    |             |    |
                    v             v    v
              +-----+-------------+----+
              |        Supabase DB      |
              |  cached_tweets table    |
              |  personas table         |
              |  posts table            |
              +-------------------------+
```

---

## Component Architecture

### 1. New Migration: `supabase/migrations/00011_cached_tweets.sql`

**Individual rows per tweet** (not JSONB array) -- enables SQL-level sorting, filtering, and incremental `since_id` fetching.

```sql
-- Cached tweets from Twitter API v2
create table public.cached_tweets (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  tweet_id varchar(30) not null,
  text text not null,
  tweeted_at timestamptz not null,
  like_count integer not null default 0,
  retweet_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Prevent duplicate tweets per persona
create unique index ix_cached_tweets_persona_tweet
  on public.cached_tweets(persona_id, tweet_id);

-- For "top by engagement" queries
create index ix_cached_tweets_engagement
  on public.cached_tweets(persona_id, ((like_count + retweet_count)) desc);

-- For "most recent" queries
create index ix_cached_tweets_recent
  on public.cached_tweets(persona_id, tweeted_at desc);

create trigger cached_tweets_updated_at
  before update on public.cached_tweets
  for each row execute function public.handle_updated_at();

-- RLS: read through owned personas
alter table public.cached_tweets enable row level security;

create policy "Users can read cached_tweets via owned personas"
  on public.cached_tweets for select
  using (
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

-- Service role for Edge Functions (fetch-tweets inserts/deletes)
create policy "Service role full access"
  on public.cached_tweets for all
  using (auth.role() = 'service_role');

-- Add last_tweet_fetch_at to personas for UI "updated X hours ago"
alter table public.personas
  add column last_tweet_fetch_at timestamptz;
```

**Design decisions:**
- **One row per tweet** (not JSONB blob): Enables `ORDER BY (like_count + retweet_count) DESC LIMIT 5` and `ORDER BY tweeted_at DESC LIMIT 5` at the SQL level.
- **Unique constraint on `(persona_id, tweet_id)`**: Prevents duplicates on re-fetch. Upsert with `ON CONFLICT DO UPDATE`.
- **`last_tweet_fetch_at` on personas**: Lets the UI show "Atualizado ha 3 horas" and `generate-post` detect staleness (>24h).
- **No `updated_at` column on cached_tweets**: Tweets are immutable after insert (only metrics might update, handled by upsert).
  - Actually, keep the trigger for consistency with the codebase pattern, even if rarely used.

### 2. New Shared Module: `supabase/functions/_shared/twitter-auth.ts`

Extract from `publish-post/index.ts` lines 17-81:

```typescript
// Percent-encode per RFC 3986
export function percentEncode(str: string): string

// HMAC-SHA1 using Web Crypto API
export async function hmacSha1(key: string, data: string): Promise<string>

// Generate OAuth 1.0a Authorization header
// queryParams is REQUIRED for GET requests -- Twitter includes them in signature
export async function buildOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
  queryParams?: Record<string, string>,
): Promise<string>
```

**Critical enhancement**: When `queryParams` is provided, merge them into the parameter string for signature computation:

```typescript
const allParams: Record<string, string> = { ...oauthParams }
if (queryParams) {
  for (const [k, v] of Object.entries(queryParams)) {
    allParams[k] = v
  }
}
const sortedKeys = Object.keys(allParams).sort()
const paramString = sortedKeys
  .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
  .join('&')
```

Without this, Twitter API v2 GET requests return 401.

### 3. New Edge Function: `supabase/functions/fetch-tweets/index.ts`

**Purpose**: Fetch recent tweets from a Twitter user's timeline, cache them individually, support incremental fetching via `since_id`.

**Endpoint**: `POST /fetch-tweets`
**Body**: `{ persona_id: string }`
**Auth**: Bearer token (verified via Supabase auth)
**Rate limit**: 5 requests per hour per user

**Logic:**
1. Verify auth + rate limit
2. Validate `persona_id` (UUID format)
3. Fetch persona (verify `personas.user_id = auth.uid()`, get `twitter_user_id`)
4. If no `twitter_user_id`: return `{ count: 0, message: 'No Twitter account linked' }`
5. Query most recent cached tweet for `since_id`:
   ```sql
   SELECT tweet_id FROM cached_tweets
   WHERE persona_id = $1
   ORDER BY tweeted_at DESC LIMIT 1
   ```
6. Call Twitter API v2:
   ```
   GET https://api.twitter.com/2/users/{twitter_user_id}/tweets
     ?max_results=100
     &tweet.fields=created_at,public_metrics
     &exclude=retweets,replies
     &since_id={since_id}  (if exists)
   ```
   Use `buildOAuthHeader` from `_shared/twitter-auth.ts` with query params
7. Map response to flat rows and upsert:
   ```sql
   INSERT INTO cached_tweets (persona_id, tweet_id, text, tweeted_at, like_count, retweet_count)
   VALUES ($1, $2, $3, $4, $5, $6)
   ON CONFLICT (persona_id, tweet_id) DO UPDATE SET
     like_count = EXCLUDED.like_count,
     retweet_count = EXCLUDED.retweet_count
   ```
8. Cleanup excess tweets (max 500 per persona):
   ```sql
   DELETE FROM cached_tweets
   WHERE persona_id = $1
   AND id NOT IN (
     SELECT id FROM cached_tweets
     WHERE persona_id = $1
     ORDER BY tweeted_at DESC
     LIMIT 500
   )
   ```
9. Update `personas.last_tweet_fetch_at = now()`
10. Return `{ count: <inserted_count>, total: <total_cached> }`

**Error handling**: Same pattern as other Edge Functions -- try/catch with JSON error responses and CORS headers.

### 4. Modified Edge Function: `supabase/functions/generate-post/index.ts`

**Changes:**
- Accept new body param: `use_tweet_style?: boolean` (default: `false` -- backward compatible)
- When `use_tweet_style === true`:
  1. Query top 5 tweets by engagement:
     ```sql
     SELECT text, like_count, retweet_count FROM cached_tweets
     WHERE persona_id = $1
     ORDER BY (like_count + retweet_count) DESC
     LIMIT 5
     ```
  2. Query 5 most recent tweets:
     ```sql
     SELECT text, like_count, retweet_count FROM cached_tweets
     WHERE persona_id = $1
     ORDER BY tweeted_at DESC
     LIMIT 5
     ```
  3. Deduplicate (a tweet can be both top and recent)
  4. Build `tweetContext` string
- When no cached tweets exist: generate normally (no error)
- Increase `maxOutputTokens` from 1024 to 1536

**Prompt structure with tweets:**
```
Gere ${count} posts para Twitter para a persona "${persona.name}" (${persona.handle}).
Tom: ${persona.tone ?? 'informativo'}.
Topicos da persona: ${topics.join(', ')}.
Foco no topico: ${topic ?? topics[0] ?? 'geral'}.
Idioma: Portugues-BR.
Maximo 280 caracteres cada. Inclua hashtags relevantes.

=== EXEMPLOS REAIS (tweets mais populares) ===
1. "Tweet text here" (42 likes, 5 RTs)
2. "Another tweet" (28 likes, 3 RTs)
...

=== EXEMPLOS RECENTES ===
6. "Recent tweet" (10 likes, 1 RT)
...

${rssContext}
${trendsContext}

IMPORTANTE: Imite o estilo, vocabulario e padroes de escrita dos tweets acima.
Mantenha o mesmo nivel de formalidade, uso de emojis, e estrutura de frase.
Crie posts ORIGINAIS que parecem ter sido escritos pela mesma pessoa.
Retorne APENAS um JSON array: [{ "content": "...", "hashtags": ["..."] }]
```

### 5. Shared Types: `supabase/functions/_shared/types.ts`

Add:
```typescript
/** Cached tweet row from cached_tweets table */
export interface CachedTweet {
  id: string
  persona_id: string
  tweet_id: string
  text: string
  tweeted_at: string
  like_count: number
  retweet_count: number
}

/** Request body for fetch-tweets Edge Function */
export interface FetchTweetsRequest {
  persona_id: string
}

/** Response from fetch-tweets Edge Function */
export interface FetchTweetsResponse {
  count: number
  total: number
}
```

### 6. Modified Rate Limits: `supabase/functions/_shared/rate-limit.ts`

Add to `RATE_LIMITS`:
```typescript
// Tweet fetching: 5 requests per hour per user
fetchTweets: { maxRequests: 5, windowSeconds: 3600 },
```

### 7. Modified: `supabase/functions/publish-post/index.ts`

- **DELETE** lines 16-81 (`percentEncode`, `hmacSha1`, `buildOAuthHeader`)
- **ADD** import: `import { buildOAuthHeader } from '../_shared/twitter-auth.ts'`
- No other logic changes -- the function call signature is identical

### 8. Frontend Type: `dashboard/src/types/index.ts`

Add to `Persona` interface:
```typescript
export interface Persona {
  id: string;
  name: string;
  handle: string;
  emoji: string;
  twitter_user_id?: string | null;  // NEW
}
```

### 9. Frontend Mutation: `dashboard/src/lib/supabase/mutations.ts`

Update `generateWithAI`:
```typescript
export async function generateWithAI(
  personaId: string,
  topic?: string,
  count: number = 3,
  rssSourceId?: string,
  useTweetStyle: boolean = false,  // NEW -- default OFF
) {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke('generate-post', {
    body: {
      persona_id: personaId,
      topic,
      count,
      rss_source_id: rssSourceId,
      use_tweet_style: useTweetStyle,
    },
  })
  if (error) throw error
  return data
}
```

Add new mutation:
```typescript
export async function fetchTweets(personaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke('fetch-tweets', {
    body: { persona_id: personaId },
  })
  if (error) throw error
  return data as { count: number; total: number }
}
```

### 10. Frontend UI: `dashboard/src/components/queue/GenerateAIModal.tsx`

**New state:**
```typescript
const [useTweetStyle, setUseTweetStyle] = useState(false); // OFF by default
const [tweetCount, setTweetCount] = useState(0);
const [fetchingTweets, setFetchingTweets] = useState(false);
```

**Persona twitter check:**
```typescript
const selectedPersona = personas.find(p => p.id === personaId);
const hasTwitter = !!selectedPersona?.twitter_user_id;
```

**Fetch tweet count when persona changes:**
```typescript
useEffect(() => {
  if (!personaId || !hasTwitter) { setTweetCount(0); return; }
  const supabase = createClient();
  supabase
    .from('cached_tweets')
    .select('id', { count: 'exact', head: true })
    .eq('persona_id', personaId)
    .then(({ count }) => setTweetCount(count ?? 0));
}, [personaId, hasTwitter]);
```

**Load toggle preference from localStorage:**
```typescript
useEffect(() => {
  if (personaId) {
    const saved = localStorage.getItem(`tweet_style_${personaId}`);
    setUseTweetStyle(saved === 'true');
  }
}, [personaId]);

// Save on toggle
const handleToggleTweetStyle = () => {
  const next = !useTweetStyle;
  setUseTweetStyle(next);
  localStorage.setItem(`tweet_style_${personaId}`, String(next));
};
```

**UI element** (between RSS source selector and topic input):
```tsx
{/* Tweet Style Toggle */}
<div className="p-3 bg-sky-50 rounded-xl space-y-2">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Twitter className="w-4 h-4 text-sky-500" />
      <span className="text-sm font-medium text-sky-700">
        Basear no meu estilo de tweets
      </span>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={useTweetStyle}
      onClick={handleToggleTweetStyle}
      disabled={!hasTwitter}
      className={`relative w-10 h-6 rounded-full transition-colors ${
        !hasTwitter ? 'bg-slate-100 cursor-not-allowed' :
        useTweetStyle ? 'bg-sky-500' : 'bg-slate-200'
      }`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
        useTweetStyle ? 'left-5' : 'left-1'
      }`} />
    </button>
  </div>

  {hasTwitter ? (
    <div className="flex items-center justify-between">
      <span className="text-xs text-sky-600">
        {tweetCount > 0
          ? `${tweetCount} tweets cacheados`
          : 'Nenhum tweet -- clique para buscar'}
      </span>
      <button
        type="button"
        onClick={handleRefreshTweets}
        disabled={fetchingTweets}
        className="text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors flex items-center gap-1"
      >
        <RefreshCw className={`w-3 h-3 ${fetchingTweets ? 'animate-spin' : ''}`} />
        Atualizar
      </button>
    </div>
  ) : (
    <p className="text-xs text-slate-400">
      Conecte o Twitter primeiro para usar esta funcao.
    </p>
  )}
</div>
```

**Refresh handler:**
```typescript
const handleRefreshTweets = async () => {
  setFetchingTweets(true);
  try {
    const result = await fetchTweets(personaId);
    setTweetCount(result.total);
    addToast(`${result.count} novos tweets carregados!`, 'success');
  } catch {
    addToast('Erro ao buscar tweets. Verifique a conexao Twitter.', 'error');
  } finally {
    setFetchingTweets(false);
  }
};
```

**Pass to generateWithAI:**
```typescript
await generateWithAI(personaId, topic || undefined, count, selectedSourceId || undefined, useTweetStyle);
```

**New imports:**
```typescript
import { Twitter, RefreshCw } from 'lucide-react'; // add to existing import
import { generateWithAI, fetchTweets } from '@/lib/supabase/mutations';
```

---

## File-by-File Implementation Plan (Ordered)

| # | File | Action | LOC Est. | Dependencies |
|---|------|--------|----------|--------------|
| 1 | `supabase/migrations/00011_cached_tweets.sql` | NEW | ~40 | None |
| 2 | `supabase/functions/_shared/twitter-auth.ts` | NEW | ~80 | None |
| 3 | `supabase/functions/_shared/types.ts` | MODIFY | ~30 | None |
| 4 | `supabase/functions/_shared/rate-limit.ts` | MODIFY | ~5 | None |
| 5 | `supabase/functions/publish-post/index.ts` | MODIFY | -65/+1 | #2 |
| 6 | `supabase/functions/fetch-tweets/index.ts` | NEW | ~150 | #1, #2, #3, #4 |
| 7 | `supabase/functions/generate-post/index.ts` | MODIFY | ~80 | #1, #3 |
| 8 | `dashboard/src/types/index.ts` | MODIFY | ~2 | None |
| 9 | `dashboard/src/lib/supabase/mutations.ts` | MODIFY | ~20 | #6 |
| 10 | `dashboard/src/components/queue/GenerateAIModal.tsx` | MODIFY | ~60 | #8, #9 |

**Total**: ~460 LOC net new

---

## Rate Limiting Strategy

| Operation | Limit | Window | Rationale |
|-----------|-------|--------|-----------|
| `generate-post` | 10 req | 60s | Existing (unchanged) |
| `fetch-tweets` | 5 req | 3600s (1h) | Twitter API v2 Basic: 10K tweets/month. 5/hr * 100 tweets * 24h = 12K/day max. Conservative. |
| `publish-post` | 30 req | 900s (15m) | Existing (unchanged) |

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| No `twitter_user_id` on persona | `fetch-tweets`: return `{ count: 0 }`. `generate-post`: skip tweet context. |
| Twitter API returns 401 | Log error, return error response from `fetch-tweets`. `generate-post`: generate without tweets. |
| Twitter API returns 429 | Log warning, return error. User sees "Rate limit, tente novamente em X minutos." |
| Twitter API network error | try/catch, return error from `fetch-tweets`. |
| No cached tweets when generating | Generate normally (existing behavior, no error). |
| Cache cleanup fails | Log warning, non-blocking. |
| `use_tweet_style=false` or omitted | Existing behavior, zero code paths touched. |

**Critical principle**: `generate-post` NEVER fails due to tweet fetching. All tweet logic is in try/catch with fallback to standard generation.

---

## Security Considerations

1. **Twitter OAuth creds stay in Edge Functions only** (env vars, never client-side)
2. **Persona ownership verified** in both `fetch-tweets` and `generate-post` (`personas.user_id = auth.uid()`)
3. **RLS on `cached_tweets`**: Users can only read cache for their own personas. Only service role can write.
4. **No PII leakage**: Tweet content is public data (from public timelines)
5. **Query param injection**: All Twitter API query params are hardcoded constants, not user-supplied
6. **Rate limiting**: 5 req/hour prevents abuse of Twitter API quota
7. **`since_id` is from DB** (not user-supplied): prevents parameter manipulation

---

## Acceptance Criteria (from EVALUATION.md)

- [ ] Table `cached_tweets` created with RLS, indices, FK CASCADE
- [ ] Column `last_tweet_fetch_at` added to `personas`
- [ ] `fetch-tweets` fetches tweets via Twitter API, caches in Supabase, responds with count
- [ ] `fetch-tweets` uses `since_id` for incremental fetching
- [ ] `fetch-tweets` cleans up tweets exceeding 500/persona
- [ ] `generate-post` accepts `use_tweet_style: boolean` in request body
- [ ] When `use_tweet_style=true` AND tweets exist: prompt includes 10 real examples
- [ ] When `use_tweet_style=true` AND NO tweets: generates normally (no error)
- [ ] When `use_tweet_style=false` or omitted: current behavior unchanged
- [ ] UI: toggle "Basear no meu estilo de tweets" in GenerateAIModal
- [ ] UI: badge shows cached tweet count
- [ ] UI: "Atualizar" button calls fetch-tweets and updates badge
- [ ] UI: toggle disabled if persona has no twitter_user_id
- [ ] `buildOAuthHeader` extracted to `_shared/twitter-auth.ts`
- [ ] Rate limit: fetch-tweets limited to 5 req/hour per user
- [ ] TypeScript types updated (shared and frontend)
- [ ] All existing tests continue passing
