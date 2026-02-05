'use client';

import { useState } from 'react';
import { QueueHeader } from '@/components/queue/QueueHeader';
import { StatsGrid } from '@/components/queue/StatsGrid';
import { PostList } from '@/components/queue/PostList';
import { NewPostModal } from '@/components/queue/NewPostModal';
import type { Post, QueueStats } from '@/types';

interface QueuePageContentProps {
  initialPosts: Post[];
  stats: QueueStats;
}

export function QueuePageContent({ initialPosts, stats }: QueuePageContentProps) {
  const [showNewPost, setShowNewPost] = useState(false);

  return (
    <>
      <QueueHeader onNewPost={() => setShowNewPost(true)} />
      <StatsGrid stats={stats} />
      <PostList initialPosts={initialPosts} />
      <NewPostModal open={showNewPost} onClose={() => setShowNewPost(false)} />
    </>
  );
}
