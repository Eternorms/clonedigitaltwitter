import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-slate-200/60',
        className
      )}
      aria-hidden="true"
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft">
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-16 h-6 rounded-lg" />
      </div>
      <Skeleton className="w-24 h-4 mb-2" />
      <Skeleton className="w-16 h-8" />
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-soft flex flex-col sm:flex-row gap-6 sm:gap-8">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-20 h-6 rounded-lg" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-3/4 h-4" />
          </div>
        </div>
      </div>
      <div className="w-full sm:w-64 flex flex-col justify-center gap-3 pt-4 sm:pt-0 sm:pl-8 border-t sm:border-t-0 sm:border-l border-slate-100">
        <Skeleton className="w-full h-12 rounded-xl" />
        <Skeleton className="w-full h-10 rounded-xl" />
        <Skeleton className="w-full h-8 rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <div className="mb-10">
        <Skeleton className="w-48 h-10 mb-2" />
        <Skeleton className="w-72 h-5" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        </div>
        <div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function QueueSkeleton() {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
        <div>
          <Skeleton className="w-56 h-10 mb-2" />
          <Skeleton className="w-72 h-5" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-32 h-12 rounded-xl" />
          <Skeleton className="w-32 h-12 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

export function AnalyticsSkeleton() {
  return (
    <>
      <div className="mb-10">
        <Skeleton className="w-40 h-10 mb-2" />
        <Skeleton className="w-72 h-5" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Skeleton className="w-full h-64 rounded-2xl" />
        <Skeleton className="w-full h-64 rounded-2xl" />
      </div>
      <Skeleton className="w-full h-48 rounded-2xl" />
    </>
  );
}

export function SourcesSkeleton() {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Skeleton className="w-40 h-10 mb-2" />
          <Skeleton className="w-56 h-5" />
        </div>
        <Skeleton className="w-32 h-12 rounded-xl" />
      </div>
      <Skeleton className="w-full h-12 rounded-xl mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-48 rounded-2xl" />
        ))}
      </div>
    </>
  );
}

export function PersonaSkeleton() {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Skeleton className="w-36 h-10 mb-2" />
          <Skeleton className="w-64 h-5" />
        </div>
        <Skeleton className="w-36 h-12 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-56 rounded-2xl" />
        ))}
      </div>
    </>
  );
}
