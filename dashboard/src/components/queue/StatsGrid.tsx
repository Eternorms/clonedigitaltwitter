import { Clock, Check, X, Zap } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { queueStats } from '@/lib/mock-data';

export function StatsGrid() {
  return (
    <div className="grid grid-cols-4 gap-6 mb-12">
      <StatCard
        label="Pendentes"
        value={queueStats.pending}
        tagLabel="Hoje"
        color="amber"
        icon={<Clock className="w-6 h-6" />}
      />
      <StatCard
        label="Aprovados"
        value={queueStats.approved}
        tagLabel="+4"
        color="emerald"
        icon={<Check className="w-6 h-6" />}
      />
      <StatCard
        label="Rejeitados"
        value={queueStats.rejected}
        color="red"
        icon={<X className="w-6 h-6" />}
      />
      <StatCard
        label="Performance IA"
        value={`${queueStats.aiPerformance}%`}
        color="sky"
        icon={<Zap className="w-6 h-6 fill-current" />}
        decorative
      />
    </div>
  );
}
