'use client';

import { useState } from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { PostCard } from '@/components/queue/PostCard';
import { queueTabs, posts } from '@/lib/mock-data';
import type { QueueTab } from '@/types';

const tabToStatusMap: Record<QueueTab, string[]> = {
  queue: ['pending'],
  scheduled: ['scheduled', 'approved'],
  published: ['published'],
};

export function PostList() {
  const [activeTab, setActiveTab] = useState<string>('queue');

  const filteredPosts = posts.filter((post) =>
    tabToStatusMap[activeTab as QueueTab]?.includes(post.status)
  );

  return (
    <div className="space-y-6">
      <Tabs tabs={queueTabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="space-y-6">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm font-medium">Nenhum post nesta categoria</p>
          </div>
        )}
      </div>
    </div>
  );
}
