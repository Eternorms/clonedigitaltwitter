import { QueuePageContent } from '@/components/queue/QueuePageContent';
import { getPosts, getQueueStats } from '@/lib/supabase/queries';

export default async function QueuePage() {
  const [posts, stats] = await Promise.all([getPosts(), getQueueStats()]);

  return <QueuePageContent initialPosts={posts} stats={stats} />;
}
