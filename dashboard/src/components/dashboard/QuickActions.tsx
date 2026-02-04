import { Plus, Rss, Sparkles, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  {
    label: 'Novo Post',
    description: 'Crie um post manualmente',
    href: '/queue',
    icon: Plus,
    color: 'bg-slate-900 text-white',
  },
  {
    label: 'Gerar com IA',
    description: 'Deixe a IA criar conte\u00FAdo',
    href: '/queue',
    icon: Sparkles,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    label: 'Adicionar Fonte',
    description: 'Conecte um novo feed RSS',
    href: '/sources',
    icon: Rss,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Ver Analytics',
    description: 'Acompanhe a performance',
    href: '/analytics',
    icon: BarChart2,
    color: 'bg-sky-50 text-sky-600',
  },
];

export function QuickActions() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">A\u00E7\u00F5es R\u00E1pidas</h3>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <a
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group"
            >
              <div className={cn('p-2.5 rounded-xl transition-colors', action.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{action.label}</p>
                <p className="text-xs text-slate-500">{action.description}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
