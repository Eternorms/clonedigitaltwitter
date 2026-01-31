'use client';

import {
  CheckCircle2,
  Send,
  XCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import { recentActivities } from '@/lib/mock-data';
import type { ActivityType } from '@/types';

const activityConfig: Record<
  ActivityType,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  post_approved: { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-500' },
  post_published: { icon: Send, color: 'bg-sky-50 text-sky-500' },
  post_rejected: { icon: XCircle, color: 'bg-red-50 text-red-500' },
  source_synced: { icon: RefreshCw, color: 'bg-amber-50 text-amber-500' },
  ai_generated: { icon: Sparkles, color: 'bg-purple-50 text-purple-500' },
};

export function ActivityFeed() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Atividade Recente</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {recentActivities.map((activity) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;
          return (
            <div
              key={activity.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className={cn('p-2 rounded-xl', config.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {activity.description}
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                {formatRelativeTime(activity.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
