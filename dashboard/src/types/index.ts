export type PostStatus = 'pending' | 'approved' | 'rejected' | 'scheduled' | 'published';

export type PostSource = 'claude-ai' | 'rss' | 'manual' | 'template';

export interface PostAuthor {
  name: string;
  handle: string;
  avatarUrl?: string;
  avatarInitials?: string;
  avatarEmoji?: string;
}

export interface Post {
  id: string;
  content: string;
  status: PostStatus;
  source: PostSource;
  sourceName: string;
  author: PostAuthor;
  createdAt: string;
  scheduledAt?: string;
  publishedAt?: string;
  hasImage?: boolean;
  hashtags?: string[];
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
}

export interface User {
  id: string;
  name: string;
  initials: string;
  plan: string;
}

export type NavItemId = 'dashboard' | 'queue' | 'sources' | 'analytics';

export interface NavItem {
  id: NavItemId;
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export type QueueTab = 'queue' | 'scheduled' | 'published';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

// ========== RSS Sources ==========

export type SourceStatus = 'active' | 'paused' | 'error';

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  category: string;
  status: SourceStatus;
  lastSync: string;
  articleCount: number;
  icon: string;
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
  publishedAt: string;
}

// ========== Dashboard ==========

export type ActivityType = 'post_approved' | 'post_published' | 'post_rejected' | 'source_synced' | 'ai_generated';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
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
