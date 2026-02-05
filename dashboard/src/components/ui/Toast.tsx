'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'info';

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle2; bg: string; border: string; text: string }> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
  },
  info: {
    icon: Info,
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-700',
  },
};

interface ToastProps {
  message: string;
  variant: ToastVariant;
  onDismiss: () => void;
}

export function Toast({ message, variant, onDismiss }: ToastProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-soft min-w-[320px] max-w-[420px]',
        config.bg,
        config.border
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', config.text)} />
      <p className={cn('text-sm font-medium flex-1', config.text)}>{message}</p>
      <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
