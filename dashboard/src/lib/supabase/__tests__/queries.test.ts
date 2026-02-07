import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  setMockReturnValue,
  resetMockReturnValue,
  getMockAuth,
} from '@/test/mocks/supabase'
import {
  getCurrentUser,
  getPersonas,
  getPersonasDetail,
  getPosts,
  getQueueStats,
  getActivities,
  getRssSources,
  getTopPosts,
  getDailyMetrics,
} from '../queries'

describe('queries', () => {
  const mockAuth = getMockAuth()

  beforeEach(() => {
    resetMockReturnValue()
    vi.clearAllMocks()
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    })
  })

  describe('getCurrentUser', () => {
    it('returns null if no authenticated user', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await getCurrentUser()
      expect(result).toBeNull()
    })

    it('returns null if profile not found', async () => {
      setMockReturnValue({ data: null, error: null })

      const result = await getCurrentUser()
      expect(result).toBeNull()
    })

    it('returns formatted user with initials', async () => {
      setMockReturnValue({
        data: {
          id: 'user-1',
          name: 'John Doe',
          plan: 'free',
          preferred_model: 'gemini-2.0-flash',
        },
        error: null,
      })

      const result = await getCurrentUser()
      expect(result).toEqual({
        id: 'user-1',
        name: 'John Doe',
        email: 'test@test.com',
        initials: 'JD',
        plan: 'Free Plan',
        preferredModel: 'gemini-2.0-flash',
      })
    })

    it('returns Pro Plan for non-free plans', async () => {
      setMockReturnValue({
        data: {
          id: 'user-1',
          name: 'Jane',
          plan: 'pro',
          preferred_model: 'gemini-1.5-pro',
        },
        error: null,
      })

      const result = await getCurrentUser()
      expect(result?.plan).toBe('Pro Plan')
    })
  })

  describe('getPersonas', () => {
    it('returns empty array when no data', async () => {
      setMockReturnValue({ data: null, error: null })
      const result = await getPersonas()
      expect(result).toEqual([])
    })

    it('returns personas with default emoji', async () => {
      setMockReturnValue({
        data: [
          { id: 'p1', name: 'Tech Bot', handle: '@tech', emoji: null },
          { id: 'p2', name: 'News Bot', handle: '@news', emoji: '📰' },
        ],
        error: null,
      })

      const result = await getPersonas()
      expect(result).toHaveLength(2)
      expect(result[0].emoji).toBe('')
      expect(result[1].emoji).toBe('📰')
    })
  })

  describe('getPersonasDetail', () => {
    it('returns empty array when no data', async () => {
      setMockReturnValue({ data: null, error: null })
      const result = await getPersonasDetail()
      expect(result).toEqual([])
    })

    it('maps detailed persona data correctly', async () => {
      setMockReturnValue({
        data: [
          {
            id: 'p1',
            name: 'Tech Bot',
            handle: '@tech',
            emoji: '🤖',
            description: 'A tech bot',
            tone: 'professional',
            topics: ['ai', 'tech'],
            twitter_connected: true,
            followers_count: 1000,
            engagement_rate: '3.5',
            is_active: true,
            created_at: '2026-01-01',
            posts: [{ count: 42 }],
          },
        ],
        error: null,
      })

      const result = await getPersonasDetail()
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'p1',
        name: 'Tech Bot',
        postsCount: 42,
        followersCount: 1000,
        engagementRate: 3.5,
        twitterConnected: true,
      })
    })
  })

  describe('getPosts', () => {
    it('returns empty array when no data', async () => {
      setMockReturnValue({ data: null, error: null })
      const result = await getPosts()
      expect(result).toEqual([])
    })

    it('maps post data with author info', async () => {
      setMockReturnValue({
        data: [
          {
            id: 'post-1',
            persona_id: 'p1',
            content: 'Hello world',
            status: 'pending',
            source: 'manual',
            source_name: 'Manual',
            personas: { name: 'Bot', handle: '@bot', emoji: '🤖' },
            created_at: '2026-01-15T12:00:00Z',
            scheduled_at: null,
            published_at: null,
            image_url: null,
            hashtags: ['#test'],
            impressions: 100,
            engagements: 10,
            likes: 5,
            retweets: 2,
          },
        ],
        error: null,
      })

      const result = await getPosts()
      expect(result).toHaveLength(1)
      expect(result[0].author).toEqual({
        name: 'Bot',
        handle: '@bot',
        avatarEmoji: '🤖',
      })
    })

    it('handles null persona gracefully', async () => {
      setMockReturnValue({
        data: [
          {
            id: 'post-1',
            persona_id: 'p1',
            content: 'Hello',
            status: 'pending',
            source: 'manual',
            source_name: null,
            personas: null,
            created_at: '2026-01-15T12:00:00Z',
            scheduled_at: null,
            published_at: null,
            image_url: null,
            hashtags: [],
            impressions: 0,
            engagements: 0,
            likes: 0,
            retweets: 0,
          },
        ],
        error: null,
      })

      const result = await getPosts()
      expect(result[0].author.name).toBe('')
      expect(result[0].author.handle).toBe('')
    })
  })

  describe('getQueueStats', () => {
    it('returns stats with zero counts when no data', async () => {
      setMockReturnValue({ data: null, error: null, count: 0 })
      const result = await getQueueStats()
      expect(result).toEqual({
        pending: 0,
        approved: 0,
        rejected: 0,
        aiPerformance: 0,
      })
    })
  })

  describe('getActivities', () => {
    it('returns empty array when no data', async () => {
      setMockReturnValue({ data: null, error: null })
      const result = await getActivities()
      expect(result).toEqual([])
    })

    it('returns activities', async () => {
      setMockReturnValue({
        data: [
          { id: 'a1', type: 'post_approved', description: 'Post approved', created_at: '2026-01-15' },
        ],
        error: null,
      })

      const result = await getActivities()
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('post_approved')
    })
  })

  describe('getRssSources', () => {
    it('returns empty array when no data', async () => {
      setMockReturnValue({ data: null, error: null })
      const result = await getRssSources()
      expect(result).toEqual([])
    })
  })

  describe('getTopPosts', () => {
    it('returns empty array when no data', async () => {
      setMockReturnValue({ data: null, error: null })
      const result = await getTopPosts()
      expect(result).toEqual([])
    })
  })

  describe('getDailyMetrics', () => {
    it('returns empty array when no posts', async () => {
      setMockReturnValue({ data: null, error: null })
      const result = await getDailyMetrics()
      expect(result).toEqual([])
    })

    it('returns empty array for empty posts array', async () => {
      setMockReturnValue({ data: [], error: null })
      const result = await getDailyMetrics()
      expect(result).toEqual([])
    })
  })
})
