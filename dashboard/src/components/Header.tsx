"use client";

import { Filter, Plus } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  onFilterClick?: () => void;
  onNewPostClick?: () => void;
}

export default function Header({
  title,
  subtitle,
  onFilterClick,
  onNewPostClick,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-12">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">{subtitle}</p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onFilterClick}
          className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>

        <button
          type="button"
          onClick={onNewPostClick}
          className="flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 text-sm font-bold shadow-xl shadow-slate-200 hover:-translate-y-0.5 transition-transform"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>
    </header>
  );
}
