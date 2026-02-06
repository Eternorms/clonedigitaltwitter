'use client'

import { createClient } from './client'

export async function approvePost(postId: string) {
  const supabase = createClient()
  return supabase.from('posts').update({ status: 'approved' as const }).eq('id', postId)
}

export async function rejectPost(postId: string) {
  const supabase = createClient()
  return supabase.from('posts').update({ status: 'rejected' as const }).eq('id', postId)
}

export async function schedulePost(postId: string, scheduledAt: string) {
  const supabase = createClient()
  return supabase.from('posts').update({ status: 'scheduled' as const, scheduled_at: scheduledAt }).eq('id', postId)
}

export async function updatePostContent(postId: string, content: string) {
  const supabase = createClient()
  return supabase.from('posts').update({ content }).eq('id', postId)
}

export async function createPost(data: {
  persona_id: string
  content: string
  source: 'manual'
  hashtags?: string[]
}) {
  const supabase = createClient()
  return supabase.from('posts').insert({
    persona_id: data.persona_id,
    content: data.content,
    source: data.source,
    source_name: 'Manual',
    hashtags: data.hashtags ?? [],
    status: 'pending' as const,
  }).select().single()
}

export async function createPersona(data: {
  name: string
  handle: string
  emoji?: string
  description?: string
  tone?: string
  topics?: string[]
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  return supabase.from('personas').insert({
    user_id: user.id,
    name: data.name,
    handle: data.handle,
    emoji: data.emoji,
    description: data.description,
    tone: data.tone,
    topics: data.topics ?? [],
  }).select().single()
}

export async function addRSSSource(data: {
  persona_id: string
  name: string
  url: string
  category?: string
  icon?: string
}) {
  const supabase = createClient()
  return supabase.from('rss_sources').insert(data).select().single()
}

export async function deleteRSSSource(sourceId: string) {
  const supabase = createClient()
  return supabase.from('rss_sources').delete().eq('id', sourceId)
}

export async function toggleRSSSource(sourceId: string, status: 'active' | 'paused') {
  const supabase = createClient()
  return supabase.from('rss_sources').update({ status }).eq('id', sourceId)
}

export async function updatePersona(id: string, data: {
  name?: string
  handle?: string
  emoji?: string
  description?: string
  tone?: string
  topics?: string[]
}) {
  const supabase = createClient()
  return supabase.from('personas').update(data).eq('id', id).select().single()
}

export async function updateProfile(data: { name?: string; preferred_model?: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  return supabase.from('profiles').update(data).eq('id', user.id)
}

export async function generateWithAI(personaId: string, topic?: string, count: number = 3, rssSourceId?: string) {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke('generate-post', {
    body: { persona_id: personaId, topic, count, rss_source_id: rssSourceId },
  })
  if (error) throw error
  return data
}

export async function publishToTwitter(postId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke('publish-post', {
    body: { post_id: postId },
  })
  if (error) throw error
  return data
}

export async function syncRSSSource(sourceId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke('sync-rss', {
    body: { rss_source_id: sourceId },
  })
  if (error) throw error
  return data
}

export async function deleteAccount() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Delete user data in order (respecting foreign key constraints)
  // 1. Delete activities
  await supabase.from('activities').delete().eq('user_id', user.id)

  // 2. Get all personas for this user
  const { data: personas } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)

  if (personas && personas.length > 0) {
    const personaIds = personas.map(p => p.id)

    // 3. Delete posts for all personas
    await supabase.from('posts').delete().in('persona_id', personaIds)

    // 4. Delete RSS sources for all personas
    await supabase.from('rss_sources').delete().in('persona_id', personaIds)

    // 5. Delete personas
    await supabase.from('personas').delete().eq('user_id', user.id)
  }

  // 6. Delete profile
  await supabase.from('profiles').delete().eq('id', user.id)

  // 7. Sign out (this will also invalidate the session)
  await supabase.auth.signOut()

  return { success: true }
}
