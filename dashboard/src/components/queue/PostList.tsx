'use client';

import { useState, useCallback } from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { PostCard } from '@/components/queue/PostCard';
import { usePersona } from '@/lib/contexts/PersonaContext';
import { useRealtimePosts } from '@/lib/supabase/realtime';
import { createClient } from '@/lib/supabase/client';
import type { Post, QueueTab, TabItem } from '@/types';

const queueTabs: TabItem[] = [
  { id: 'queue', label: 'Fila' },
  { id: 'scheduled', label: 'Agendados' },
  { id: 'published', label: 'Publicados' },
];

const tabToStatusMap: Record<QueueTab, string[]> = {
  queue: ['pending'],
  scheduled: ['scheduled', 'approved'],
  published: ['published'],
};

interface PostListProps {
  initialPosts: Post[];
}

export function PostList({ initialPosts }: PostListProps) {
  const [activeTab, setActiveTab] = useState<string>('queue');
  const [posts, setPosts] = useState(initialPosts);
  const { activePersona } = usePersona();

  const refetchPosts = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from('posts')
      .select('*, personas(name, handle, emoji)')
      .order('created_at', { ascending: false });

    if (activePersona?.id) {
      query = query.eq('persona_id', activePersona.id);
    }

    const { data } = await query;
    if (data) {
      setPosts(data.map((p: Record<string, unknown>) => {
        const persona = p.personas as { name: string; handle: string; emoji: string | null } | null;
        return {
          id: p.id as string,
          persona_id: p.persona_id as string,
          content: p.content as string,
          status: p.status as string,
          source: p.source as string,
          source_name: p.source_name as string | null,
          author: {
            name: persona?.name ?? '',
            handle: persona?.handle ?? '',
            avatarEmoji: persona?.emoji ?? undefined,
          },
          created_at: p.created_at as string,
          scheduled_at: p.scheduled_at as string | null,
          published_at: p.published_at as string | null,
          image_url: p.image_url as string | null,
          hashtags: (p.hashtags as string[]) ?? [],
          impressions: p.impressions as number,
          engagements: p.engagements as number,
          likes: p.likes as number,
          retweets: p.retweets as number,
        };
      }) as Post[]);
    }
  }, [activePersona?.id]);

  useRealtimePosts(activePersona?.id, refetchPosts);

  const filteredPosts = posts.filter((post) =>
    tabToStatusMap[activeTab as QueueTab]?.includes(post.status)
  );

  return (
    <div className="space-y-6">
      <Tabs tabs={queueTabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="space-y-6">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onStatusChange={(id, status) => {
              setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
            }} />
          ))
        ) : (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm font-medium">Nenhum post nesta categoria</p>
          </div>
        )}
      </div>
    </div>
  );
}
