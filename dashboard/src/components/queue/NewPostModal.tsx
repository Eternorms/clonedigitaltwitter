'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createPost } from '@/lib/supabase/mutations';
import { usePersona } from '@/lib/contexts/PersonaContext';
import { useToast } from '@/lib/contexts/ToastContext';

interface NewPostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function NewPostModal({ open, onClose, onCreated }: NewPostModalProps) {
  const { personas, activePersona } = usePersona();
  const [personaId, setPersonaId] = useState(activePersona?.id ?? '');
  const [content, setContent] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const charCount = content.length;
  const isOverLimit = charCount > 280;

  const handleSubmit = async () => {
    if (!personaId) {
      addToast('Selecione uma persona.', 'error');
      return;
    }
    if (!content.trim()) {
      addToast('O conteúdo não pode estar vazio.', 'error');
      return;
    }
    if (isOverLimit) {
      addToast('O conteúdo excede 280 caracteres.', 'error');
      return;
    }

    const hashtags = hashtagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)
      .map((t) => `#${t}`);

    setLoading(true);
    try {
      const { error } = await createPost({
        persona_id: personaId,
        content: content.trim(),
        source: 'manual',
        hashtags,
      });
      if (error) throw error;
      addToast('Post criado com sucesso!', 'success');
      setContent('');
      setHashtagsInput('');
      onCreated?.();
      onClose();
    } catch {
      addToast('Erro ao criar post.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all';

  return (
    <Modal open={open} title="Novo Post" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Persona
          </label>
          <select
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione uma persona</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name} ({p.handle})
              </option>
            ))}
          </select>
        </div>

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
            placeholder="Escreva o conteúdo do post..."
            rows={4}
            className={inputClass + ' resize-none'}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Hashtags
          </label>
          <input
            type="text"
            value={hashtagsInput}
            onChange={(e) => setHashtagsInput(e.target.value)}
            placeholder="#tech, #ia, #startup (separadas por vírgula)"
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Criar Post
          </Button>
        </div>
      </div>
    </Modal>
  );
}
