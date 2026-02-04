# Contexto Atual do Projeto

## Status Geral
- **Fase atual:** Migracao para Supabase + Cloudflare Pages concluida
- **Ultima atualizacao:** 2026-02-02
- **Proxima tarefa:** Configurar projeto Supabase, rodar migrations, testar auth flow

## Arquitetura

```
Cloudflare Pages          Supabase
+-----------------+      +--------------------------+
| Next.js 14      |      | Auth (email/password)    |
| @supabase/ssr   |----->| PostgreSQL (Database)    |
| Tailwind CSS    |      | Storage (post-images)    |
+-----------------+      | Edge Functions (Deno):   |
                         |  - generate-post (Claude)|
                         |  - publish-post (Twitter)|
                         |  - sync-rss             |
                         |  - telegram-webhook     |
                         | pg_cron (agendamento)   |
                         | RLS (autorizacao)       |
                         | Realtime               |
                         +--------------------------+
```

## O que esta funcionando
- [x] Supabase SQL migrations (5 tabelas + storage + pg_cron)
- [x] Row Level Security em todas as tabelas
- [x] Supabase Auth integrado no Next.js (server + client + middleware)
- [x] Paginas de login e registro
- [x] Dashboard completo com 7 paginas conectadas ao Supabase
- [x] Componentes UI (Avatar, Badge, Button, Card, StatCard, Tabs)
- [x] 4 Edge Functions (generate-post, publish-post, sync-rss, telegram-webhook)
- [x] Cloudflare Pages configurado (wrangler.toml, build scripts)
- [x] PersonaContext para gerenciamento de persona ativa
- [x] Mutations para aprovar/rejeitar/agendar posts

## O que falta
- [ ] Criar projeto no Supabase Dashboard e configurar .env.local com chaves reais
- [ ] Rodar migrations: `supabase db push`
- [ ] Habilitar pg_cron na Dashboard do Supabase
- [ ] Configurar secrets das Edge Functions
- [ ] Deploy no Cloudflare Pages (`npm run pages:deploy`)
- [ ] Conectar Twitter Developer App
- [ ] Configurar Telegram Bot webhook
- [ ] Testes end-to-end

## Decisoes tomadas
1. **2026-01-30** - Stack original: FastAPI + Next.js 14
2. **2026-02-02** - Migracao para Supabase (backend completo) + Cloudflare Pages (frontend)
3. **2026-02-02** - Supabase Auth substitui JWT customizado
4. **2026-02-02** - Edge Functions (Deno) substituem FastAPI/Celery
5. **2026-02-02** - pg_cron substitui Celery periodic tasks
6. **2026-02-02** - RLS substitui autorizacao no backend
7. **2026-02-02** - PostgreSQL enums nativos para status/source/type

## Tabelas (Supabase)
- **profiles** - Dados do usuario (vinculado a auth.users)
- **personas** - Identidades digitais do usuario
- **posts** - Posts com status, source, metricas
- **activities** - Log de atividades
- **rss_sources** - Fontes RSS configuradas

## Estrutura do Projeto
```
CLoneDigitalTwitter/
├── supabase/
│   ├── config.toml
│   ├── migrations/ (8 arquivos SQL)
│   └── functions/ (4 Edge Functions)
├── dashboard/
│   ├── src/
│   │   ├── app/ (auth + dashboard pages)
│   │   ├── components/ (ui, layout, dashboard, queue, persona)
│   │   ├── lib/ (supabase clients, queries, mutations, contexts)
│   │   └── types/
│   ├── wrangler.toml
│   └── package.json
├── docs/
└── design/
```
