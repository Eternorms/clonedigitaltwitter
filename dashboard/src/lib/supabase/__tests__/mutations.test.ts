import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  setMockReturnValue,
  resetMockReturnValue,
  getMockSupabaseClient,
  getMockAuth,
  getMockFunctions,
} from '@/test/mocks/supabase'
import {
  approvePost,
  rejectPost,
  schedulePost,
  updatePostContent,
  createPost,
  createPersona,
  addRSSSource,
  deleteRSSSource,
  toggleRSSSource,
  updatePersona,
  generateWithAI,
  fetchTweets,
  publishToTwitter,
  syncRSSSource,
} from '../mutations'

describe('mutations', () => {
  const mockClient = getMockSupabaseClient()
  const mockAuth = getMockAuth()
  const mockFunctions = getMockFunctions()

  beforeEach(() => {
    resetMockReturnValue()
    vi.clearAllMocks()
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    })
    mockFunctions.invoke.mockResolvedValue({ data: { success: true }, error: null })
  })

  describe('approvePost', () => {
    it('calls update with approved status', async () => {
      await approvePost('post-1')
      expect(mockClient.from).toHaveBeenCalledWith('posts')
    })
  })

  describe('rejectPost', () => {
    it('calls update with rejected status', async () => {
      await rejectPost('post-1')
      expect(mockClient.from).toHaveBeenCalledWith('posts')
    })
  })

  describe('schedulePost', () => {
    it('calls update with scheduled status and date', async () => {
      await schedulePost('post-1', '2026-01-20T10:00:00Z')
      expect(mockClient.from).toHaveBeenCalledWith('posts')
    })
  })

  describe('updatePostContent', () => {
    it('calls update with new content', async () => {
      await updatePostContent('post-1', 'new content')
      expect(mockClient.from).toHaveBeenCalledWith('posts')
    })
  })

  describe('createPost', () => {
    it('calls insert with post data', async () => {
      setMockReturnValue({
        data: { id: 'new-post', content: 'test', status: 'pending' },
        error: null,
      })

      await createPost({
        persona_id: 'persona-1',
        content: 'Test post',
        source: 'manual',
      })
      expect(mockClient.from).toHaveBeenCalledWith('posts')
    })

    it('defaults hashtags to empty array', async () => {
      setMockReturnValue({
        data: { id: 'new-post', content: 'test', status: 'pending', hashtags: [] },
        error: null,
      })

      await createPost({
        persona_id: 'persona-1',
        content: 'Test post',
        source: 'manual',
      })
      expect(mockClient.from).toHaveBeenCalledWith('posts')
    })
  })

  describe('createPersona', () => {
    it('gets current user and inserts persona', async () => {
      setMockReturnValue({
        data: { id: 'persona-new', name: 'Test Persona' },
        error: null,
      })

      await createPersona({
        name: 'Test Persona',
        handle: '@test',
      })

      expect(mockAuth.getUser).toHaveBeenCalled()
      expect(mockClient.from).toHaveBeenCalledWith('personas')
    })

    it('throws if not authenticated', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      await expect(createPersona({ name: 'Test', handle: '@test' }))
        .rejects.toThrow('Not authenticated')
    })
  })

  describe('addRSSSource', () => {
    it('inserts RSS source data', async () => {
      setMockReturnValue({
        data: { id: 'rss-1', name: 'Test RSS' },
        error: null,
      })

      await addRSSSource({
        persona_id: 'persona-1',
        name: 'Test RSS',
        url: 'https://example.com/rss',
      })
      expect(mockClient.from).toHaveBeenCalledWith('rss_sources')
    })
  })

  describe('deleteRSSSource', () => {
    it('deletes by source ID', async () => {
      await deleteRSSSource('rss-1')
      expect(mockClient.from).toHaveBeenCalledWith('rss_sources')
    })
  })

  describe('toggleRSSSource', () => {
    it('updates source status', async () => {
      await toggleRSSSource('rss-1', 'paused')
      expect(mockClient.from).toHaveBeenCalledWith('rss_sources')
    })
  })

  describe('updatePersona', () => {
    it('updates persona by ID', async () => {
      setMockReturnValue({
        data: { id: 'persona-1', name: 'Updated' },
        error: null,
      })

      await updatePersona('persona-1', { name: 'Updated' })
      expect(mockClient.from).toHaveBeenCalledWith('personas')
    })
  })

  describe('generateWithAI', () => {
    it('invokes generate-post edge function', async () => {
      const result = await generateWithAI('persona-1', 'AI topic', 5)

      expect(mockFunctions.invoke).toHaveBeenCalledWith('generate-post', {
        body: { persona_id: 'persona-1', topic: 'AI topic', count: 5, rss_source_id: undefined, use_tweet_style: false },
      })
      expect(result).toEqual({ success: true })
    })

    it('throws on error', async () => {
      mockFunctions.invoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Function failed'),
      })

      await expect(generateWithAI('persona-1')).rejects.toThrow('Function failed')
    })

    it('uses default count of 3', async () => {
      await generateWithAI('persona-1')
      expect(mockFunctions.invoke).toHaveBeenCalledWith('generate-post', {
        body: { persona_id: 'persona-1', topic: undefined, count: 3, rss_source_id: undefined, use_tweet_style: false },
      })
    })

    it('passes use_tweet_style when enabled', async () => {
      await generateWithAI('persona-1', 'topic', 3, undefined, true)
      expect(mockFunctions.invoke).toHaveBeenCalledWith('generate-post', {
        body: { persona_id: 'persona-1', topic: 'topic', count: 3, rss_source_id: undefined, use_tweet_style: true },
      })
    })

    it('passes both rss_source_id and use_tweet_style together', async () => {
      await generateWithAI('persona-1', 'topic', 5, 'rss-1', true)
      expect(mockFunctions.invoke).toHaveBeenCalledWith('generate-post', {
        body: { persona_id: 'persona-1', topic: 'topic', count: 5, rss_source_id: 'rss-1', use_tweet_style: true },
      })
    })

    it('defaults use_tweet_style to false', async () => {
      await generateWithAI('persona-1', 'topic', 3, 'rss-1')
      expect(mockFunctions.invoke).toHaveBeenCalledWith('generate-post', {
        body: { persona_id: 'persona-1', topic: 'topic', count: 3, rss_source_id: 'rss-1', use_tweet_style: false },
      })
    })
  })

  describe('fetchTweets', () => {
    it('invokes fetch-tweets edge function', async () => {
      mockFunctions.invoke.mockResolvedValueOnce({
        data: { count: 10, total: 50 },
        error: null,
      })

      const result = await fetchTweets('persona-1')

      expect(mockFunctions.invoke).toHaveBeenCalledWith('fetch-tweets', {
        body: { persona_id: 'persona-1' },
      })
      expect(result).toEqual({ count: 10, total: 50 })
    })

    it('throws on error', async () => {
      mockFunctions.invoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Fetch failed'),
      })

      await expect(fetchTweets('persona-1')).rejects.toThrow('Fetch failed')
    })

    it('returns typed count and total', async () => {
      mockFunctions.invoke.mockResolvedValueOnce({
        data: { count: 0, total: 100 },
        error: null,
      })

      const result = await fetchTweets('persona-1')
      expect(result.count).toBe(0)
      expect(result.total).toBe(100)
    })
  })

  describe('publishToTwitter', () => {
    it('invokes publish-post edge function', async () => {
      const result = await publishToTwitter('post-1')

      expect(mockFunctions.invoke).toHaveBeenCalledWith('publish-post', {
        body: { post_id: 'post-1' },
      })
      expect(result).toEqual({ success: true })
    })

    it('throws on error', async () => {
      mockFunctions.invoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Publish failed'),
      })

      await expect(publishToTwitter('post-1')).rejects.toThrow('Publish failed')
    })
  })

  describe('syncRSSSource', () => {
    it('invokes sync-rss edge function', async () => {
      const result = await syncRSSSource('rss-1')

      expect(mockFunctions.invoke).toHaveBeenCalledWith('sync-rss', {
        body: { rss_source_id: 'rss-1' },
      })
      expect(result).toEqual({ success: true })
    })

    it('throws on error', async () => {
      mockFunctions.invoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Sync failed'),
      })

      await expect(syncRSSSource('rss-1')).rejects.toThrow('Sync failed')
    })
  })
})
