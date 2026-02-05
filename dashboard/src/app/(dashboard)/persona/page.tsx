import { PersonaPageContent } from '@/components/persona/PersonaPageContent';
import { getPersonasDetail } from '@/lib/supabase/queries';

export default async function PersonaPage() {
  const personas = await getPersonasDetail();

  return <PersonaPageContent personas={personas} />;
}
