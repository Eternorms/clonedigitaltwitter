# Guia de Deploy - Clone Digital Twitter

Este guia cobre todos os passos para colocar o app em produção.

## Requisitos

- Conta [Supabase](https://supabase.com)
- Conta [Cloudflare](https://cloudflare.com) (Pages)
- Conta [Twitter Developer](https://developer.twitter.com) com API v2
- Chave [Google AI Studio](https://aistudio.google.com) (Gemini API)

---

## 1. Configurar Supabase

### 1.1 Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **Project URL** e **anon key** (Settings > API)
3. Anote a **service_role key** (para uso local apenas)

### 1.2 Aplicar Migrations

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrations
supabase db push
```

### 1.3 Configurar pg_cron (Posts Agendados)

No SQL Editor do Supabase Dashboard, execute:

```sql
-- Habilitar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar verificação a cada minuto
SELECT cron.schedule(
  'check-scheduled-posts',
  '* * * * *',
  'SELECT public.check_scheduled_posts()'
);
```

### 1.4 Configurar Secrets das Edge Functions

No Supabase Dashboard, vá em **Settings > Edge Functions > Secrets** e adicione:

| Secret | Descrição | Obrigatório |
|--------|-----------|-------------|
| `GEMINI_API_KEY` | Chave da API Gemini | Sim |
| `TWITTER_API_KEY` | Consumer Key (API Key) | Sim |
| `TWITTER_API_KEY_SECRET` | Consumer Secret | Sim |
| `TWITTER_ACCESS_TOKEN` | Access Token | Sim |
| `TWITTER_ACCESS_TOKEN_SECRET` | Access Token Secret | Sim |
| `TWITTER_BEARER_TOKEN` | Bearer Token (trending) | Não |
| `TELEGRAM_BOT_TOKEN` | Token do bot Telegram | Não |

### 1.5 Deploy das Edge Functions

```bash
# Deploy todas as funções
supabase functions deploy generate-post
supabase functions deploy publish-post
supabase functions deploy sync-rss
supabase functions deploy telegram-webhook
```

---

## 2. Configurar Twitter API

### 2.1 Criar App no Twitter Developer Portal

1. Acesse [developer.twitter.com](https://developer.twitter.com)
2. Crie um novo projeto e app
3. Configure as permissões: **Read and Write**
4. Habilite **OAuth 1.0a** com callback URL: `https://seu-dominio.com/callback`

### 2.2 Gerar Credenciais

Na seção "Keys and tokens":

1. **Consumer Keys** → TWITTER_API_KEY e TWITTER_API_KEY_SECRET
2. **Access Token and Secret** → Gere tokens com permissão Read+Write
3. **Bearer Token** (opcional) → Para trending topics

---

## 3. Configurar Gemini API

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Clique em "Get API Key"
3. Crie uma nova chave de API
4. Copie para usar como `GEMINI_API_KEY`

---

## 4. Deploy do Frontend (Cloudflare Pages)

### 4.1 Configurar Variáveis de Ambiente

No Cloudflare Pages, adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 4.2 Deploy via Git

1. Conecte seu repositório ao Cloudflare Pages
2. Configure:
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
   - **Root directory:** `dashboard`

### 4.3 Deploy Manual

```bash
cd dashboard

# Build
npm run build

# Deploy (requer wrangler instalado)
npx wrangler pages deploy .next --project-name clone-digital-twitter
```

---

## 5. Verificação Pós-Deploy

### Checklist

- [ ] Página de login carrega
- [ ] Registro de novo usuário funciona
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

## 6. Configurações Opcionais

### 6.1 Telegram Bot (Notificações)

1. Crie um bot via [@BotFather](https://t.me/BotFather)
2. Obtenha o token do bot
3. Configure o webhook:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://SEU_PROJETO.supabase.co/functions/v1/telegram-webhook"
```

### 6.2 Domínio Customizado

1. No Cloudflare Pages, adicione seu domínio
2. Configure DNS CNAME apontando para `seu-projeto.pages.dev`
3. Ative SSL/TLS

---

## 7. Limites e Rate Limiting

O app implementa rate limiting nas Edge Functions:

| Função | Limite |
|--------|--------|
| generate-post | 10 req/min por usuário |
| publish-post | 30 tweets/15min por usuário |
| sync-rss | 20 syncs/min por usuário |

Twitter API tem limites adicionais:
- 50 tweets/dia (Free tier)
- 1,500 tweets/mês (Free tier)

---

## 8. Troubleshooting

### "Gemini API key not configured"
- Verifique se o secret `GEMINI_API_KEY` está configurado no Supabase

### "Twitter API credentials not configured"
- Verifique os 4 secrets do Twitter no Supabase

### Posts não aparecem após sync RSS
- Verifique se a URL do feed é válida
- Verifique logs: `supabase functions logs sync-rss`

### Rate limit exceeded
- Aguarde o período de cooldown indicado no header `Retry-After`

---

## Suporte

Para reportar bugs ou pedir features:
- Abra uma issue no repositório
- Inclua logs relevantes e passos para reproduzir
