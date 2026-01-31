import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';

export default function DashboardPage() {
  return (
    <>
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">
          Vis\u00E3o geral da sua opera\u00E7\u00E3o de conte\u00FAdo.
        </p>
      </header>

      <DashboardStats />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ActivityFeed />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </>
  );
}
