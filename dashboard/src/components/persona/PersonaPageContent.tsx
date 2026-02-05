'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PersonaCard } from '@/components/persona/PersonaCard';
import { NewPersonaModal } from '@/components/persona/NewPersonaModal';
import type { PersonaDetail } from '@/types';

interface PersonaPageContentProps {
  personas: PersonaDetail[];
}

export function PersonaPageContent({ personas }: PersonaPageContentProps) {
  const [showNewPersona, setShowNewPersona] = useState(false);
  const [editingPersona, setEditingPersona] = useState<PersonaDetail | null>(null);

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
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowNewPersona(true)}
        >
          Nova Persona
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            onEdit={(p) => setEditingPersona(p)}
          />
        ))}
      </div>

      <NewPersonaModal
        open={showNewPersona}
        onClose={() => setShowNewPersona(false)}
      />

      {editingPersona && (
        <NewPersonaModal
          open={!!editingPersona}
          onClose={() => setEditingPersona(null)}
          editingPersona={editingPersona}
        />
      )}
    </>
  );
}
