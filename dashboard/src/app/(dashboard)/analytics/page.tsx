import { TrendingUp, Eye, Heart, Repeat2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { PostsChart } from '@/components/dashboard/PostsChart';
import { TopPostsTable } from '@/components/dashboard/TopPostsTable';
import { getDailyMetrics, getTopPosts } from '@/lib/supabase/queries';

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default async function AnalyticsPage() {
  const [metrics, topPosts] = await Promise.all([getDailyMetrics(), getTopPosts()]);

  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
  const totalEngagements = metrics.reduce((sum, m) => sum + m.engagements, 0);
  const totalLikes = topPosts.reduce((sum, p) => sum + (p.likes ?? 0), 0);
  const totalRetweets = topPosts.reduce((sum, p) => sum + (p.retweets ?? 0), 0);

  return (
    <>
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Analytics
        </h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">
          Acompanhe a performance do seu conteúdo.
        </p>
      </header>

      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Impressões"
          value={formatNumber(totalImpressions)}
          color="sky"
          icon={<Eye className="w-6 h-6" />}
        />
        <StatCard
          label="Engajamentos"
          value={formatNumber(totalEngagements)}
          color="emerald"
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          label="Curtidas"
          value={formatNumber(totalLikes)}
          color="red"
          icon={<Heart className="w-6 h-6" />}
        />
        <StatCard
          label="Retweets"
          value={formatNumber(totalRetweets)}
          color="amber"
          icon={<Repeat2 className="w-6 h-6" />}
          decorative
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-10">
        <PerformanceChart metrics={metrics} />
        <PostsChart metrics={metrics} />
      </div>

      <TopPostsTable posts={topPosts} />
    </>
  );
}
