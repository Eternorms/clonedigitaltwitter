'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ButtonProps } from '@/types/components';

const variantStyles: Record<string, string> = {
  primary:
    'bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-bold shadow-xl shadow-slate-200 hover:-translate-y-0.5 transition-transform focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
  secondary:
    'bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
  destructive: 'text-red-500 font-bold text-xs hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 rounded-lg',
  ghost:
    'text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-3 py-2 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: '',
  lg: 'px-6 py-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled,
  loading,
  className,
  type = 'button',
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        variantStyles[variant],
        size !== 'md' && sizeStyles[size],
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
