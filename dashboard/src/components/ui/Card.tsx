import { cn } from '@/lib/utils';
import type { CardProps } from '@/types/components';

const variantStyles: Record<string, string> = {
  primary:
    'bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-hover transition-all',
  secondary:
    'bg-slate-50 rounded-2xl p-6 border border-slate-200 opacity-80 hover:opacity-100 transition-all',
};

export function Card({ variant = 'primary', children, className }: CardProps) {
  return (
    <div className={cn(variantStyles[variant], className)}>{children}</div>
  );
}
