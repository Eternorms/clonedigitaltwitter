import { Clock, Check, X, Zap } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import type { QueueStats } from '@/types';

interface StatsGridProps {
  stats: QueueStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <StatCard
        label="Pendentes"
        value={stats.pending}
        tagLabel="Hoje"
        color="amber"
        icon={<Clock className="w-6 h-6" />}
      />
      <StatCard
        label="Aprovados"
        value={stats.approved}
        tagLabel="+4"
        color="emerald"
        icon={<Check className="w-6 h-6" />}
      />
      <StatCard
        label="Rejeitados"
        value={stats.rejected}
        color="red"
        icon={<X className="w-6 h-6" />}
      />
      <StatCard
        label="Performance IA"
        value={`${stats.aiPerformance}%`}
        color="sky"
        icon={<Zap className="w-6 h-6 fill-current" />}
        decorative
      />
    </div>
  );
}
