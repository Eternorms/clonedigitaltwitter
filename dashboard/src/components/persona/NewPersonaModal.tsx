'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createPersona, updatePersona } from '@/lib/supabase/mutations';
import { usePersona } from '@/lib/contexts/PersonaContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import type { PersonaDetail } from '@/types';

const toneOptions = [
  'Informativo',
  'Humorístico',
  'Técnico',
  'Casual',
  'Formal',
  'Inspirador',
];

interface NewPersonaModalProps {
  open: boolean;
  onClose: () => void;
  editingPersona?: PersonaDetail | null;
}

export function NewPersonaModal({ open, onClose, editingPersona }: NewPersonaModalProps) {
  const isEditing = !!editingPersona;
  const [name, setName] = useState(editingPersona?.name ?? '');
  const [handle, setHandle] = useState(editingPersona?.handle ?? '');
  const [emoji, setEmoji] = useState(editingPersona?.emoji ?? '');
  const [description, setDescription] = useState(editingPersona?.description ?? '');
  const [tone, setTone] = useState(editingPersona?.tone ?? 'Informativo');
  const [topicsInput, setTopicsInput] = useState(editingPersona?.topics?.join(', ') ?? '');
  const [loading, setLoading] = useState(false);
  const { addPersona } = usePersona();
  const { addToast } = useToast();
  const router = useRouter();

  const resetForm = () => {
    setName('');
    setHandle('');
    setEmoji('');
    setDescription('');
    setTone('Informativo');
    setTopicsInput('');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !handle.trim()) {
      addToast('Nome e handle são obrigatórios.', 'error');
      return;
    }

    const topics = topicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      if (isEditing) {
        const { error } = await updatePersona(editingPersona.id, {
          name: name.trim(),
          handle: handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`,
          emoji: emoji || undefined,
          description: description.trim() || undefined,
          tone: tone,
          topics,
        });
        if (error) throw error;
        addToast('Persona atualizada com sucesso!', 'success');
      } else {
        const { data, error } = await createPersona({
          name: name.trim(),
          handle: handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`,
          emoji: emoji || undefined,
          description: description.trim() || undefined,
          tone: tone,
          topics,
        });
        if (error) throw error;
        if (data) {
          addPersona({
            id: data.id,
            name: data.name,
            handle: data.handle,
            emoji: data.emoji ?? '',
          });
        }
        addToast('Persona criada com sucesso!', 'success');
        resetForm();
      }
      router.refresh();
      onClose();
    } catch {
      addToast(isEditing ? 'Erro ao atualizar persona.' : 'Erro ao criar persona.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all';

  return (
    <Modal open={open} title={isEditing ? 'Editar Persona' : 'Nova Persona'} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_80px] gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tech Insider"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Emoji
            </label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🤖"
              maxLength={4}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Handle
          </label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@techinsider"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a personalidade e foco desta persona..."
            rows={3}
            className={inputClass + ' resize-none'}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Tom
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className={inputClass}
          >
            {toneOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Tópicos
          </label>
          <input
            type="text"
            value={topicsInput}
            onChange={(e) => setTopicsInput(e.target.value)}
            placeholder="IA, tecnologia, startups (separados por vírgula)"
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Salvar' : 'Criar Persona'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
