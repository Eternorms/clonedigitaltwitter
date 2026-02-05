'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { addRSSSource } from '@/lib/supabase/mutations';
import { usePersona } from '@/lib/contexts/PersonaContext';
import { useToast } from '@/lib/contexts/ToastContext';
import type { RSSSource } from '@/types';

const categoryOptions = [
  'Tecnologia',
  'Negócios',
  'Notícias',
  'Ciência',
  'Outro',
];

interface NewSourceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (source: RSSSource) => void;
}

export function NewSourceModal({ open, onClose, onCreated }: NewSourceModalProps) {
  const { personas, activePersona } = usePersona();
  const [personaId, setPersonaId] = useState(activePersona?.id ?? '');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Tecnologia');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async () => {
    if (!personaId) {
      addToast('Selecione uma persona.', 'error');
      return;
    }
    if (!name.trim() || !url.trim()) {
      addToast('Nome e URL são obrigatórios.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await addRSSSource({
        persona_id: personaId,
        name: name.trim(),
        url: url.trim(),
        category,
      });
      if (error) throw error;
      if (data) onCreated?.(data as RSSSource);
      addToast('Fonte RSS adicionada com sucesso!', 'success');
      setName('');
      setUrl('');
      setCategory('Tecnologia');
      onClose();
    } catch {
      addToast('Erro ao adicionar fonte RSS.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all';

  return (
    <Modal open={open} title="Nova Fonte RSS" onClose={onClose}>
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
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: TechCrunch"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            URL do Feed
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://techcrunch.com/feed/"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Categoria
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Adicionar Fonte
          </Button>
        </div>
      </div>
    </Modal>
  );
}
