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

export async function updateProfile(data: { name?: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  return supabase.from('profiles').update(data).eq('id', user.id)
}
