# Proposta: Geracao de Posts Baseada no Historico de Tweets

**Data:** 2026-02-06
**Autor:** Agente Researcher
**Status:** Proposta

---

## 1. Problema Atual

O sistema de geracao de posts (`generate-post` Edge Function) cria conteudo baseado em:
- **Metadados da persona** (nome, handle, tom, topicos)
- **Artigos RSS** (opcionais, como inspiracao)
- **Google Trends Brasil** (tendencias de busca)
- **Deduplicacao** contra os ultimos 50 posts

**O que falta:** O sistema nunca le os tweets reais do usuario. Os posts sao gerados a partir de descricoes abstratas ("tom: informativo", "topicos: IA, startups"), mas nunca a partir do vocabulario real, padroes de hashtags, estrutura de frases, uso de emojis, ou estilo de engajamento da pessoa.

Resultado: posts genericos que soam como "IA escrevendo sobre o topico X" em vez de "essa pessoa escrevendo sobre o topico X".

---

## 2. Twitter API v2 — Restricoes e Viabilidade

### 2.1. Tiers e Precos (Atualizado 2025/2026)

| Tier | Preco/mes | Leitura de Tweets | Escrita | Endpoints de Timeline |
|------|-----------|--------------------|---------|-----------------------|
| **Free** | $0 | ~100 posts/mes (extremamente limitado) | 1.500 tweets/mes | NAO disponivel |
| **Basic** | $200 | 10.000-15.000 posts/mes | 50.000 tweets/mes | `GET /2/users/:id/tweets` disponivel |
| **Pro** | $5.000 | 1M posts/mes | 300.000 tweets/mes | Todos os endpoints |

**Conclusao:** O tier Free NAO permite leitura de timeline. Para esta feature, o projeto precisa no minimo do tier Basic ($200/mes).

### 2.2. Endpoint Principal: `GET /2/users/:id/tweets`

```
GET https://api.twitter.com/2/users/:id/tweets
  ?tweet.fields=public_metrics,entities,created_at,lang
  &max_results=100
  &exclude=retweets,replies
```

**Dados retornados por tweet:**
- `text` — Conteudo do tweet
- `public_metrics` — `{ like_count, retweet_count, reply_count, impression_count }`
- `entities` — `{ hashtags, mentions, urls, cashtags }`
- `created_at` — Timestamp
- `lang` — Idioma detectado

**Rate limits (Basic tier):**
- 180 requests / 15 minutos por usuario
- Maximo 100 tweets por request (`max_results=100`)
- Paginacao com `pagination_token` para historico mais longo

### 2.3. Autenticacao

O sistema ja usa **OAuth 1.0a** para publicar tweets (`publish-post` Edge Function). O mesmo par de credenciais (consumer key/secret + access token/secret) pode ser reutilizado para leitura, pois OAuth 1.0a User Context e suportado no endpoint `GET /2/users/:id/tweets`.

**Nenhuma autenticacao adicional necessaria.**

### 2.4. Otimizacao de Uso da API

- Usar `since_id` para buscar apenas tweets novos (evita reprocessar tweets ja cacheados)
- Cachear tweets no Supabase para evitar chamadas repetidas
- Buscar uma vez por dia ou sob demanda manual (nao em cada geracao)

---

## 3. Propostas de Melhoria

### 3.1. TWEET FETCHING — Nova Edge Function `fetch-tweets`

**Objetivo:** Buscar e cachear os tweets recentes do usuario no Supabase.

**Fluxo:**
1. Recebe `persona_id` via request body
2. Busca `twitter_user_id` da persona (campo ja existe no schema)
3. Chama `GET /2/users/:id/tweets` com:
   - `tweet.fields=public_metrics,entities,created_at,lang`
   - `exclude=retweets,replies` (apenas tweets originais)
   - `max_results=100`
   - `since_id` (ultimo tweet cacheado, se existir)
4. Insere tweets na nova tabela `cached_tweets`
5. Retorna contagem de tweets novos cacheados

**Nova tabela: `cached_tweets`**
```sql
CREATE TABLE cached_tweets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  twitter_tweet_id TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  retweet_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  impression_count INTEGER DEFAULT 0,
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  lang TEXT,
  tweeted_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para queries frequentes
CREATE INDEX idx_cached_tweets_persona ON cached_tweets(persona_id);
CREATE INDEX idx_cached_tweets_performance ON cached_tweets(persona_id, like_count DESC);

-- RLS
ALTER TABLE cached_tweets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own persona tweets"
  ON cached_tweets FOR SELECT
  USING (persona_id IN (SELECT id FROM personas WHERE user_id = auth.uid()));
```

**Rate limit sugerido:** 5 requests/hora por usuario (para nao estourar o limite mensal do Basic tier).

**Estimativa de consumo:** Com 100 tweets/request e 5 requests/dia, um usuario cachearia ~500 tweets/dia = ~15.000/mes, dentro do limite Basic.

### 3.2. STYLE ANALYSIS — Funcao `analyzeWritingStyle()`

**Objetivo:** Extrair padroes de escrita dos tweets cacheados para injetar no prompt da IA.

**Metricas extraidas:**
```typescript
interface WritingStyleProfile {
  avgLength: number           // Comprimento medio dos tweets
  medianLength: number        // Mediana (evita outliers)
  hashtagFrequency: number    // % de tweets com hashtags
  avgHashtagsPerTweet: number // Media de hashtags por tweet
  topHashtags: string[]       // Top 10 hashtags mais usadas
  emojiFrequency: number      // % de tweets com emojis
  questionRatio: number       // % de tweets que sao perguntas
  ctaRatio: number            // % de tweets com call-to-action
  threadRatio: number         // % de tweets que iniciam threads
  mentionFrequency: number    // % de tweets com @mentions
  urlFrequency: number        // % de tweets com links
  avgWordsPerTweet: number    // Media de palavras
  sentencePatterns: string[]  // Ex: "Pergunta retorica + afirmacao"
  topWords: string[]          // Vocabulario mais frequente (excl. stopwords)
  punctuationStyle: string    // Ex: "Usa muitas exclamacoes", "Minimalista"
  languageDistribution: Record<string, number> // % por idioma
}
```

**Implementacao:** Funcao pura em TypeScript, executada dentro da Edge Function `generate-post` (nao precisa de endpoint separado). Processa os dados ja cacheados no Supabase.

**Deteccao de padroes:**
- **CTA:** regex para "Confira", "Veja", "Acesse", "Link na bio", "Saiba mais"
- **Perguntas:** tweets terminando com `?`
- **Emojis:** regex Unicode `[\u{1F600}-\u{1F9FF}]`
- **Threads:** tweets comecando com numero ("1/", "1.", "Thread:")

### 3.3. PROMPT ENHANCEMENT — Injecao de Estilo no Gemini

**Objetivo:** Enriquecer o prompt da IA com exemplos reais e perfil de estilo.

**Formato do prompt melhorado:**
```
Gere ${count} posts para Twitter para a persona "${persona.name}" (${persona.handle}).

=== PERFIL DE ESTILO (baseado nos ultimos ${tweetCount} tweets reais) ===
- Comprimento medio: ${avgLength} caracteres
- Usa hashtags em ${hashtagFrequency}% dos tweets (media: ${avgHashtags} por tweet)
- Hashtags favoritas: ${topHashtags.join(', ')}
- Usa emojis em ${emojiFrequency}% dos tweets
- Faz perguntas em ${questionRatio}% dos tweets
- Inclui call-to-action em ${ctaRatio}% dos tweets
- Palavras-chave recorrentes: ${topWords.join(', ')}

=== EXEMPLOS REAIS (tweets com maior engajamento) ===
${topPerformingTweets.map(t => `- "${t.content}" (${t.like_count} likes, ${t.retweet_count} RTs)`).join('\n')}

=== EXEMPLOS DE ESTILO (tweets recentes) ===
${recentTweets.slice(0, 5).map(t => `- "${t.content}"`).join('\n')}

=== INSTRUCOES ===
Tom: ${persona.tone ?? 'informativo'}.
Topicos da persona: ${topics.join(', ')}.
Foco no topico: ${topic ?? topics[0] ?? 'geral'}.
Idioma: Portugues-BR.
Maximo 280 caracteres cada.
IMPORTANTE: Imite o estilo de escrita dos exemplos acima. Use o mesmo padrao de hashtags,
emojis e estrutura de frase. O objetivo e que o tweet pareca escrito pela propria pessoa.
${rssContext}${trendsContext}
Retorne APENAS um JSON array: [{ "content": "...", "hashtags": ["..."] }]
```

**Selecao de tweets para o prompt:**
- **Top 5 por engajamento** (likes + retweets) — mostra o que funciona
- **5 mais recentes** — mostra o estilo atual
- **Maximo 10 tweets no prompt** para nao estourar tokens

### 3.4. CACHE STRATEGY — Armazenamento no Supabase

**Frequencia de atualizacao:**
- **Sob demanda:** Botao "Atualizar tweets" na UI (chama `fetch-tweets`)
- **Automatico via pg_cron:** 1x por dia para cada persona ativa com Twitter conectado
- **Na geracao:** Se cache > 24h, busca novos tweets antes de gerar

**Economia de API:**
- Com `since_id`, cada chamada retorna apenas tweets novos
- Um usuario tipico posta 1-5 tweets/dia = 5-35 tweets novos/semana
- Uma chamada semanal seria suficiente para manter o cache atualizado

**Limpeza:**
- Manter maximo de 500 tweets por persona (mais antigos removidos)
- Registrar `last_tweet_fetch_at` na tabela `personas`

**Coluna nova em `personas`:**
```sql
ALTER TABLE personas ADD COLUMN last_tweet_fetch_at TIMESTAMPTZ;
```

### 3.5. UI CHANGES — Toggle "Baseado nos seus tweets"

**Local:** Modal `GenerateAIModal` (componente existente)

**Mudancas:**
1. Novo toggle/checkbox: "Basear no meu estilo de tweets"
2. Quando ativado:
   - Mostra badge "N tweets cacheados" (ou "Nenhum tweet — buscar agora")
   - Botao "Atualizar tweets" se cache > 24h
   - Desabilita se persona nao tem `twitter_user_id`
3. Passa flag `use_tweet_style: true` para a Edge Function `generate-post`
4. Se nao ha tweets cacheados, mostra aviso e oferece buscar

**Novo campo no request body de `generate-post`:**
```typescript
interface GeneratePostRequest {
  persona_id: string
  topic?: string
  count?: number
  rss_source_id?: string
  use_tweet_style?: boolean  // NOVO
}
```

**Estado do toggle:** Salvo em `localStorage` por persona (preferencia do usuario).

### 3.6. ENGAGEMENT LEARNING — Aprendizado por Metricas

**Objetivo:** Identificar que tipo de conteudo performa melhor e priorizar esses padroes.

**Dados disponiveis via `public_metrics`:**
- `like_count` — Indicador de aprovacao
- `retweet_count` — Indicador de compartilhamento
- `reply_count` — Indicador de conversacao
- `impression_count` — Alcance

**Score de engajamento:**
```typescript
function engagementScore(tweet: CachedTweet): number {
  // Peso: likes (3x) + retweets (5x) + replies (2x)
  // Normalizado por impressions se disponivel
  const raw = (tweet.like_count * 3) + (tweet.retweet_count * 5) + (tweet.reply_count * 2)
  if (tweet.impression_count > 0) {
    return raw / tweet.impression_count * 1000 // engagement rate per 1k impressions
  }
  return raw
}
```

**Uso no prompt:**
- Os 5 tweets com maior score sao incluidos como "exemplos de alto desempenho"
- A IA recebe instrucao explicita: "Priorize o estilo dos exemplos de alto engajamento"

**Analise de padroes de sucesso:**
```
=== O QUE FUNCIONA MELHOR ===
- Tweets com hashtags tem ${withHashtags}% mais engajamento
- Perguntas tem ${questionsEngagement}x mais replies
- Tweets com emojis tem ${withEmojis}% mais likes
- Tamanho ideal: ${idealLength} caracteres (range: ${minIdeal}-${maxIdeal})
```

---

## 4. Impacto no Sistema Atual

### 4.1. Arquivos Modificados

| Arquivo | Tipo de Mudanca |
|---------|-----------------|
| `supabase/functions/generate-post/index.ts` | Logica de prompt + busca de tweets cacheados |
| `supabase/functions/_shared/types.ts` | Novos tipos (CachedTweet, WritingStyle, etc.) |
| `supabase/functions/_shared/rate-limit.ts` | Novo rate limit config para fetch-tweets |
| `dashboard/src/components/queue/GenerateAIModal.tsx` | Toggle + estado de cache |
| `dashboard/src/lib/supabase/mutations.ts` | Nova funcao `fetchTweets()` |
| `dashboard/src/lib/supabase/database.types.ts` | Tipos da nova tabela |
| `dashboard/src/types/index.ts` | Novos tipos frontend |

### 4.2. Arquivos Novos

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/fetch-tweets/index.ts` | Nova Edge Function para buscar tweets |
| `supabase/migrations/XXXXXX_create_cached_tweets.sql` | Nova tabela + RLS + indices |
| `supabase/migrations/XXXXXX_add_last_tweet_fetch.sql` | Coluna nova em personas |
| `supabase/functions/_shared/style-analyzer.ts` | Analise de estilo de escrita |

### 4.3. Variaveis de Ambiente Novas

Nenhuma. As credenciais OAuth 1.0a ja existem (`TWITTER_API_KEY`, `TWITTER_ACCESS_TOKEN`, etc.). O Bearer Token (`TWITTER_BEARER_TOKEN`) ja esta documentado como opcional no CLAUDE.md. Para leitura via OAuth 1.0a User Context, as credenciais existentes sao suficientes.

### 4.4. Custo Adicional

- **Twitter API Basic tier:** $200/mes (se atualmente no Free)
- **Supabase:** Aumento minimo de storage (500 tweets * ~500 bytes = ~250KB por persona)

---

## 5. Priorizacao Sugerida

### Fase 1 — MVP (Escopo minimo viavel)
1. Migration: tabela `cached_tweets` + coluna `last_tweet_fetch_at`
2. Edge Function `fetch-tweets` (busca + cache basico)
3. Modificar `generate-post` para injetar exemplos de tweets no prompt
4. Toggle na UI `GenerateAIModal`

### Fase 2 — Analise de Estilo
5. `style-analyzer.ts` com metricas completas
6. Injecao do perfil de estilo no prompt
7. UI mostrando resumo do estilo ("Voce usa emojis em 40% dos tweets")

### Fase 3 — Engagement Learning
8. Score de engajamento e selecao de top performers
9. Analise de padroes de sucesso
10. Dashboard de insights ("Seus tweets com perguntas tem 3x mais replies")

---

## 6. Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Free tier nao permite leitura | Documentar requisito de Basic tier ($200/mes); feature e gracefully degraded |
| Rate limit da API estourado | Cache agressivo + `since_id` + rate limit interno de 5 req/hora |
| Tweets antigos removidos pelo usuario | Cache local preserva historico; nao re-publicar conteudo deletado |
| Privacidade dos tweets cacheados | RLS garante que apenas o dono acessa; deletar cache ao desconectar Twitter |
| Prompt muito longo com muitos exemplos | Limitar a 10 tweets no prompt; usar resumo estatistico em vez de texto completo |
| Twitter muda API/precos | Abstrair chamadas em modulo separado; feature e opcional (toggle off por padrao) |

---

## 7. Metricas de Sucesso

- **Qualidade percebida:** Survey/rating nos posts gerados (1-5 estrelas)
- **Taxa de aprovacao:** % de posts gerados que sao aprovados (vs. rejeitados)
- **Engajamento pos-publicacao:** Comparar likes/RTs de posts "com estilo" vs "sem estilo"
- **Uso da feature:** % de geracoes com toggle "Baseado nos seus tweets" ativado

---

## 8. Estimativa de Complexidade

| Componente | Complexidade | Arquivos |
|------------|-------------|----------|
| Tabela + migrations | Baixa | 2 SQL files |
| Edge Function `fetch-tweets` | Media | 1 file (~150 LOC) |
| Style analyzer | Media | 1 file (~200 LOC) |
| Modificar `generate-post` | Media | 1 file (+ ~80 LOC) |
| UI toggle + estado | Baixa | 2 files (+ ~50 LOC) |
| Tipos compartilhados | Baixa | 3 files (+ ~40 LOC) |
| **Total** | **Media** | **~520 LOC novos** |
