"use client";

import { Cpu, Calendar, CheckCircle2 } from "lucide-react";

interface ScheduledPost {
  id: string;
  source: string;
  scheduledTime: string;
  avatar: string;
  content: string;
}

interface ScheduledPostCardProps {
  post: ScheduledPost;
}

function formatHashtags(content: string): React.ReactNode {
  const parts = content.split(/(#\w+)/g);

  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      return (
        <span key={index} className="text-sky-500">
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function ScheduledPostCard({ post }: ScheduledPostCardProps) {
  return (
    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex gap-6 opacity-80 hover:opacity-100 transition-all">
      {/* Left Section */}
      <div className="flex-1">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-4">
          {/* Source Tag */}
          <div className="px-3 py-1 rounded-lg bg-white border border-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>{post.source}</span>
          </div>

          {/* Schedule Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            <Calendar className="w-3.5 h-3.5" />
            <span>{post.scheduledTime}</span>
          </div>
        </div>

        {/* Avatar and Content Row */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {post.avatar}
          </div>

          {/* Content */}
          <p className="text-base leading-relaxed text-slate-600 font-medium">
            {formatHashtags(post.content)}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-64 flex items-center justify-center border-l border-slate-200 pl-8">
        <div className="text-emerald-600 font-bold text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>Agendado</span>
        </div>
      </div>
    </div>
  );
}
