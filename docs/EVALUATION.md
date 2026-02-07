# Avaliacao: Proposta de Geracao Baseada em Tweets

**Data:** 2026-02-06
**Avaliador:** Agente Evaluator
**Status:** Avaliado e Priorizado

---

## 0. Descoberta Critica da Avaliacao

Antes de avaliar cada proposta, identifiquei um fato arquitetural que o pesquisador nao destacou claramente:

**A autenticacao Twitter e GLOBAL, nao por persona.**

- `publish-post` usa `Deno.env.get('TWITTER_ACCESS_TOKEN')` (variavel de ambiente global)
- As colunas `twitter_access_token` e `twitter_refresh_token` foram **removidas** na migration `00010_remove_twitter_oauth_columns.sql`
- Apenas `twitter_user_id` e `twitter_connected` permanecem na tabela `personas`

**Implicacao:** A funcao `fetch-tweets` proposta pode reutilizar as mesmas credenciais globais OAuth 1.0a, mas so consegue ler tweets da conta vinculada a essas credenciais. Se o usuario tiver multiplas personas apontando para contas Twitter diferentes, a leitura so funciona para a conta cujo access token esta configurado.

**Decisao:** Isso NAO bloqueia a implementacao (o caso de uso primario e uma unica conta Twitter), mas deve ser documentado como limitacao e considerado no design.

---

## 1. Avaliacao por Proposta

### 1.1. FETCH-TWEETS Edge Function

| Criterio | Nota | Justificativa |
|----------|------|---------------|
| **Viabilidade** | 4/5 | OAuth 1.0a ja configurado; endpoint documentado; `twitter_user_id` existe no schema. Desconto de 1 ponto porque requer Basic tier ($200/mes) — sem ele a feature nao funciona. |
| **Impacto** | 5/5 | Fundacao para tudo. Sem tweets cacheados, nenhuma outra proposta funciona. |
| **Complexidade** | 2/3 (Media) | ~150 LOC; requer buildOAuthHeader (pode copiar de publish-post), paginacao, upsert com `since_id`. Nada novo, mas varios edge cases. |
| **Risco** | 1/3 (Baixo) | Cache local isola de mudancas na API; `since_id` evita desperdicio; RLS protege dados. Unico risco real: custo do Basic tier. |

**Veredito: MUST HAVE (Fase 1)**

**Notas do avaliador:**
- A funcao `buildOAuthHeader()` de `publish-post` deve ser extraida para `_shared/twitter-auth.ts` em vez de copiada (DRY)
- O rate limit sugerido de 5 req/hora e adequado (5 * 100 tweets * 24h = 12.000/dia, bem dentro do limite Basic)
- Precisa de INSERT policy na RLS (a proposta so tem SELECT) — a Edge Function usa service_role_key, entao ok para insercao, mas adicionar INSERT policy via service role e boa pratica

---

### 1.2. STYLE ANALYSIS (`analyzeWritingStyle()`)

| Criterio | Nota | Justificativa |
|----------|------|---------------|
| **Viabilidade** | 5/5 | Funcao pura TypeScript, sem dependencias externas. Processa dados ja cacheados. Zero risco tecnico. |
| **Impacto** | 3/5 | Melhora o prompt, mas o impacto marginal sobre "apenas injetar exemplos" (proposta 3.3) e incerto. A IA ja consegue inferir estilo a partir de exemplos sem metricas explicitas. |
| **Complexidade** | 2/3 (Media) | ~200 LOC; deteccao de CTA/perguntas/emojis/threads e straightforward. `topWords` requer stopword list para pt-BR. |
| **Risco** | 1/3 (Baixo) | Nenhum risco externo. Pior caso: metricas incorretas no prompt que confundem a IA. |

**Veredito: NICE TO HAVE (Fase 2)**

**Notas do avaliador:**
- Reduzir o escopo para as metricas que a IA realmente usa: `avgLength`, `hashtagFrequency`, `topHashtags`, `emojiFrequency`, `questionRatio`. Remover `sentencePatterns`, `punctuationStyle`, `languageDistribution` do MVP — over-engineering.
- A stopword list para pt-BR precisa ser embutida (~200 palavras), nao uma dependencia externa
- Considerar: o Gemini ja e bom em inferir estilo de exemplos. Testar se as metricas explicitas realmente melhoram a qualidade vs. so exemplos.

---

### 1.3. PROMPT ENHANCEMENT

| Criterio | Nota | Justificativa |
|----------|------|---------------|
| **Viabilidade** | 5/5 | Apenas modificar string de prompt + 2 queries ao Supabase. Zero dependencias novas. |
| **Impacto** | 5/5 | O core da feature. Mesmo sem style analysis, injetar 10 tweets reais no prompt transforma drasticamente a qualidade. |
| **Complexidade** | 1/3 (Baixa) | ~80 LOC adicionais no `generate-post`. Query de top 5 por engajamento + 5 recentes. Formatacao de string. |
| **Risco** | 1/3 (Baixo) | Unico risco: prompt longo demais. Mitigacao: limitar a 10 tweets e monitorar token usage. O `maxOutputTokens: 1024` ja e conservador. |

**Veredito: MUST HAVE (Fase 1)**

**Notas do avaliador:**
- O formato de prompt proposto e bom. Manter o bloco `=== EXEMPLOS REAIS ===` e `=== EXEMPLOS DE ESTILO ===` separados
- Na Fase 1, NAO incluir o bloco `=== PERFIL DE ESTILO ===` (depende de 3.2). Apenas exemplos brutos.
- Considerar aumentar `maxOutputTokens` de 1024 para 1536 para acomodar o prompt maior sem risco de truncamento
- Adicionar fallback: se nao ha tweets cacheados, gerar normalmente (comportamento atual)

---

### 1.4. CACHE STRATEGY

| Criterio | Nota | Justificativa |
|----------|------|---------------|
| **Viabilidade** | 5/5 | Supabase + tabela SQL + `since_id` e padrao bem estabelecido. |
| **Impacto** | 4/5 | Essencial para performance e economia de API. Sem cache, cada geracao custaria 1 chamada Twitter. |
| **Complexidade** | 1/3 (Baixa) | 2 migrations SQL + logica de `since_id` no fetch-tweets (ja coberto em 3.1). |
| **Risco** | 1/3 (Baixo) | Riscos de consistencia (tweets deletados pelo usuario ainda no cache) sao aceitaveis — o cache e inspiracao, nao republishing. |

**Veredito: MUST HAVE (Fase 1) — ja incluso na proposta 3.1**

**Notas do avaliador:**
- `pg_cron` para atualizacao diaria e **FUTURE**, nao Fase 1. Na Fase 1, apenas refresh manual (botao na UI) e refresh-if-stale (>24h) antes de gerar
- O limite de 500 tweets/persona e adequado. Implementar como `DELETE` dos mais antigos no `fetch-tweets` apos insert
- A coluna `last_tweet_fetch_at` em `personas` e boa — permite UI mostrar "Atualizado ha 3 horas"

---

### 1.5. UI TOGGLE

| Criterio | Nota | Justificativa |
|----------|------|---------------|
| **Viabilidade** | 5/5 | Componente React simples. Estado salvo em localStorage. Flag enviada no request body. |
| **Impacto** | 4/5 | Essencial para UX. O usuario precisa controlar quando usar o estilo. Sem o toggle, nao ha como desativar. |
| **Complexidade** | 1/3 (Baixa) | ~50 LOC adicionais no GenerateAIModal. Checkbox + badge + botao refresh. |
| **Risco** | 1/3 (Baixo) | Nenhum risco tecnico. UI gracefully degrades se nao ha tweets. |

**Veredito: MUST HAVE (Fase 1)**

**Notas do avaliador:**
- Toggle deve ser **OFF por padrao** (gera normalmente). Ativar so se persona tem `twitter_user_id` E tweets cacheados > 0
- Mostrar badge: "42 tweets cacheados" ou "Nenhum tweet — clique para buscar"
- Se persona nao tem `twitter_user_id`: toggle desabilitado com tooltip "Conecte o Twitter primeiro"
- `localStorage` key: `tweet_style_${personaId}` (per-persona preference)
- Botao "Atualizar tweets" deve chamar `fetch-tweets` e atualizar o badge inline

---

### 1.6. ENGAGEMENT LEARNING

| Criterio | Nota | Justificativa |
|----------|------|---------------|
| **Viabilidade** | 4/5 | Dados de `public_metrics` ja vem na response da API. Score e calculo puro. |
| **Impacto** | 3/5 | Melhoria incremental. A Fase 1 ja seleciona top 5 por likes+RTs. O score ponderado e normalizacao por impressions e refinamento. |
| **Complexidade** | 2/3 (Media) | A funcao `engagementScore()` e simples (~20 LOC). Mas a "analise de padroes de sucesso" (tweets com hashtags tem X% mais engajamento) e significativamente mais complexa (~100 LOC extra). |
| **Risco** | 1/3 (Baixo) | Risco de viés: se o usuario tem poucos tweets, a analise estatistica e pouco confiavel. Mitigar com minimo de 30 tweets para ativar. |

**Veredito: NICE TO HAVE (Fase 2 para score basico, Fase 3 para analise completa)**

**Notas do avaliador:**
- Na Fase 1, usar sort simples: `ORDER BY (like_count + retweet_count) DESC LIMIT 5` — sem score ponderado
- Na Fase 2, implementar `engagementScore()` com pesos e normalizacao por impressions
- Na Fase 3 (FUTURE), implementar correlacao estilo vs. engajamento e dashboard de insights
- A secao "O QUE FUNCIONA MELHOR" no prompt e Fase 3 — requer analise estatistica robusta

---

## 2. Priorizacao Final

### MUST HAVE (Fase 1 - Implementar agora)

Escopo: o minimo necessario para que a feature funcione e entregue valor.

| # | Componente | LOC Est. | Dependencias |
|---|-----------|----------|--------------|
| 1 | Migration: `cached_tweets` + `last_tweet_fetch_at` | ~40 | Nenhuma |
| 2 | Shared: extrair `buildOAuthHeader` para `_shared/twitter-auth.ts` | ~80 | Nenhuma |
| 3 | Edge Function: `fetch-tweets` (busca + cache + since_id + cleanup 500 max) | ~150 | #1, #2 |
| 4 | Modificar `generate-post`: query tweets cacheados + injetar no prompt | ~80 | #1 |
| 5 | Shared: novos tipos (`CachedTweet`, `FetchTweetsRequest`, etc.) | ~30 | Nenhuma |
| 6 | UI: toggle + badge + botao refresh no `GenerateAIModal` | ~60 | #3 |
| 7 | Client: nova mutation `fetchTweets()` + atualizar `database.types.ts` | ~20 | #3 |
| | **Total Fase 1** | **~460** | |

### NICE TO HAVE (Fase 2 - Apos validar Fase 1)

| # | Componente | LOC Est. | Dependencias |
|---|-----------|----------|--------------|
| 8 | `style-analyzer.ts` (versao reduzida: 6 metricas, nao 15) | ~120 | Fase 1 |
| 9 | Injetar perfil de estilo no prompt | ~30 | #8 |
| 10 | `engagementScore()` ponderado + normalizacao | ~30 | Fase 1 |
| | **Total Fase 2** | **~180** | |

### FUTURE (Fase 3 - Backlog)

| # | Componente | Justificativa para adiar |
|---|-----------|-------------------------|
| 11 | pg_cron para refresh diario | Complexidade infra; refresh manual e suficiente por ora |
| 12 | Analise de padroes de sucesso ("hashtags = +X% engajamento") | Requer base estatistica minima (30+ tweets); over-engineering para MVP |
| 13 | Dashboard de insights de estilo | Feature separada; nao e escopo da geracao de posts |
| 14 | Per-persona Twitter OAuth (multiplas contas) | Requer fluxo OAuth completo; arquitetura diferente |

---

## 3. Riscos Consolidados e Mitigacoes

| Risco | Severidade | Mitigacao |
|-------|-----------|-----------|
| **Basic tier obrigatorio ($200/mes)** | ALTA | Feature e 100% opcional (toggle OFF por padrao). Se usuario esta no Free tier, toggle desabilitado com mensagem clara. Documentar requisito. |
| **Credencial global vs. multi-persona** | MEDIA | Fase 1 aceita limitacao (1 conta). Documentar. Fase 3 (FUTURE) pode adicionar per-persona OAuth. |
| **Prompt excede limite de tokens** | BAIXA | Limitar a 10 tweets (5 top + 5 recentes). Cada tweet max 280 chars = ~2.800 chars extra. Gemini 2.0 Flash suporta 1M tokens de input. |
| **Twitter muda precos/API** | MEDIA | Abstrair chamadas Twitter em `_shared/twitter-auth.ts` + `fetch-tweets`. Feature e gracefully degraded (fallback para geracao normal). |
| **Cache de tweets deletados** | BAIXA | Cache e usado como inspiracao de estilo, nao para republicacao. Aceitavel. Limpar cache ao desconectar Twitter da persona. |
| **Rate limit Twitter estourado** | BAIXA | Rate limit interno de 5 req/hora + `since_id` incremental. Impossivel estourar com uso normal. |

---

## 4. Decisoes de Design para o Arquiteto

1. **Extrair `buildOAuthHeader`** de `publish-post` para `_shared/twitter-auth.ts`. Ambas as funcoes (`publish-post` e `fetch-tweets`) devem importar deste modulo.

2. **`fetch-tweets` usa service_role_key** para inserir no `cached_tweets` (igual ao `generate-post`). A autenticacao do usuario e via JWT no header.

3. **`generate-post` condicional**: se `use_tweet_style: true` E existem tweets cacheados, injetar no prompt. Senao, gerar normalmente (backward compatible).

4. **Selecao de tweets para prompt (Fase 1)**:
   - Top 5: `SELECT * FROM cached_tweets WHERE persona_id = $1 ORDER BY (like_count + retweet_count) DESC LIMIT 5`
   - Recentes 5: `SELECT * FROM cached_tweets WHERE persona_id = $1 ORDER BY tweeted_at DESC LIMIT 5`
   - Deduplicar (um tweet pode ser top E recente)

5. **Cleanup**: Apos inserts no `fetch-tweets`, deletar tweets mais antigos se count > 500 por persona.

6. **UI state**: Toggle em `localStorage`, badge com count de tweets cacheados (query `COUNT(*)` da tabela).

---

## 5. Criterios de Aceite para Fase 1

- [ ] Tabela `cached_tweets` criada com RLS, indices e FK CASCADE
- [ ] Coluna `last_tweet_fetch_at` adicionada a `personas`
- [ ] `fetch-tweets` busca tweets via Twitter API, cacheia no Supabase, responde com count
- [ ] `fetch-tweets` usa `since_id` para busca incremental
- [ ] `fetch-tweets` limpa tweets excedentes (max 500/persona)
- [ ] `generate-post` aceita `use_tweet_style: boolean` no request body
- [ ] Quando `use_tweet_style=true` E tweets existem: prompt inclui 10 exemplos reais
- [ ] Quando `use_tweet_style=true` E tweets NAO existem: gera normalmente (sem erro)
- [ ] Quando `use_tweet_style=false` ou omitido: comportamento atual inalterado
- [ ] UI: toggle "Basear no meu estilo de tweets" no GenerateAIModal
- [ ] UI: badge mostra contagem de tweets cacheados
- [ ] UI: botao "Atualizar" chama fetch-tweets e atualiza badge
- [ ] UI: toggle desabilitado se persona nao tem twitter_user_id
- [ ] `buildOAuthHeader` extraido para `_shared/twitter-auth.ts`
- [ ] Rate limit: fetch-tweets limitado a 5 req/hora por usuario
- [ ] Tipos TypeScript atualizados (shared e frontend)
- [ ] Todos os testes existentes continuam passando
