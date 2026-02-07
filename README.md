# Clone Digital Twitter

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Ferramenta de gerenciamento de conteudo para publicacao automatizada no Twitter/X. Gera posts com IA (Gemini), publica via OAuth 1.0a, sincroniza fontes RSS e envia notificacoes via Telegram.

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
|                            |      |    - publish-post (Twitter API)    |
+----------------------------+      |    - sync-rss (RSS feeds)          |
                                    |    - telegram-webhook (notif.)     |
                                    |  pg_cron (agendamento)             |
                                    |  Realtime (subscriptions)          |
                                    |                                    |
                                    +------------------------------------+
```

## Stack Tecnologica

| Camada     | Tecnologia                                    |
|------------|-----------------------------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind CSS v3, SWR  |
| Backend    | Supabase (PostgreSQL, Auth, Storage, RLS)      |
| IA         | Google Gemini API (4 modelos disponiveis)       |
| Social     | Twitter API v2 (OAuth 1.0a)                    |
| Deploy     | Cloudflare Pages (frontend), Supabase (backend)|
| Notificacao| Telegram Bot API                               |

## Inicio Rapido

### Pre-requisitos

- Node.js >= 20
- npm >= 10
- [Supabase CLI](https://supabase.com/docs/guides/cli) >= 1.200
- Conta no [Supabase](https://supabase.com)
- Conta no [Cloudflare](https://cloudflare.com)

### 1. Clonar o repositorio

```bash
git clone https://github.com/seu-usuario/clone-digital-twitter.git
cd clone-digital-twitter
```

### 2. Instalar dependencias

```bash
cd dashboard
npm install
```

### 3. Configurar variaveis de ambiente

```bash
cp .env.example .env.local
```

Edite `dashboard/.env.local` com suas credenciais do Supabase (veja a tabela abaixo).

### 4. Configurar Supabase

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

### 5. Iniciar desenvolvimento

```bash
cd dashboard
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Comandos Disponiveis

| Comando               | Descricao                          |
|-----------------------|------------------------------------|
| `npm run dev`         | Servidor de desenvolvimento        |
| `npm run build`       | Build de producao                  |
| `npm run lint`        | Executar ESLint                    |
| `npm run pages:build` | Build para Cloudflare Pages        |
| `npm run pages:deploy`| Deploy para Cloudflare Pages       |
| `supabase db push`    | Aplicar migrations no Supabase     |
| `supabase functions deploy <fn>` | Deploy de Edge Function  |

## Estrutura do Projeto

```
clone-digital-twitter/
├── dashboard/                    # Frontend Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/           # Login, Registro, Callback
│   │   │   ├── (dashboard)/      # Dashboard, Queue, Sources, Analytics, Settings, Persona
│   │   │   └── api/              # API routes
│   │   ├── components/
│   │   │   ├── ui/               # Button, Card, Modal, Badge, Toast, etc.
│   │   │   ├── layout/           # Sidebar, MainContent
│   │   │   ├── dashboard/        # Componentes do dashboard
│   │   │   ├── queue/            # Fila de posts
│   │   │   ├── persona/          # Gerenciamento de personas
│   │   │   └── sources/          # Fontes RSS
│   │   ├── lib/
│   │   │   ├── supabase/         # Clients, queries, mutations, realtime, types
│   │   │   └── contexts/         # PersonaContext, ToastContext
│   │   └── types/                # TypeScript types
│   ├── .env.example              # Template de variaveis de ambiente
│   ├── tailwind.config.ts        # Design system "Clean Studio"
│   └── wrangler.toml             # Configuracao Cloudflare Pages
├── supabase/
│   ├── config.toml               # Configuracao local do Supabase
│   ├── migrations/               # 10 SQL migrations
│   └── functions/
│       ├── _shared/              # rate-limit.ts (utilitario compartilhado)
│       ├── generate-post/        # Geracao de conteudo com Gemini AI
│       ├── publish-post/         # Publicacao no Twitter via OAuth 1.0a
│       ├── sync-rss/             # Sincronizacao de feeds RSS
│       └── telegram-webhook/     # Notificacoes via Telegram
├── docs/
│   └── CONTEXT.md                # Contexto e status do projeto
├── design/                       # Assets e exports do Figma
├── DEPLOYMENT.md                 # Guia completo de deploy
└── CLAUDE.md                     # Instrucoes para Claude Code
```

## Variaveis de Ambiente

### Dashboard (`dashboard/.env.local`)

| Variavel                          | Descricao                    | Obrigatoria |
|-----------------------------------|------------------------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | URL do projeto Supabase      | Sim         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Chave publica (anon) Supabase| Sim         |

### Secrets das Edge Functions (Supabase Dashboard)

| Secret                          | Descricao                      | Obrigatoria |
|---------------------------------|--------------------------------|-------------|
| `GEMINI_API_KEY`                | Chave da API Google Gemini     | Sim         |
| `TWITTER_API_KEY`               | Twitter Consumer Key           | Sim         |
| `TWITTER_API_KEY_SECRET`        | Twitter Consumer Secret        | Sim         |
| `TWITTER_ACCESS_TOKEN`          | Twitter Access Token           | Sim         |
| `TWITTER_ACCESS_TOKEN_SECRET`   | Twitter Access Token Secret    | Sim         |
| `TWITTER_BEARER_TOKEN`          | Twitter Bearer Token           | Nao         |
| `TELEGRAM_BOT_TOKEN`            | Token do bot Telegram          | Nao         |

## Deploy

Consulte o [DEPLOYMENT.md](DEPLOYMENT.md) para instrucoes completas de deploy em producao, incluindo:

- Configuracao do Supabase (migrations, pg_cron, secrets)
- Configuracao do Twitter Developer
- Deploy no Cloudflare Pages
- Configuracao do Telegram Bot
- Verificacao pos-deploy

## Contribuindo

1. Faca um fork do repositorio
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas alteracoes (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Convencoes

- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/)
- UI strings em portugues (pt-BR)
- Design system "Clean Studio" (ver `dashboard/DESIGN_SYSTEM.md`)
- Icones exclusivamente via `lucide-react`

## Licenca

Este projeto esta licenciado sob a [MIT License](LICENSE).
