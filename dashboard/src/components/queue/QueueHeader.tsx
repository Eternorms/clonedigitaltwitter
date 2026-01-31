import { Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function QueueHeader() {
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
      <div className="flex gap-4">
        <Button
          variant="secondary"
          size="lg"
          icon={<Filter className="w-4 h-4" />}
        >
          Filtros
        </Button>
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
        >
          Novo Post
        </Button>
      </div>
    </header>
  );
}
