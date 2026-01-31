"use client";

import { Check, Pencil, Rss, Image as ImageIcon } from 'lucide-react';

interface Post {
  id: string;
  source: string;
  sourceIcon?: string;
  timestamp: string;
  avatar: string;
  accountName: string;
  accountHandle: string;
  content: string;
  imageUrl?: string;
}

interface PostCardProps {
  post: Post;
  onApprove: (id: string) => void;
  onEdit: (id: string) => void;
  onDiscard: (id: string) => void;
}

function formatContentWithHashtags(content: string): React.ReactNode {
  const parts = content.split(/(#\w+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      return (
        <span key={index} className="text-sky-500 font-bold">
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function PostCard({
  post,
  onApprove,
  onEdit,
  onDiscard,
}: PostCardProps) {
  const { id, source, timestamp, avatar, accountName, accountHandle, content, imageUrl } = post;

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-soft flex gap-8 relative overflow-hidden group hover:border-slate-300 transition-all">
      {/* Status Badge - Top Right */}
      <div className="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Aprovacao Necessaria
      </div>

      {/* Left Content Section */}
      <div className="flex-1 min-w-0">
        {/* Source and Timestamp Row */}
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
            <Rss className="w-3 h-3" />
            {source}
          </span>
          <span className="text-slate-400 text-xs font-bold uppercase">
            {timestamp}
          </span>
        </div>

        {/* Avatar and Account Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm">
            {avatar}
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900">{accountName}</p>
            <p className="text-sm text-slate-400 font-medium">{accountHandle}</p>
          </div>
        </div>

        {/* Post Content */}
        <p className="text-lg leading-relaxed text-slate-700 font-medium">
          {formatContentWithHashtags(content)}
        </p>

        {/* Image Preview */}
        {imageUrl ? (
          <div className="mt-4 h-48 rounded-xl border border-slate-200 overflow-hidden">
            <img
              src={imageUrl}
              alt="Post preview"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="mt-4 h-48 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Right Action Section */}
      <div className="w-64 flex flex-col justify-center gap-3 pl-8 border-l border-slate-100">
        <button
          onClick={() => onApprove(id)}
          className="w-full py-4 bg-black text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-black-hover transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Aprovar e Publicar
        </button>

        <button
          onClick={() => onEdit(id)}
          className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </button>

        <button
          onClick={() => onDiscard(id)}
          className="w-full py-2 text-red-500 font-bold text-xs hover:text-red-700 transition-colors"
        >
          Descartar
        </button>
      </div>
    </div>
  );
}
