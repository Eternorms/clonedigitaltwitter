'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Rss, TrendingUp, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { generateWithAI } from '@/lib/supabase/mutations';
import { usePersona } from '@/lib/contexts/PersonaContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';
import { INPUT_CLASS } from '@/lib/styles';

interface RSSSource {
  id: string;
  name: string;
  icon: string | null;
}

interface GenerateAIModalProps {
  open: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

// Google Trends suggestions (cached for 5 minutes)
let cachedTrends: string[] = [];
let cacheTime = 0;

async function fetchGoogleTrends(): Promise<string[]> {
  const now = Date.now();
  if (cachedTrends.length > 0 && now - cacheTime < 5 * 60 * 1000) {
    return cachedTrends;
  }

  try {
    const response = await fetch('/api/trends');
    if (response.ok) {
      const data = await response.json();
      cachedTrends = data.trends || [];
      cacheTime = now;
      return cachedTrends;
    }
  } catch {
    // Fallback trends
  }
  return [];
}

export function GenerateAIModal({ open, onClose, onGenerated }: GenerateAIModalProps) {
  const { personas, activePersona } = usePersona();
  const [personaId, setPersonaId] = useState(activePersona?.id ?? '');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [rssSources, setRssSources] = useState<RSSSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [trends, setTrends] = useState<string[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const { addToast } = useToast();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPersonaId(activePersona?.id ?? '');
      setTopic('');
      setCount(3);
      setSelectedSourceId('');
    }
  }, [open, activePersona?.id]);

  // Fetch RSS sources when persona changes
  useEffect(() => {
    if (!personaId) {
      setRssSources([]);
      return;
    }

    const fetchSources = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('rss_sources')
          .select('id, name, icon')
          .eq('persona_id', personaId)
          .eq('status', 'active');

        setRssSources(data ?? []);
        setSelectedSourceId('');
      } catch {
        setRssSources([]);
      }
    };

    fetchSources();
  }, [personaId]);

  // Fetch Google Trends when modal opens
  useEffect(() => {
    if (open && trends.length === 0) {
      setLoadingTrends(true);
      fetchGoogleTrends()
        .then(setTrends)
        .finally(() => setLoadingTrends(false));
    }
  }, [open, trends.length]);

  const handleGenerate = async () => {
    if (!personaId) {
      addToast('Selecione uma persona.', 'error');
      return;
    }

    setLoading(true);
    try {
      await generateWithAI(personaId, topic || undefined, count, selectedSourceId || undefined);
      addToast(`${count} posts gerados com sucesso!`, 'success');
      setTopic('');
      onGenerated();
      onClose();
    } catch {
      addToast('Erro ao gerar posts com IA. Verifique a configuração.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTrendClick = (trend: string) => {
    setTopic(trend);
  };

  return (
    <Modal open={open} title="Gerar com IA" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
          <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0" />
          <p className="text-sm text-purple-700 font-medium">
            A IA vai gerar posts baseados no tom e tópicos da persona selecionada.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Persona
          </label>
          <select
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Selecione uma persona</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name} ({p.handle})
              </option>
            ))}
          </select>
        </div>

        {/* RSS Source Selection */}
        {rssSources.length > 0 && (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Rss className="w-3 h-3" />
              Fonte RSS (opcional)
            </label>
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Usar todas as fontes</option>
              {rssSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.icon} {source.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Selecione uma fonte específica para inspirar os posts.
            </p>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Tópico (opcional)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: inteligência artificial, startups, produtividade..."
            className={INPUT_CLASS}
          />
          <p className="text-xs text-slate-400 mt-1">
            Deixe vazio para usar os tópicos padrão da persona.
          </p>
        </div>

        {/* Google Trends Suggestions */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Tendências do momento
          </label>
          {loadingTrends ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando tendências...
            </div>
          ) : trends.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trends.slice(0, 8).map((trend, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTrendClick(trend)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                    topic === trend
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {trend}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Nenhuma tendência disponível no momento.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            Quantidade de posts
          </label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className={INPUT_CLASS}
          >
            <option value={1}>1 post</option>
            <option value={3}>3 posts</option>
            <option value={5}>5 posts</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            loading={loading}
            icon={<Sparkles className="w-4 h-4" />}
          >
            {loading ? 'Gerando...' : 'Gerar Posts'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
