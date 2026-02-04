export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          plan: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          plan?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      personas: {
        Row: {
          id: string
          user_id: string
          name: string
          handle: string
          emoji: string | null
          description: string | null
          tone: string | null
          topics: Json
          twitter_user_id: string | null
          twitter_access_token: string | null
          twitter_refresh_token: string | null
          twitter_connected: boolean
          followers_count: number
          engagement_rate: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          handle: string
          emoji?: string | null
          description?: string | null
          tone?: string | null
          topics?: Json
          twitter_user_id?: string | null
          twitter_access_token?: string | null
          twitter_refresh_token?: string | null
          twitter_connected?: boolean
          followers_count?: number
          engagement_rate?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          handle?: string
          emoji?: string | null
          description?: string | null
          tone?: string | null
          topics?: Json
          twitter_user_id?: string | null
          twitter_access_token?: string | null
          twitter_refresh_token?: string | null
          twitter_connected?: boolean
          followers_count?: number
          engagement_rate?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'personas_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      posts: {
        Row: {
          id: string
          persona_id: string
          content: string
          status: Database['public']['Enums']['post_status']
          source: Database['public']['Enums']['post_source']
          source_name: string | null
          image_url: string | null
          hashtags: Json
          scheduled_at: string | null
          published_at: string | null
          twitter_post_id: string | null
          impressions: number
          engagements: number
          likes: number
          retweets: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          persona_id: string
          content: string
          status?: Database['public']['Enums']['post_status']
          source: Database['public']['Enums']['post_source']
          source_name?: string | null
          image_url?: string | null
          hashtags?: Json
          scheduled_at?: string | null
          published_at?: string | null
          twitter_post_id?: string | null
          impressions?: number
          engagements?: number
          likes?: number
          retweets?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          persona_id?: string
          content?: string
          status?: Database['public']['Enums']['post_status']
          source?: Database['public']['Enums']['post_source']
          source_name?: string | null
          image_url?: string | null
          hashtags?: Json
          scheduled_at?: string | null
          published_at?: string | null
          twitter_post_id?: string | null
          impressions?: number
          engagements?: number
          likes?: number
          retweets?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'posts_persona_id_fkey'
            columns: ['persona_id']
            isOneToOne: false
            referencedRelation: 'personas'
            referencedColumns: ['id']
          }
        ]
      }
      activities: {
        Row: {
          id: string
          user_id: string
          persona_id: string | null
          type: Database['public']['Enums']['activity_type']
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          persona_id?: string | null
          type: Database['public']['Enums']['activity_type']
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          persona_id?: string | null
          type?: Database['public']['Enums']['activity_type']
          description?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activities_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activities_persona_id_fkey'
            columns: ['persona_id']
            isOneToOne: false
            referencedRelation: 'personas'
            referencedColumns: ['id']
          }
        ]
      }
      rss_sources: {
        Row: {
          id: string
          persona_id: string
          name: string
          url: string
          category: string | null
          status: Database['public']['Enums']['source_status']
          icon: string | null
          last_sync_at: string | null
          article_count: number
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          persona_id: string
          name: string
          url: string
          category?: string | null
          status?: Database['public']['Enums']['source_status']
          icon?: string | null
          last_sync_at?: string | null
          article_count?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          persona_id?: string
          name?: string
          url?: string
          category?: string | null
          status?: Database['public']['Enums']['source_status']
          icon?: string | null
          last_sync_at?: string | null
          article_count?: number
          error_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rss_sources_persona_id_fkey'
            columns: ['persona_id']
            isOneToOne: false
            referencedRelation: 'personas'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_scheduled_posts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      post_status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'published'
      post_source: 'claude_ai' | 'rss' | 'manual' | 'template'
      activity_type: 'post_approved' | 'post_published' | 'post_rejected' | 'source_synced' | 'ai_generated'
      source_status: 'active' | 'paused' | 'error'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for convenience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
