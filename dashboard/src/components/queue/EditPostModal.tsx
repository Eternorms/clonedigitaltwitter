'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { updatePostContent } from '@/lib/supabase/mutations';
import { useToast } from '@/lib/contexts/ToastContext';
import type { Post } from '@/types';

interface EditPostModalProps {
  open: boolean;
  onClose: () => void;
  post: Post;
  onSave?: (id: string, content: string) => void;
}

export function EditPostModal({ open, onClose, post, onSave }: EditPostModalProps) {
  const [content, setContent] = useState(post.content);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const charCount = content.length;
  const isOverLimit = charCount > 280;

  const handleSave = async () => {
    if (!content.trim()) {
      addToast('O conteúdo não pode estar vazio.', 'error');
      return;
    }
    if (isOverLimit) {
      addToast('O conteúdo excede 280 caracteres.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePostContent(post.id, content.trim());
      if (error) throw error;
      onSave?.(post.id, content.trim());
      addToast('Post atualizado com sucesso!', 'success');
      onClose();
    } catch {
      addToast('Erro ao atualizar post.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all';

  return (
    <Modal open={open} title="Editar Post" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Conteúdo
            </label>
            <span
              className={`text-xs font-bold ${
                isOverLimit ? 'text-red-500' : charCount > 250 ? 'text-amber-500' : 'text-slate-400'
              }`}
            >
              {charCount}/280
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className={inputClass + ' resize-none'}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} loading={loading}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
