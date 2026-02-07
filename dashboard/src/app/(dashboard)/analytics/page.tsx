import { Suspense } from 'react';
import { TrendingUp, Eye, Heart, Repeat2, BarChart2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { PostsChart } from '@/components/dashboard/PostsChart';
import { TopPostsTable } from '@/components/dashboard/TopPostsTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnalyticsSkeleton } from '@/components/ui/Skeleton';
import { getDailyMetrics, getTopPosts } from '@/lib/supabase/queries';

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

async function AnalyticsContent() {
  const [metrics, topPosts] = await Promise.all([getDailyMetrics(), getTopPosts()]);

  const hasData = metrics.length > 0 || topPosts.length > 0;
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

      {!hasData ? (
        <EmptyState
          icon={<BarChart2 className="w-8 h-8" />}
          title="Sem dados de performance"
          description="Os dados de analytics aparecerão aqui assim que seus posts começarem a receber impressões e engajamentos."
        />
      ) : (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <PerformanceChart metrics={metrics} />
        <PostsChart metrics={metrics} />
      </div>

      <TopPostsTable posts={topPosts} />
      </>
      )}
    </>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}
