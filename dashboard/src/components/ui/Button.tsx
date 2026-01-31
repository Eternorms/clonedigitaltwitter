'use client';

import { cn } from '@/lib/utils';
import type { ButtonProps } from '@/types/components';

const variantStyles: Record<string, string> = {
  primary:
    'bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-bold shadow-xl shadow-slate-200 hover:-translate-y-0.5 transition-transform',
  secondary:
    'bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all',
  destructive: 'text-red-500 font-bold text-xs hover:text-red-700 transition-colors',
  ghost:
    'text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-3 py-2 text-sm font-bold transition-colors',
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
  className,
  type = 'button',
  icon,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        variantStyles[variant],
        size !== 'md' && sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}
