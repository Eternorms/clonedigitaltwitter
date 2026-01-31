import { FileText, TrendingUp, Users, Clock } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { queueStats } from '@/lib/mock-data';

export function DashboardStats() {
  return (
    <div className="grid grid-cols-4 gap-6 mb-10">
      <StatCard
        label="Total de Posts"
        value={38}
        tagLabel="Este m\u00EAs"
        color="sky"
        icon={<FileText className="w-6 h-6" />}
      />
      <StatCard
        label="Taxa de Engajamento"
        value="4.8%"
        tagLabel="+0.6%"
        color="emerald"
        icon={<TrendingUp className="w-6 h-6" />}
      />
      <StatCard
        label="Personas Ativas"
        value={2}
        color="amber"
        icon={<Users className="w-6 h-6" />}
      />
      <StatCard
        label="Na Fila"
        value={queueStats.pending}
        tagLabel="Hoje"
        color="red"
        icon={<Clock className="w-6 h-6" />}
        decorative
      />
    </div>
  );
}
