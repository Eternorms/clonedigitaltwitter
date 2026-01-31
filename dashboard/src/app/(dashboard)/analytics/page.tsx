import { TrendingUp, Eye, Heart, Repeat2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { PostsChart } from '@/components/dashboard/PostsChart';
import { TopPostsTable } from '@/components/dashboard/TopPostsTable';

export default function AnalyticsPage() {
  return (
    <>
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Analytics
        </h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">
          Acompanhe a performance do seu conte\u00FAdo.
        </p>
      </header>

      {/* Overview stats */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Impress\u00F5es"
          value="136.3k"
          tagLabel="+12.4%"
          color="sky"
          icon={<Eye className="w-6 h-6" />}
        />
        <StatCard
          label="Engajamentos"
          value="9.8k"
          tagLabel="+8.2%"
          color="emerald"
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          label="Curtidas"
          value="5.8k"
          color="red"
          icon={<Heart className="w-6 h-6" />}
        />
        <StatCard
          label="Retweets"
          value="2.5k"
          color="amber"
          icon={<Repeat2 className="w-6 h-6" />}
          decorative
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <PerformanceChart />
        <PostsChart />
      </div>

      {/* Top Posts */}
      <TopPostsTable />
    </>
  );
}
