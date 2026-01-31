import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SourceCard } from '@/components/dashboard/SourceCard';
import { rssSources } from '@/lib/mock-data';

export default function SourcesPage() {
  const activeSources = rssSources.filter((s) => s.status === 'active').length;

  return (
    <>
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Fontes (RSS)
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">
            {rssSources.length} fontes configuradas \u00B7 {activeSources} ativas
          </p>
        </div>
        <Button variant="primary" size="lg" icon={<Plus className="w-5 h-5" />}>
          Nova Fonte
        </Button>
      </header>

      {/* Search bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar fontes..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
        />
      </div>

      {/* Sources grid */}
      <div className="grid grid-cols-3 gap-6">
        {rssSources.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>
    </>
  );
}
