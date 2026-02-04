import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { getQueueStats, getActivities } from '@/lib/supabase/queries';

export default async function DashboardPage() {
  const [stats, activities] = await Promise.all([getQueueStats(), getActivities()]);

  return (
    <>
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">
          Visão geral da sua operação de conteúdo.
        </p>
      </header>

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ActivityFeed activities={activities} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </>
  );
}
