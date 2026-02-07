import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // A1: Verify webhook secret token
    const webhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')
    if (webhookSecret) {
      const headerSecret = req.headers.get('X-Telegram-Bot-Api-Secret-Token')
      if (headerSecret !== webhookSecret) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      return new Response('Bot token not configured', { status: 500 })
    }

    const update = await req.json()
    const message = update.message
    if (!message?.text) {
      return new Response('ok')
    }

    const chatId = message.chat.id
    const text = message.text.trim()

    // A1: Verify chat ID is in the allowed list
    const allowedChatIds = Deno.env.get('TELEGRAM_ALLOWED_CHAT_IDS')
    if (allowedChatIds) {
      const allowed = allowedChatIds.split(',').map(id => id.trim())
      if (!allowed.includes(String(chatId))) {
        return new Response('Forbidden', { status: 403 })
      }
    }

    // A2: Owner user ID for scoping post operations
    const ownerUserId = Deno.env.get('TELEGRAM_OWNER_USER_ID')

    async function sendMessage(chatId: number, text: string) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      })
    }

    // /pending - List pending posts
    if (text === '/pending' || text === '/start') {
      let pendingQuery = supabase
        .from('posts')
        .select('id, content, personas!inner(name, user_id)')
        .eq('status', 'pending')
      if (ownerUserId) {
        pendingQuery = pendingQuery.eq('personas.user_id', ownerUserId)
      }
      const { data: posts } = await pendingQuery
        .order('created_at', { ascending: false })
        .limit(5)

      if (!posts || posts.length === 0) {
        await sendMessage(chatId, 'Nenhum post pendente na fila.')
        return new Response('ok')
      }

      let response = '*Posts Pendentes:*\n\n'
      for (const post of posts) {
        const persona = post.personas as unknown as { name: string }
        const shortId = post.id.slice(0, 8)
        const shortContent = post.content.length > 100
          ? post.content.slice(0, 97) + '...'
          : post.content
        response += `[${shortId}] *${persona?.name ?? 'Unknown'}*\n${shortContent}\n\n`
      }
      response += 'Use /approve <id> ou /reject <id>'

      await sendMessage(chatId, response)
      return new Response('ok')
    }

    // /approve <id> - Approve a post
    if (text.startsWith('/approve ')) {
      const shortId = text.replace('/approve ', '').trim()
      let approveQuery = supabase
        .from('posts')
        .select('id, personas!inner(user_id)')
        .ilike('id', `${shortId}%`)
        .eq('status', 'pending')
      if (ownerUserId) {
        approveQuery = approveQuery.eq('personas.user_id', ownerUserId)
      }
      const { data: posts } = await approveQuery.limit(1)

      if (!posts || posts.length === 0) {
        await sendMessage(chatId, 'Post nao encontrado ou ja processado.')
        return new Response('ok')
      }

      await supabase.from('posts').update({ status: 'approved' }).eq('id', posts[0].id)
      await sendMessage(chatId, `Post ${shortId} aprovado.`)
      return new Response('ok')
    }

    // /reject <id> - Reject a post
    if (text.startsWith('/reject ')) {
      const shortId = text.replace('/reject ', '').trim()
      let rejectQuery = supabase
        .from('posts')
        .select('id, personas!inner(user_id)')
        .ilike('id', `${shortId}%`)
        .eq('status', 'pending')
      if (ownerUserId) {
        rejectQuery = rejectQuery.eq('personas.user_id', ownerUserId)
      }
      const { data: posts } = await rejectQuery.limit(1)

      if (!posts || posts.length === 0) {
        await sendMessage(chatId, 'Post nao encontrado ou ja processado.')
        return new Response('ok')
      }

      await supabase.from('posts').update({ status: 'rejected' }).eq('id', posts[0].id)
      await sendMessage(chatId, `Post ${shortId} rejeitado.`)
      return new Response('ok')
    }

    await sendMessage(chatId, 'Comandos disponíveis:\n/pending - Ver posts pendentes\n/approve <id> - Aprovar post\n/reject <id> - Rejeitar post')
    return new Response('ok')
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return new Response('error', { status: 500 })
  }
})
