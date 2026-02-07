'use client';

import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PersonaCard } from '@/components/persona/PersonaCard';
import { NewPersonaModal } from '@/components/persona/NewPersonaModal';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PersonaDetail } from '@/types';

interface PersonaPageContentProps {
  personas: PersonaDetail[];
}

export function PersonaPageContent({ personas }: PersonaPageContentProps) {
  const [showNewPersona, setShowNewPersona] = useState(false);
  const [editingPersona, setEditingPersona] = useState<PersonaDetail | null>(null);

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.length > 0 ? (
          personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onEdit={(p) => setEditingPersona(p)}
            />
          ))
        ) : (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="Nenhuma persona criada"
            description="Crie uma persona para definir o tom de voz e o estilo do conteúdo gerado pela IA."
            actionLabel="Criar Persona"
            onAction={() => setShowNewPersona(true)}
          />
        )}
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
