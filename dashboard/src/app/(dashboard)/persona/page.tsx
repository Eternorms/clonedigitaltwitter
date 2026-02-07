import { Suspense } from 'react';
import { PersonaPageContent } from '@/components/persona/PersonaPageContent';
import { PersonaSkeleton } from '@/components/ui/Skeleton';
import { getPersonasDetail } from '@/lib/supabase/queries';

async function PersonaContent() {
  const personas = await getPersonasDetail();
  return <PersonaPageContent personas={personas} />;
}

export default function PersonaPage() {
  return (
    <Suspense fallback={<PersonaSkeleton />}>
      <PersonaContent />
    </Suspense>
  );
}
