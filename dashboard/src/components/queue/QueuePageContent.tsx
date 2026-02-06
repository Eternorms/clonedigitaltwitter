'use client';

import { useState, useCallback, useRef } from 'react';
import { QueueHeader } from '@/components/queue/QueueHeader';
import { StatsGrid } from '@/components/queue/StatsGrid';
import { PostList } from '@/components/queue/PostList';
import { NewPostModal } from '@/components/queue/NewPostModal';
import { GenerateAIModal } from '@/components/queue/GenerateAIModal';
import type { Post, QueueStats } from '@/types';

interface QueuePageContentProps {
  initialPosts: Post[];
  stats: QueueStats;
}

export function QueuePageContent({ initialPosts, stats }: QueuePageContentProps) {
  const [showNewPost, setShowNewPost] = useState(false);
  const [showGenerateAI, setShowGenerateAI] = useState(false);
  const refetchRef = useRef<(() => Promise<void>) | null>(null);

  const handleRefetchReady = useCallback((refetch: () => Promise<void>) => {
    refetchRef.current = refetch;
  }, []);

  const handleGenerated = useCallback(async () => {
    if (refetchRef.current) {
      await refetchRef.current();
    }
  }, []);

  const handleNewPostCreated = useCallback(async () => {
    if (refetchRef.current) {
      await refetchRef.current();
    }
  }, []);

  return (
    <>
      <QueueHeader
        onNewPost={() => setShowNewPost(true)}
        onGenerateAI={() => setShowGenerateAI(true)}
      />
      <StatsGrid stats={stats} />
      <PostList initialPosts={initialPosts} onRefetchReady={handleRefetchReady} />
      <NewPostModal
        open={showNewPost}
        onClose={() => setShowNewPost(false)}
        onCreated={handleNewPostCreated}
      />
      <GenerateAIModal
        open={showGenerateAI}
        onClose={() => setShowGenerateAI(false)}
        onGenerated={handleGenerated}
      />
    </>
  );
}
