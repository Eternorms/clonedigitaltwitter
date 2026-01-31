"use client";

import { LucideIcon } from 'lucide-react';

type IconColor = 'amber' | 'emerald' | 'red' | 'sky';
type Variant = 'default' | 'performance';

interface StatsCardProps {
  icon: LucideIcon;
  iconColor: IconColor;
  label: string;
  value: string | number;
  badge?: string;
  variant?: Variant;
}

const colorStyles: Record<IconColor, { base: string; hover: string }> = {
  amber: {
    base: 'bg-amber-50 text-amber-500',
    hover: 'group-hover:bg-amber-400 group-hover:text-white',
  },
  emerald: {
    base: 'bg-emerald-50 text-emerald-500',
    hover: 'group-hover:bg-emerald-400 group-hover:text-white',
  },
  red: {
    base: 'bg-red-50 text-red-500',
    hover: 'group-hover:bg-red-400 group-hover:text-white',
  },
  sky: {
    base: 'bg-sky-50 text-sky-500',
    hover: 'group-hover:bg-sky-400 group-hover:text-white',
  },
};

export default function StatsCard({
  icon: Icon,
  iconColor,
  label,
  value,
  badge,
  variant = 'default',
}: StatsCardProps) {
  const { base, hover } = colorStyles[iconColor];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-hover transition-all group relative overflow-hidden">
      {/* Decorative circle for performance variant */}
      {variant === 'performance' && (
        <div className="absolute right-0 top-0 w-24 h-24 bg-sky-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
      )}

      {/* Top row */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        {/* Icon container */}
        <div
          className={`p-3 rounded-xl transition-colors ${base} ${hover}`}
        >
          <Icon className="w-6 h-6" />
        </div>

        {/* Optional badge */}
        {badge && (
          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-slate-500 text-sm font-bold mb-1">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
