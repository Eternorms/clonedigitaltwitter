'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, Rss } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SourceCard } from '@/components/dashboard/SourceCard';
import { NewSourceModal } from '@/components/sources/NewSourceModal';
import { EmptyState } from '@/components/ui/EmptyState';
import type { RSSSource } from '@/types';

interface SourcesPageContentProps {
  sources: RSSSource[];
}

export function SourcesPageContent({ sources: initialSources }: SourcesPageContentProps) {
  const [sources, setSources] = useState(initialSources);
  const [showNewSource, setShowNewSource] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeSources = sources.filter((s) => s.status === 'active').length;

  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return sources;
    const q = searchQuery.toLowerCase();
    return sources.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category?.toLowerCase().includes(q) ?? false)
    );
  }, [sources, searchQuery]);

  const handleRemove = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCreated = (source: RSSSource) => {
    setSources((prev) => [...prev, source]);
  };

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Fontes (RSS)
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">
            {sources.length} fontes configuradas · {activeSources} ativas
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowNewSource(true)}
        >
          Nova Fonte
        </Button>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar fontes..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSources.length > 0 ? (
          filteredSources.map((source) => (
            <SourceCard key={source.id} source={source} onRemove={handleRemove} />
          ))
        ) : searchQuery ? (
          <div className="col-span-full text-center py-16 text-slate-400">
            <p className="text-sm font-medium">Nenhuma fonte encontrada.</p>
          </div>
        ) : (
          <EmptyState
            icon={<Rss className="w-8 h-8" />}
            title="Nenhuma fonte RSS"
            description="Conecte feeds RSS para importar conteúdo automaticamente e abastecer sua fila de posts."
            actionLabel="Adicionar Fonte"
            onAction={() => setShowNewSource(true)}
          />
        )}
      </div>

      <NewSourceModal
        open={showNewSource}
        onClose={() => setShowNewSource(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
