# Guia de Deploy - Clone Digital Twitter

Este guia cobre todos os passos para colocar o app em producao.

## Pre-requisitos

| Ferramenta | Versao Minima | Instalacao |
|------------|---------------|------------|
| Node.js | >= 20.0.0 | [nodejs.org](https://nodejs.org/) |
| npm | >= 10.0.0 | Incluso com Node.js |
| Supabase CLI | >= 1.200.0 | `npm install -g supabase` |
| Wrangler (opcional) | >= 4.0.0 | `npm install -g wrangler` |

### Contas Necessarias

- [Supabase](https://supabase.com) — banco de dados, auth e Edge Functions
- [Cloudflare](https://cloudflare.com) — hospedagem do frontend (Pages)
- [Twitter Developer](https://developer.twitter.com) — API v2 com OAuth 1.0a
- [Google AI Studio](https://aistudio.google.com) — Gemini API para geracao de conteudo
- [Telegram](https://t.me/BotFather) (opcional) — notificacoes via bot

---

## 1. Desenvolvimento Local

### 1.1 Clonar e Instalar

```bash
git clone https://github.com/seu-usuario/clone-digital-twitter.git
cd clone-digital-twitter/dashboard
npm install
```

### 1.2 Configurar Variaveis de Ambiente

```bash
cp .env.example .env.local
```

Edite `dashboard/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 1.3 Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## 2. Configurar Supabase

### 2.1 Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **Project URL** e **anon key** (Settings > API)
3. Anote a **service_role key** (para uso local apenas)

### 2.2 Aplicar Migrations

```bash
# Login
supabase login

# Linkar projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrations
supabase db push
```

### 2.3 Configurar pg_cron (Posts Agendados)

No SQL Editor do Supabase Dashboard, execute:

```sql
-- Habilitar extensao pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar verificacao a cada minuto
SELECT cron.schedule(
  'check-scheduled-posts',
  '* * * * *',
  'SELECT public.check_scheduled_posts()'
);
```

### 2.4 Configurar Secrets das Edge Functions

No Supabase Dashboard, va em **Settings > Edge Functions > Secrets** e adicione:

| Secret | Descricao | Obrigatorio |
|--------|-----------|-------------|
| `GEMINI_API_KEY` | Chave da API Gemini | Sim |
| `TWITTER_API_KEY` | Consumer Key (API Key) | Sim |
| `TWITTER_API_KEY_SECRET` | Consumer Secret | Sim |
| `TWITTER_ACCESS_TOKEN` | Access Token | Sim |
| `TWITTER_ACCESS_TOKEN_SECRET` | Access Token Secret | Sim |
| `TWITTER_BEARER_TOKEN` | Bearer Token (trending) | Nao |
| `TELEGRAM_BOT_TOKEN` | Token do bot Telegram | Nao |

Ou via CLI:

```bash
supabase secrets set GEMINI_API_KEY=sua-chave
supabase secrets set TWITTER_API_KEY=sua-chave
# ... etc
```

### 2.5 Deploy das Edge Functions

```bash
supabase functions deploy generate-post
supabase functions deploy publish-post
supabase functions deploy sync-rss
supabase functions deploy telegram-webhook
```

---

## 3. Configurar Twitter API

### 3.1 Criar App no Twitter Developer Portal

1. Acesse [developer.twitter.com](https://developer.twitter.com)
2. Crie um novo projeto e app
3. Configure as permissoes: **Read and Write**
4. Habilite **OAuth 1.0a** com callback URL: `https://seu-dominio.com/callback`

### 3.2 Gerar Credenciais

Na secao "Keys and tokens":

1. **Consumer Keys** → `TWITTER_API_KEY` e `TWITTER_API_KEY_SECRET`
2. **Access Token and Secret** → Gere tokens com permissao Read+Write
3. **Bearer Token** (opcional) → Para trending topics

---

## 4. Configurar Gemini API

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Clique em "Get API Key"
3. Crie uma nova chave de API
4. Copie para usar como `GEMINI_API_KEY`

---

## 5. Deploy do Frontend (Cloudflare Pages)

### 5.1 Configurar Variaveis de Ambiente

No Cloudflare Pages, adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 5.2 Deploy via Git (recomendado)

1. Conecte seu repositorio ao Cloudflare Pages
2. Configure:
   - **Build command:** `npm run pages:build`
   - **Build output directory:** `.vercel/output/static`
   - **Root directory:** `dashboard`

### 5.3 Deploy Manual

```bash
cd dashboard
npm run pages:build
npx wrangler pages deploy .vercel/output/static --project-name clone-digital-twitter
```

### 5.4 Deploy via GitHub Actions

O deploy automatico esta configurado em `.github/workflows/deploy.yml`. Configure os seguintes secrets no repositorio GitHub:

| Secret | Descricao |
|--------|-----------|
| `CLOUDFLARE_API_TOKEN` | Token da API Cloudflare |
| `CLOUDFLARE_ACCOUNT_ID` | ID da conta Cloudflare |
| `SUPABASE_ACCESS_TOKEN` | Token de acesso do Supabase |
| `SUPABASE_PROJECT_REF` | Project ref do Supabase |

---

## 6. Configuracoes Opcionais

### 6.1 Telegram Bot (Notificacoes)

1. Crie um bot via [@BotFather](https://t.me/BotFather)
2. Obtenha o token do bot
3. Configure o webhook:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://SEU_PROJETO.supabase.co/functions/v1/telegram-webhook"
```

### 6.2 Dominio Customizado

1. No Cloudflare Pages, adicione seu dominio
2. Configure DNS CNAME apontando para `seu-projeto.pages.dev`
3. Ative SSL/TLS

---

## 7. Verificacao Pos-Deploy

### Checklist

- [ ] Pagina de login carrega
- [ ] Registro de novo usuario funciona
- [ ] Criar persona funciona
- [ ] Adicionar fonte RSS funciona
- [ ] Sincronizar RSS traz artigos
- [ ] Gerar posts com IA funciona
- [ ] Aprovar post funciona
- [ ] Publicar no Twitter funciona
- [ ] Analytics mostra dados

### Testar Edge Functions

```bash
# Testar generate-post
curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/generate-post \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"persona_id": "UUID_PERSONA", "count": 1}'
```

---

## 8. Limites e Rate Limiting

O app implementa rate limiting nas Edge Functions:

| Funcao | Limite |
|--------|--------|
| generate-post | 10 req/min por usuario |
| publish-post | 30 tweets/15min por usuario |
| sync-rss | 20 syncs/min por usuario |

Twitter API tem limites adicionais:
- 50 tweets/dia (Free tier)
- 1,500 tweets/mes (Free tier)

---

## 9. Troubleshooting

### "Gemini API key not configured"
- Verifique se o secret `GEMINI_API_KEY` esta configurado no Supabase
- Confirme via CLI: `supabase secrets list`

### "Twitter API credentials not configured"
- Verifique os 4 secrets do Twitter no Supabase
- Confirme que o app tem permissao **Read and Write**

### Posts nao aparecem apos sync RSS
- Verifique se a URL do feed e valida (teste no navegador)
- Verifique logs: `supabase functions logs sync-rss`
- Confirme que a fonte RSS esta com status `active`

### Rate limit exceeded
- Aguarde o periodo de cooldown indicado no header `Retry-After`
- Verifique logs para identificar qual limite foi atingido

### Build falha no Cloudflare Pages
- Confirme que `Root directory` esta como `dashboard`
- Verifique se `Build output directory` esta como `.vercel/output/static`
- Confirme as variaveis de ambiente no Cloudflare Pages

### Edge Functions nao respondem
- Verifique logs: `supabase functions logs <nome-funcao>`
- Confirme que os secrets estao configurados
- Verifique se a funcao foi deployada: `supabase functions list`

### Erro de autenticacao no login
- Verifique se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estao corretos
- Confirme que as Site URL e Redirect URLs estao configuradas no Supabase Auth

---

## Suporte

Para reportar bugs ou pedir features:
- Abra uma issue no repositorio
- Inclua logs relevantes e passos para reproduzir
