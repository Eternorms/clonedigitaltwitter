'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { PostCard } from '@/components/queue/PostCard';
import { usePersona } from '@/lib/contexts/PersonaContext';
import { useRealtimePosts } from '@/lib/supabase/realtime';
import { createClient } from '@/lib/supabase/client';
import type { Post, QueueTab, TabItem } from '@/types';

const queueTabs: TabItem[] = [
  { id: 'queue', label: 'Fila' },
  { id: 'scheduled', label: 'Agendados' },
  { id: 'published', label: 'Publicados' },
  { id: 'rejected', label: 'Rejeitados' },
];

const tabToStatusMap: Record<QueueTab, string[]> = {
  queue: ['pending'],
  scheduled: ['scheduled', 'approved'],
  published: ['published'],
  rejected: ['rejected'],
};

const sourceFilters = [
  { id: 'all', label: 'Todas' },
  { id: 'claude_ai', label: 'IA' },
  { id: 'rss', label: 'RSS' },
  { id: 'manual', label: 'Manual' },
];

const dateFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
];

interface PostListProps {
  initialPosts: Post[];
  onRefetchReady?: (refetch: () => Promise<void>) => void;
}

export function PostList({ initialPosts, onRefetchReady }: PostListProps) {
  const [activeTab, setActiveTab] = useState<string>('queue');
  const [posts, setPosts] = useState(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { activePersona } = usePersona();

  const refetchPosts = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from('posts')
      .select('*, personas(name, handle, emoji)')
      .order('created_at', { ascending: false });

    if (activePersona?.id) {
      query = query.eq('persona_id', activePersona.id);
    }

    const { data } = await query;
    if (data) {
      setPosts(data.map((p: Record<string, unknown>) => {
        const persona = p.personas as { name: string; handle: string; emoji: string | null } | null;
        return {
          id: p.id as string,
          persona_id: p.persona_id as string,
          content: p.content as string,
          status: p.status as string,
          source: p.source as string,
          source_name: p.source_name as string | null,
          author: {
            name: persona?.name ?? '',
            handle: persona?.handle ?? '',
            avatarEmoji: persona?.emoji ?? undefined,
          },
          created_at: p.created_at as string,
          scheduled_at: p.scheduled_at as string | null,
          published_at: p.published_at as string | null,
          image_url: p.image_url as string | null,
          hashtags: (p.hashtags as string[]) ?? [],
          impressions: p.impressions as number,
          engagements: p.engagements as number,
          likes: p.likes as number,
          retweets: p.retweets as number,
        };
      }) as Post[]);
    }
  }, [activePersona?.id]);

  useRealtimePosts(activePersona?.id, refetchPosts);

  // Expose refetch function to parent
  useEffect(() => {
    onRefetchReady?.(refetchPosts);
  }, [onRefetchReady, refetchPosts]);

  // Apply all filters
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Filter by tab (status)
    result = result.filter((post) =>
      tabToStatusMap[activeTab as QueueTab]?.includes(post.status)
    );

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((post) =>
        post.content.toLowerCase().includes(query) ||
        post.hashtags.some(h => h.toLowerCase().includes(query)) ||
        post.source_name?.toLowerCase().includes(query)
      );
    }

    // Filter by source
    if (sourceFilter !== 'all') {
      result = result.filter((post) => post.source === sourceFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let cutoffDate: Date;
      switch (dateFilter) {
        case 'today':
          cutoffDate = startOfDay;
          break;
        case 'week':
          cutoffDate = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }

      result = result.filter((post) => new Date(post.created_at) >= cutoffDate);
    }

    return result;
  }, [posts, activeTab, searchQuery, sourceFilter, dateFilter]);

  const hasActiveFilters = searchQuery || sourceFilter !== 'all' || dateFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setDateFilter('all');
  };

  return (
    <div className="space-y-4">
      <Tabs tabs={queueTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar posts por conteúdo, hashtag ou fonte..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-sky-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase">Fonte:</span>
            <div className="flex gap-1">
              {sourceFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSourceFilter(filter.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                    sourceFilter === filter.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase">Período:</span>
            <div className="flex gap-1">
              {dateFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setDateFilter(filter.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                    dateFilter === filter.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Results Count */}
      {hasActiveFilters && (
        <p className="text-xs text-slate-500">
          {filteredPosts.length} {filteredPosts.length === 1 ? 'post encontrado' : 'posts encontrados'}
        </p>
      )}

      {/* Post List */}
      <div className="space-y-6">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onStatusChange={(id, status) => {
              setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
            }} />
          ))
        ) : (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm font-medium">
              {hasActiveFilters
                ? 'Nenhum post encontrado com esses filtros'
                : 'Nenhum post nesta categoria'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-sm text-sky-500 hover:text-sky-600 font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
