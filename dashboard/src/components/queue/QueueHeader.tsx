'use client';

import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QueueHeaderProps {
  onNewPost: () => void;
  onGenerateAI: () => void;
}

export function QueueHeader({ onNewPost, onGenerateAI }: QueueHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Fila de Aprovação
        </h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">
          Gerencie o conteúdo gerado hoje.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="lg"
          icon={<Sparkles className="w-5 h-5" />}
          onClick={onGenerateAI}
        >
          Gerar com IA
        </Button>
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
          onClick={onNewPost}
        >
          Novo Post
        </Button>
      </div>
    </header>
  );
}
