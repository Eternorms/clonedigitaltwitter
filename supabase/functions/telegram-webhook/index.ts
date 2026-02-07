import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import type { NotificationType } from '../_shared/types.ts'

/** Format a notification message with HTML based on type */
function formatNotification(type: NotificationType, data: Record<string, string>): string {
  switch (type) {
    case 'post_published':
      return [
        `<b>Tweet Publicado</b>`,
        ``,
        `<b>Persona:</b> ${data.persona ?? 'N/A'}`,
        `<i>${data.content ?? ''}</i>`,
        data.tweet_url ? `\n<a href="${data.tweet_url}">Ver no Twitter</a>` : '',
      ].filter(Boolean).join('\n')

    case 'post_approved':
      return [
        `<b>Post Aprovado</b>`,
        ``,
        `<b>Persona:</b> ${data.persona ?? 'N/A'}`,
        `<i>${data.content ?? ''}</i>`,
      ].join('\n')

    case 'rss_synced':
      return [
        `<b>RSS Sincronizado</b>`,
        ``,
        `<b>Fonte:</b> ${data.source_name ?? 'N/A'}`,
        `<b>Novos artigos:</b> ${data.count ?? '0'}`,
      ].join('\n')

    case 'ai_generated':
      return [
        `<b>Posts Gerados por IA</b>`,
        ``,
        `<b>Modelo:</b> ${data.model ?? 'N/A'}`,
        `<b>Persona:</b> ${data.persona ?? 'N/A'}`,
        `<b>Quantidade:</b> ${data.count ?? '0'}`,
      ].join('\n')

    default:
      return data.message ?? 'Notificação recebida.'
  }
}

/** Build inline keyboard markup for post actions */
function buildPostKeyboard(postShortId: string): object {
  return {
    inline_keyboard: [
      [
        { text: 'Aprovar', callback_data: `approve:${postShortId}` },
        { text: 'Rejeitar', callback_data: `reject:${postShortId}` },
      ],
    ],
  }
}

Deno.serve(async (req) => {
  try {
    // Verify webhook secret token
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

    // Handle callback queries (inline keyboard button presses)
    if (update.callback_query) {
      const callbackQuery = update.callback_query
      const chatId = callbackQuery.message?.chat?.id
      const data = callbackQuery.data ?? ''

      if (chatId) {
        // Verify chat ID is allowed
        const allowedChatIds = Deno.env.get('TELEGRAM_ALLOWED_CHAT_IDS')
        if (allowedChatIds) {
          const allowed = allowedChatIds.split(',').map((id: string) => id.trim())
          if (!allowed.includes(String(chatId))) {
            return new Response('Forbidden', { status: 403 })
          }
        }

        const ownerUserId = Deno.env.get('TELEGRAM_OWNER_USER_ID')

        if (data.startsWith('approve:') || data.startsWith('reject:')) {
          const [action, shortId] = data.split(':')
          const newStatus = action === 'approve' ? 'approved' : 'rejected'

          let query = supabase
            .from('posts')
            .select('id, content, personas!inner(user_id)')
            .ilike('id', `${shortId}%`)
            .eq('status', 'pending')
          if (ownerUserId) {
            query = query.eq('personas.user_id', ownerUserId)
          }
          const { data: posts } = await query.limit(1)

          let answerText: string
          if (!posts || posts.length === 0) {
            answerText = 'Post nao encontrado ou ja processado.'
          } else {
            await supabase.from('posts').update({ status: newStatus }).eq('id', posts[0].id)
            answerText = action === 'approve'
              ? `Post ${shortId} aprovado.`
              : `Post ${shortId} rejeitado.`
          }

          // Answer callback query to remove loading state
          await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackQuery.id,
              text: answerText,
            }),
          })

          // Also send message to chat
          await sendMessage(botToken, chatId, answerText)
        }
      }
      return new Response('ok')
    }

    const message = update.message
    if (!message?.text) {
      return new Response('ok')
    }

    const chatId = message.chat.id
    const text = message.text.trim()

    // Verify chat ID is in the allowed list
    const allowedChatIds = Deno.env.get('TELEGRAM_ALLOWED_CHAT_IDS')
    if (allowedChatIds) {
      const allowed = allowedChatIds.split(',').map((id: string) => id.trim())
      if (!allowed.includes(String(chatId))) {
        return new Response('Forbidden', { status: 403 })
      }
    }

    // Owner user ID for scoping post operations
    const ownerUserId = Deno.env.get('TELEGRAM_OWNER_USER_ID')

    // /pending - List pending posts (with inline keyboard buttons)
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
        await sendMessage(botToken, chatId, 'Nenhum post pendente na fila.')
        return new Response('ok')
      }

      // Send each post with inline keyboard for approve/reject
      for (const post of posts) {
        const persona = post.personas as unknown as { name: string }
        const shortId = post.id.slice(0, 8)
        const shortContent = post.content.length > 200
          ? post.content.slice(0, 197) + '...'
          : post.content

        const postMessage = [
          `<b>[${shortId}]</b> <b>${escapeHtml(persona?.name ?? 'Unknown')}</b>`,
          ``,
          `<i>${escapeHtml(shortContent)}</i>`,
        ].join('\n')

        await sendMessageWithKeyboard(botToken, chatId, postMessage, buildPostKeyboard(shortId))
      }

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
        await sendMessage(botToken, chatId, 'Post nao encontrado ou ja processado.')
        return new Response('ok')
      }

      await supabase.from('posts').update({ status: 'approved' }).eq('id', posts[0].id)
      await sendMessage(botToken, chatId, `Post ${shortId} aprovado.`)
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
        await sendMessage(botToken, chatId, 'Post nao encontrado ou ja processado.')
        return new Response('ok')
      }

      await supabase.from('posts').update({ status: 'rejected' }).eq('id', posts[0].id)
      await sendMessage(botToken, chatId, `Post ${shortId} rejeitado.`)
      return new Response('ok')
    }

    // /notify <type> - Send a formatted notification (for internal use / testing)
    if (text.startsWith('/notify ')) {
      const notifyType = text.replace('/notify ', '').trim() as NotificationType
      const validTypes: NotificationType[] = ['post_published', 'post_approved', 'rss_synced', 'ai_generated']
      if (!validTypes.includes(notifyType)) {
        await sendMessage(botToken, chatId, `Tipos válidos: ${validTypes.join(', ')}`)
        return new Response('ok')
      }

      const testData: Record<string, string> = {
        persona: 'Test Persona',
        content: 'Este é um post de teste para verificar a formatação.',
        source_name: 'Test RSS Feed',
        count: '3',
        model: 'gemini-2.0-flash',
        tweet_url: 'https://twitter.com/i/status/123456789',
        message: 'Notificação de teste',
      }

      const formatted = formatNotification(notifyType, testData)
      await sendMessage(botToken, chatId, formatted)
      return new Response('ok')
    }

    // Help message
    const helpMessage = [
      '<b>Comandos disponíveis:</b>',
      '',
      '/pending - Ver posts pendentes',
      '/approve &lt;id&gt; - Aprovar post',
      '/reject &lt;id&gt; - Rejeitar post',
      '/notify &lt;type&gt; - Testar notificação',
      '',
      '<i>Tipos de notificação: post_published, post_approved, rss_synced, ai_generated</i>',
    ].join('\n')

    await sendMessage(botToken, chatId, helpMessage)
    return new Response('ok')
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return new Response('error', { status: 500 })
  }
})

/** Escape HTML special characters for Telegram HTML parse mode */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Send a text message via Telegram Bot API */
async function sendMessage(botToken: string, chatId: number, text: string): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`Telegram sendMessage failed (${response.status}):`, errorBody)
  }
}

/** Send a message with an inline keyboard via Telegram Bot API */
async function sendMessageWithKeyboard(
  botToken: string,
  chatId: number,
  text: string,
  replyMarkup: object,
): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    }),
  })
  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`Telegram sendMessage failed (${response.status}):`, errorBody)
  }
}
