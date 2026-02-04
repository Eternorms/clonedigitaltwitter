import { createClient } from './server'
import type { Post, QueueStats, Persona, PersonaDetail, User, Activity, RSSSource, TopPost, DailyMetric } from '@/types'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const initials = profile.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return {
    id: profile.id,
    name: profile.name,
    email: user.email ?? '',
    initials,
    plan: profile.plan === 'free' ? 'Free Plan' : 'Pro Plan',
  }
}

export async function getPersonas(): Promise<Persona[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('personas')
    .select('id, name, handle, emoji')
    .eq('is_active', true)
    .order('created_at')

  return (data ?? []).map(p => ({
    ...p,
    emoji: p.emoji ?? '',
  }))
}

export async function getPersonasDetail(): Promise<PersonaDetail[]> {
  const supabase = createClient()
  const { data: personas } = await supabase
    .from('personas')
    .select('*, posts(count)')
    .eq('is_active', true)
    .order('created_at')

  if (!personas) return []

  return personas.map(p => ({
    id: p.id,
    name: p.name,
    handle: p.handle,
    emoji: p.emoji ?? '',
    description: p.description ?? '',
    tone: p.tone ?? '',
    topics: (p.topics as string[]) ?? [],
    postsCount: (p.posts as unknown as { count: number }[])?.[0]?.count ?? 0,
    followersCount: p.followers_count,
    engagementRate: Number(p.engagement_rate),
    twitterConnected: p.twitter_connected,
  }))
}

export async function getPosts(personaId?: string): Promise<Post[]> {
  const supabase = createClient()
  let query = supabase
    .from('posts')
    .select('*, personas(name, handle, emoji)')
    .order('created_at', { ascending: false })

  if (personaId) {
    query = query.eq('persona_id', personaId)
  }

  const { data } = await query

  return (data ?? []).map(p => {
    const persona = p.personas as unknown as { name: string; handle: string; emoji: string | null } | null
    return {
      id: p.id,
      persona_id: p.persona_id,
      content: p.content,
      status: p.status,
      source: p.source,
      source_name: p.source_name,
      author: {
        name: persona?.name ?? '',
        handle: persona?.handle ?? '',
        avatarEmoji: persona?.emoji ?? undefined,
      },
      created_at: p.created_at,
      scheduled_at: p.scheduled_at,
      published_at: p.published_at,
      image_url: p.image_url,
      hashtags: (p.hashtags as string[]) ?? [],
      impressions: p.impressions,
      engagements: p.engagements,
      likes: p.likes,
      retweets: p.retweets,
    }
  })
}

export async function getQueueStats(personaId?: string): Promise<QueueStats> {
  const supabase = createClient()

  const buildQuery = (status: string) => {
    let q = supabase.from('posts').select('*', { count: 'exact', head: true })
    if (personaId) q = q.eq('persona_id', personaId)
    return q.eq('status', status)
  }

  const [pending, approved, rejected, aiTotal, aiApproved] = await Promise.all([
    buildQuery('pending'),
    buildQuery('approved'),
    buildQuery('rejected'),
    (() => {
      let q = supabase.from('posts').select('*', { count: 'exact', head: true }).eq('source', 'claude_ai')
      if (personaId) q = q.eq('persona_id', personaId)
      return q
    })(),
    (() => {
      let q = supabase.from('posts').select('*', { count: 'exact', head: true }).eq('source', 'claude_ai').in('status', ['approved', 'scheduled', 'published'])
      if (personaId) q = q.eq('persona_id', personaId)
      return q
    })(),
  ])

  const totalAI = aiTotal.count ?? 0
  const approvedAI = aiApproved.count ?? 0

  return {
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    aiPerformance: totalAI > 0 ? Math.round((approvedAI / totalAI) * 100) : 0,
  }
}

export async function getActivities(limit = 6): Promise<Activity[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('activities')
    .select('id, type, description, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as Activity[]
}

export async function getRssSources(personaId?: string): Promise<RSSSource[]> {
  const supabase = createClient()
  let query = supabase
    .from('rss_sources')
    .select('*')
    .order('created_at', { ascending: false })

  if (personaId) {
    query = query.eq('persona_id', personaId)
  }

  const { data } = await query
  return (data ?? []) as RSSSource[]
}

export async function getTopPosts(limit = 4): Promise<TopPost[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('posts')
    .select('id, content, impressions, engagements, likes, retweets, published_at')
    .eq('status', 'published')
    .order('impressions', { ascending: false })
    .limit(limit)

  return (data ?? []) as TopPost[]
}

export async function getDailyMetrics(days = 7): Promise<DailyMetric[]> {
  const supabase = createClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data: posts } = await supabase
    .from('posts')
    .select('created_at, impressions, engagements')
    .gte('created_at', since.toISOString())
    .order('created_at')

  if (!posts || posts.length === 0) return []

  const byDate = new Map<string, DailyMetric>()
  for (const p of posts) {
    const date = new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    const existing = byDate.get(date) ?? { date, posts: 0, impressions: 0, engagements: 0 }
    existing.posts += 1
    existing.impressions += p.impressions
    existing.engagements += p.engagements
    byDate.set(date, existing)
  }

  return Array.from(byDate.values())
}
