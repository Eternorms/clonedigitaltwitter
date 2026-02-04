import { QueueHeader } from '@/components/queue/QueueHeader';
import { StatsGrid } from '@/components/queue/StatsGrid';
import { PostList } from '@/components/queue/PostList';
import { getPosts, getQueueStats } from '@/lib/supabase/queries';

export default async function QueuePage() {
  const [posts, stats] = await Promise.all([getPosts(), getQueueStats()]);

  return (
    <>
      <QueueHeader />
      <StatsGrid stats={stats} />
      <PostList initialPosts={posts} />
    </>
  );
}
