'use client';

import { useState } from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { PostCard } from '@/components/queue/PostCard';
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
