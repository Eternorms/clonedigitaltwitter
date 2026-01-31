import { QueueHeader } from '@/components/queue/QueueHeader';
import { StatsGrid } from '@/components/queue/StatsGrid';
import { PostList } from '@/components/queue/PostList';

export default function QueuePage() {
  return (
    <>
      <QueueHeader />
      <StatsGrid />
      <PostList />
    </>
  );
}
