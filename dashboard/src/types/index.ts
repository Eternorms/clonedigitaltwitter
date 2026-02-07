export type PostStatus = 'pending' | 'approved' | 'rejected' | 'scheduled' | 'published';

export type PostSource = 'claude_ai' | 'rss' | 'manual' | 'template';

export interface PostAuthor {
  name: string;
  handle: string;
  avatarUrl?: string;
  avatarInitials?: string;
  avatarEmoji?: string;
}

export interface Post {
  id: string;
  persona_id: string;
  content: string;
  status: PostStatus;
  source: PostSource;
  source_name: string | null;
  author: PostAuthor;
  created_at: string;
  scheduled_at?: string | null;
  published_at?: string | null;
  image_url?: string | null;
  hashtags: string[];
  impressions: number;
  engagements: number;
  likes: number;
  retweets: number;
}

export interface QueueStats {
  pending: number;
  approved: number;
  rejected: number;
  aiPerformance: number;
}

export interface Persona {
  id: string;
  name: string;
  handle: string;
  emoji: string;
  twitter_user_id?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  plan: string;
  preferredModel: string;
}

// ========== LLM Models ==========

export interface LLMModel {
  id: string;
  name: string;
  description: string;
  provider: string;
}

export const LLM_MODELS: LLMModel[] = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Rápido e eficiente para a maioria dos casos', provider: 'Google' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Ultra-rápido, ideal para alto volume', provider: 'Google' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Maior qualidade e contexto estendido', provider: 'Google' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Equilíbrio entre velocidade e qualidade', provider: 'Google' },
];

export type NavItemId = 'dashboard' | 'queue' | 'sources' | 'analytics';

export interface NavItem {
  id: NavItemId;
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export type QueueTab = 'queue' | 'scheduled' | 'published' | 'rejected';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

// ========== RSS Sources ==========

export type SourceStatus = 'active' | 'paused' | 'error';

export interface RSSSource {
  id: string;
  persona_id: string;
  name: string;
  url: string;
  category: string | null;
  status: SourceStatus;
  last_sync_at: string | null;
  article_count: number;
  icon: string | null;
}

// ========== Analytics ==========

export interface DailyMetric {
  date: string;
  posts: number;
  impressions: number;
  engagements: number;
}

export interface TopPost {
  id: string;
  content: string;
  impressions: number;
  engagements: number;
  likes: number;
  retweets: number;
  published_at: string | null;
}

// ========== Dashboard ==========

export type ActivityType = 'post_approved' | 'post_published' | 'post_rejected' | 'source_synced' | 'ai_generated';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  created_at: string;
}

// ========== Settings ==========

export interface APIConnection {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  icon: string;
}

// ========== Persona Extended ==========

export interface PersonaDetail extends Persona {
  description: string;
  tone: string;
  topics: string[];
  postsCount: number;
  followersCount: number;
  engagementRate: number;
  twitterConnected: boolean;
}
