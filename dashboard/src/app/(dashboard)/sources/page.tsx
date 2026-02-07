import { Suspense } from 'react';
import { SourcesPageContent } from '@/components/sources/SourcesPageContent';
import { SourcesSkeleton } from '@/components/ui/Skeleton';
import { getRssSources } from '@/lib/supabase/queries';

async function SourcesContent() {
  const sources = await getRssSources();
  return <SourcesPageContent sources={sources} />;
}

export default function SourcesPage() {
  return (
    <Suspense fallback={<SourcesSkeleton />}>
      <SourcesContent />
    </Suspense>
  );
}
