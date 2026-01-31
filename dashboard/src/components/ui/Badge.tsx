import { cn } from '@/lib/utils';
import type { BadgeProps } from '@/types/components';

const variantStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-emerald-100 text-emerald-700',
  published: 'bg-sky-100 text-sky-700',
  rejected: 'bg-red-100 text-red-700',
  default: 'bg-slate-100 text-slate-500',
};

export function Badge({
  variant = 'default',
  children,
  pulse = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
        variantStyles[variant],
        className
      )}
    >
      {pulse && (
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      )}
      {children}
    </span>
  );
}
