import { FileText, Users, TrendingUp, Twitter, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { PersonaDetail } from '@/types';

interface PersonaCardProps {
  persona: PersonaDetail;
  onEdit?: (persona: PersonaDetail) => void;
}

export function PersonaCard({ persona, onEdit }: PersonaCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-hover transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <span className="text-3xl w-14 h-14 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-sm" role="img" aria-label={persona.name}>
            {persona.emoji}
          </span>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{persona.name}</h3>
            <p className="text-sm text-slate-400 font-medium">{persona.handle}</p>
          </div>
        </div>
        <button
          onClick={() => onEdit?.(persona)}
          aria-label={`Editar ${persona.name}`}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed mb-4">
        {persona.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {persona.topics.map((topic) => (
          <span
            key={topic}
            className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold"
          >
            {topic}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5 pt-5 border-t border-slate-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <p className="text-lg font-extrabold text-slate-900">{persona.postsCount}</p>
          <p className="text-xs text-slate-500 font-medium">Posts</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
            <Users className="w-3.5 h-3.5" />
          </div>
          <p className="text-lg font-extrabold text-slate-900">
            {persona.followersCount >= 1000
              ? `${(persona.followersCount / 1000).toFixed(1)}k`
              : persona.followersCount}
          </p>
          <p className="text-xs text-slate-500 font-medium">Followers</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <p className="text-lg font-extrabold text-slate-900">{persona.engagementRate}%</p>
          <p className="text-xs text-slate-500 font-medium">Engage</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Tom:</span>
          <span className="text-xs font-bold text-slate-700">{persona.tone}</span>
        </div>
        <Badge variant={persona.twitterConnected ? 'scheduled' : 'pending'}>
          <Twitter className="w-3 h-3" />
          {persona.twitterConnected ? 'Conectado' : 'Desconectado'}
        </Badge>
      </div>
    </div>
  );
}
