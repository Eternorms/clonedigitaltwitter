import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PersonaCard } from '@/components/persona/PersonaCard';
import { getPersonasDetail } from '@/lib/supabase/queries';

export default async function PersonaPage() {
  const personas = await getPersonasDetail();

  return (
    <>
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Personas
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">
            Gerencie seus perfis e identidades digitais.
          </p>
        </div>
        <Button variant="primary" size="lg" icon={<Plus className="w-5 h-5" />}>
          Nova Persona
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {personas.map((persona) => (
          <PersonaCard key={persona.id} persona={persona} />
        ))}
      </div>
    </>
  );
}
