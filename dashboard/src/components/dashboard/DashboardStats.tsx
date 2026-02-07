import { FileText, TrendingUp, Users, Clock } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import type { QueueStats } from '@/types';

interface DashboardStatsProps {
  stats: QueueStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <StatCard
        label="Total de Posts"
        value={stats.pending + stats.approved + stats.rejected}
        tagLabel="Este mês"
        color="sky"
        icon={<FileText className="w-6 h-6" />}
      />
      <StatCard
        label="Taxa de Engajamento"
        value={`${stats.aiPerformance > 0 ? stats.aiPerformance : 0}%`}
        color="emerald"
        icon={<TrendingUp className="w-6 h-6" />}
      />
      <StatCard
        label="Aprovados"
        value={stats.approved}
        color="amber"
        icon={<Users className="w-6 h-6" />}
      />
      <StatCard
        label="Na Fila"
        value={stats.pending}
        tagLabel="Hoje"
        color="red"
        icon={<Clock className="w-6 h-6" />}
        decorative
      />
    </div>
  );
}
