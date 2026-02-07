import { Suspense } from 'react';
import { QueuePageContent } from '@/components/queue/QueuePageContent';
import { QueueSkeleton } from '@/components/ui/Skeleton';
import { getPosts, getQueueStats } from '@/lib/supabase/queries';

async function QueueContent() {
  const [posts, stats] = await Promise.all([getPosts(), getQueueStats()]);
  return <QueuePageContent initialPosts={posts} stats={stats} />;
}

export default function QueuePage() {
  return (
    <Suspense fallback={<QueueSkeleton />}>
      <QueueContent />
    </Suspense>
  );
}
