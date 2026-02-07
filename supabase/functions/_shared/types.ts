/**
 * Shared types for Clone Digital Twitter Edge Functions
 */

/** Post record as stored in the database */
export interface Post {
  id: string
  persona_id: string
  content: string
  status: 'pending' | 'approved' | 'scheduled' | 'published' | 'rejected'
  source: 'claude_ai' | 'rss' | 'manual'
  source_name: string | null
  hashtags: string[]
  twitter_post_id: string | null
  published_at: string | null
  created_at: string
}

/** Persona record as stored in the database */
export interface Persona {
  id: string
  user_id: string
  name: string
  handle: string
  tone: string | null
  topics: string[]
}

/** RSS source record as stored in the database */
export interface RssSource {
  id: string
  persona_id: string
  name: string
  url: string
  status: 'active' | 'error' | 'paused'
  last_sync_at: string | null
  article_count: number
  error_message: string | null
}

/** AI-generated post from Gemini */
export interface GeneratedPost {
  content: string
  hashtags: string[]
}

/** Activity log entry */
export interface Activity {
  user_id: string
  persona_id: string
  type: 'ai_generated' | 'post_published' | 'post_approved' | 'post_rejected' | 'source_synced' | 'rss_synced'
  description: string
}

/** Telegram notification types */
export type NotificationType = 'post_published' | 'post_approved' | 'rss_synced' | 'ai_generated'

/** Standard JSON error response */
export interface ErrorResponse {
  error: string
  details?: string
}
