import { Heart, Repeat2, Eye } from 'lucide-react';
import type { TopPost } from '@/types';

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface TopPostsTableProps {
  posts: TopPost[];
}

export function TopPostsTable({ posts }: TopPostsTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Top Posts</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {posts.map((post, index) => (
          <div key={post.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
            <span className="text-lg font-extrabold text-slate-300 w-6 text-center">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {post.content}
              </p>
            </div>
            <div className="flex items-center gap-5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {formatNumber(post.impressions)}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                {formatNumber(post.likes)}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Repeat2 className="w-3.5 h-3.5 text-emerald-400" />
                {formatNumber(post.retweets)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
