import { SourcesPageContent } from '@/components/sources/SourcesPageContent';
import { getRssSources } from '@/lib/supabase/queries';

export default async function SourcesPage() {
  const sources = await getRssSources();

  return <SourcesPageContent sources={sources} />;
}
