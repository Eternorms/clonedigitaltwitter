# Contexto Atual do Projeto

## Status Geral
- **Fase atual:** Polimento (UI, Edge Functions, testes, infra/docs)
- **Ultima atualizacao:** 2026-02-06
- **Proxima tarefa:** Configurar projeto Supabase com chaves reais, deploy em producao

## Arquitetura

```
Cloudflare Pages                    Supabase
+----------------------------+      +------------------------------------+
|                            |      |                                    |
|  Next.js 14 (App Router)   |      |  Auth (email/password)             |
|  TypeScript                |      |  PostgreSQL (5 tabelas + RLS)      |
|  Tailwind CSS v3           | ---> |  Storage (post-images)             |
|  @supabase/ssr             |      |  Edge Functions (Deno):            |
|  SWR (data fetching)       |      |    - generate-post (Gemini AI)     |
|  Design System "Clean      |      |    - publish-post (Twitter API)    |
|    Studio"                 |      |    - sync-rss (RSS feeds)          |
+----------------------------+      |    - telegram-webhook (notif.)     |
                                    |  pg_cron (agendamento)             |
                                    |  Realtime (subscriptions)          |
                                    |                                    |
                                    +------------------------------------+
```

## O que esta funcionando

### Frontend
- [x] Supabase Auth integrado no Next.js (server + client + middleware)
- [x] Paginas de login e registro
- [x] Dashboard completo com 7 paginas conectadas ao Supabase
- [x] Componentes UI (Avatar, Badge, Button, Card, StatCard, Tabs, Modal, Toast)
- [x] PersonaContext para gerenciamento de persona ativa
- [x] ToastContext para notificacoes
- [x] Mutations para aprovar/rejeitar/agendar posts
- [x] Realtime subscriptions para atualizacoes em tempo real
- [x] Design System "Clean Studio" (Manrope, cores semanticas, glassmorphism sutil)
- [x] Responsividade e loading states
- [x] Cloudflare Pages configurado (wrangler.toml, build scripts)

### Backend (Supabase)
- [x] 11 SQL migrations (6 tabelas + storage + pg_cron + model selection + tweet cache)
- [x] Row Level Security em todas as tabelas
- [x] PostgreSQL enums nativos (post_status, post_source, source_status, activity_type)
- [x] 5 Edge Functions com rate limiting compartilhado
- [x] Tweet caching pipeline (Twitter API v2 → cached_tweets → prompt injection)

### Edge Functions (detalhes)

| Funcao | Descricao | Rate Limit | Melhorias |
|--------|-----------|------------|-----------|
| `generate-post` | Gera conteudo com Gemini AI (4 modelos) | 10 req/min | Selecao de modelo, trending topics context, tweet style injection |
| `publish-post` | Publica no Twitter via OAuth 1.0a | 30 tweets/15min | Retry logic, error handling melhorado, shared OAuth module |
| `fetch-tweets` | Busca e cacheia tweets do Twitter API v2 | 5 req/hora | Incremental via since_id, cleanup 500 max/persona |
| `sync-rss` | Busca e processa feeds RSS | 20 syncs/min | Filtros de conteudo, deduplicacao |
| `telegram-webhook` | Notificacoes via Telegram Bot | - | Comandos interativos |

Rate limiting compartilhado via `supabase/functions/_shared/rate-limit.ts`.

### Infraestrutura
- [x] GitHub Actions CI (lint + build)
- [x] GitHub Actions Deploy (Cloudflare Pages + Edge Functions)
- [x] `.env.example` para onboarding
- [x] Documentacao atualizada (README, DEPLOYMENT, CONTEXT)

## O que falta (deploy)
- [ ] Criar projeto no Supabase Dashboard e configurar `.env.local` com chaves reais
- [ ] Rodar migrations: `supabase db push`
- [ ] Habilitar pg_cron e agendar `check_scheduled_posts()`
- [ ] Configurar secrets das Edge Functions (Gemini, Twitter, Telegram)
- [ ] Deploy no Cloudflare Pages
- [ ] Conectar Twitter Developer App (OAuth 1.0a)
- [ ] Configurar Telegram Bot webhook (opcional)
- [ ] Testes end-to-end com credenciais reais

## Decisoes Tomadas

| Data | Decisao |
|------|---------|
| 2026-01-30 | Stack original: FastAPI + Next.js 14 |
| 2026-02-02 | Migracao para Supabase (backend completo) + Cloudflare Pages (frontend) |
| 2026-02-02 | Supabase Auth substitui JWT customizado |
| 2026-02-02 | Edge Functions (Deno) substituem FastAPI/Celery |
| 2026-02-02 | pg_cron substitui Celery periodic tasks |
| 2026-02-02 | RLS substitui autorizacao no backend |
| 2026-02-02 | PostgreSQL enums nativos para status/source/type |
| 2026-02-06 | Design System "Clean Studio" formalizado (Manrope, cores semanticas) |
| 2026-02-06 | GitHub Actions para CI/CD (lint, build, deploy) |
| 2026-02-06 | Gemini AI como provedor de IA (4 modelos disponiveis) |
| 2026-02-07 | Tweet-based generation: cache de tweets reais + injecao no prompt (Fase 1) |

## Tabelas (Supabase)

| Tabela | Descricao |
|--------|-----------|
| `profiles` | Dados do usuario (vinculado a auth.users via trigger) |
| `personas` | Identidades digitais do usuario (nome, handle, emoji, tom, topicos, last_tweet_fetch_at) |
| `posts` | Posts com status enum, source, metricas de engajamento |
| `activities` | Log de atividades do usuario |
| `rss_sources` | Fontes RSS configuradas com status de sincronizacao |
| `cached_tweets` | Tweets cacheados do Twitter API v2 (por persona, com metricas de engajamento) |

## Estrutura do Projeto

```
clone-digital-twitter/
├── dashboard/                    # Frontend Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/           # Login, Registro, Callback
│   │   │   ├── (dashboard)/      # Dashboard, Queue, Sources, Analytics, Settings, Persona
│   │   │   └── api/              # API routes
│   │   ├── components/           # ui/, layout/, dashboard/, queue/, persona/, sources/
│   │   ├── lib/                  # supabase/, contexts/
│   │   └── types/                # TypeScript types
│   ├── tests/                    # Testes unitarios e de componentes
│   ├── .env.example              # Template de variaveis
│   ├── tailwind.config.ts        # Design system tokens
│   └── wrangler.toml             # Cloudflare Pages config
├── supabase/
│   ├── config.toml               # Configuracao local
│   ├── migrations/               # 11 SQL migrations
│   └── functions/                # 5 Edge Functions + _shared/
├── .github/workflows/            # CI/CD (ci.yml, deploy.yml)
├── docs/CONTEXT.md               # Este arquivo
├── design/                       # Assets e exports do Figma
├── DEPLOYMENT.md                 # Guia completo de deploy
├── README.md                     # Documentacao principal
└── CLAUDE.md                     # Instrucoes para Claude Code
```
