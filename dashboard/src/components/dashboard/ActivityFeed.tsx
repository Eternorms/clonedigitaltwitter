'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Send,
  XCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import { useRealtimeActivities } from '@/lib/supabase/realtime';
import { createClient } from '@/lib/supabase/client';
import type { Activity, ActivityType } from '@/types';

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

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities: initialActivities }: ActivityFeedProps) {
  const [activities, setActivities] = useState(initialActivities);
  const router = useRouter();

  const refetchActivities = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('activities')
      .select('id, type, description, created_at')
      .order('created_at', { ascending: false })
      .limit(6);
    if (data) setActivities(data as Activity[]);
    router.refresh();
  }, [router]);

  useRealtimeActivities(refetchActivities);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Atividade Recente</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {activities.length > 0 ? activities.map((activity) => {
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
                {formatRelativeTime(activity.created_at)}
              </span>
            </div>
          );
        }) : (
          <div className="px-6 py-8 text-center text-sm text-slate-400">Nenhuma atividade recente</div>
        )}
      </div>
    </div>
  );
}
