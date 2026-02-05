'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QueueHeaderProps {
  onNewPost: () => void;
}

export function QueueHeader({ onNewPost }: QueueHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-12">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Fila de Aprovação
        </h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">
          Gerencie o conteúdo gerado hoje.
        </p>
      </div>
      <Button
        variant="primary"
        size="lg"
        icon={<Plus className="w-5 h-5" />}
        onClick={onNewPost}
      >
        Novo Post
      </Button>
    </header>
  );
}
