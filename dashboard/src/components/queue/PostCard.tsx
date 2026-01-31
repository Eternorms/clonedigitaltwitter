'use client';

import { Rss, Cpu, Image, Check, Pencil, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatScheduledTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
}

const sourceIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  rss: Rss,
  'claude-ai': Cpu,
};

export function PostCard({ post }: PostCardProps) {
  const isPending = post.status === 'pending';
  const isScheduled = post.status === 'scheduled';
  const SourceIcon = sourceIconMap[post.source] || Rss;

  if (isScheduled) {
    return (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex gap-6 opacity-80 hover:opacity-100 transition-all">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-white border border-slate-100 text-slate-600 text-xs font-bold flex items-center gap-2">
                <SourceIcon className="w-3 h-3" />
                {post.sourceName}
              </span>
            </div>
            {post.scheduledAt && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                <Calendar className="w-3 h-3" />
                {formatScheduledTime(post.scheduledAt)}
              </span>
            )}
          </div>
          <div className="flex gap-4">
            <Avatar
              initials={post.author.avatarInitials}
              emoji={post.author.avatarEmoji}
              size="sm"
            />
            <p className="text-base leading-relaxed text-slate-600 font-medium">
              {renderContent(post.content)}
            </p>
          </div>
        </div>
        <div className="w-64 flex items-center justify-center border-l border-slate-200 pl-8">
          <p className="text-emerald-600 font-bold text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Agendado
          </p>
        </div>
      </div>
    );
  }

  // Pending / Primary card
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-soft flex gap-8 relative overflow-hidden group hover:border-slate-300 transition-all">
      {/* Status badge */}
      {isPending && (
        <div className="absolute top-6 right-6">
          <Badge variant="pending" pulse>
            Aprovação Necessária
          </Badge>
        </div>
      )}

      <div className="flex-1">
        {/* Source tag + timestamp */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-2">
            <SourceIcon className="w-3 h-3" />
            {post.sourceName}
          </span>
          <span className="text-slate-400 text-xs font-bold uppercase">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>

        {/* Author + Content */}
        <div className="flex gap-4">
          <Avatar
            initials={post.author.avatarInitials}
            emoji={post.author.avatarEmoji}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-extrabold text-slate-900">
                {post.author.name}
              </span>
              <span className="text-sm text-slate-400 font-medium">
                {post.author.handle}
              </span>
            </div>
            <p className="text-lg leading-relaxed text-slate-700 font-medium">
              {renderContent(post.content)}
            </p>

            {/* Image preview */}
            {post.hasImage && (
              <div className="mt-4 h-48 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 gap-2 font-medium">
                <Image className="w-5 h-5" />
                Preview da Imagem
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {isPending && (
        <div className="w-64 flex flex-col justify-center gap-3 pl-8 border-l border-slate-100">
          <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            Aprovar Post
          </button>
          <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <Pencil className="w-4 h-4" />
            Editar Texto
          </button>
          <button className="w-full py-2 text-red-500 font-bold text-xs hover:text-red-700 transition-all">
            Descartar
          </button>
        </div>
      )}
    </div>
  );
}

function renderContent(content: string) {
  // Split content to highlight hashtags and mentions
  const parts = content.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <span key={i} className="text-sky-500 font-bold">
          {part}
        </span>
      );
    }
    return part;
  });
}
