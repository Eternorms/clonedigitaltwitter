'use client';

import { useState } from 'react';
import { ExternalLink, Pause, Play, RefreshCw, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { deleteRSSSource, toggleRSSSource } from '@/lib/supabase/mutations';
import { useToast } from '@/lib/contexts/ToastContext';
import type { RSSSource } from '@/types';

interface SourceCardProps {
  source: RSSSource;
  onRemove?: (id: string) => void;
}

const statusMap: Record<string, { label: string; variant: 'scheduled' | 'pending' | 'rejected' }> = {
  active: { label: 'Ativo', variant: 'scheduled' },
  paused: { label: 'Pausado', variant: 'pending' },
  error: { label: 'Erro', variant: 'rejected' },
};

export function SourceCard({ source, onRemove }: SourceCardProps) {
  const status = statusMap[source.status];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const { addToast } = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await deleteRSSSource(source.id);
      if (error) throw error;
      setShowDeleteConfirm(false);
      onRemove?.(source.id);
      addToast('Fonte removida com sucesso.', 'success');
    } catch {
      addToast('Erro ao remover a fonte.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async () => {
    const newStatus = source.status === 'active' ? 'paused' : 'active';
    setToggling(true);
    try {
      const { error } = await toggleRSSSource(source.id, newStatus);
      if (error) throw error;
      addToast(newStatus === 'active' ? 'Fonte ativada.' : 'Fonte pausada.', 'success');
    } catch {
      addToast('Erro ao alterar status da fonte.', 'error');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-hover transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
            {source.icon}
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{source.name}</h3>
            <p className="text-xs text-slate-400 font-medium">{source.category}</p>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        <span className="font-medium">
          {source.article_count} artigos
        </span>
        <span>
          Sync: {source.last_sync_at ? formatRelativeTime(source.last_sync_at) : 'Nunca'}
        </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Sincronizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
            aria-label={source.status === 'active' ? 'Pausar' : 'Ativar'}
          >
            {source.status === 'active' ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            aria-label="Excluir fonte"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-sky-500 transition-colors flex items-center gap-1 font-medium"
        >
          <ExternalLink className="w-3 h-3" />
          Ver feed
        </a>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Excluir Fonte RSS"
        description={`Tem certeza que deseja excluir "${source.name}"?`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
