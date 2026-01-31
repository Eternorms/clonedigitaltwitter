import { cn } from '@/lib/utils';
import { STAT_CARD_STYLES } from '@/lib/constants';
import type { StatCardProps } from '@/types/components';

export function StatCard({
  label,
  value,
  tagLabel,
  color,
  icon,
  decorative = false,
}: StatCardProps) {
  const styles = STAT_CARD_STYLES[color];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-hover transition-all group relative overflow-hidden">
      {decorative && (
        <div className={cn(
          'absolute right-0 top-0 w-24 h-24 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150',
          styles.iconBg
        )} />
      )}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div
          className={cn(
            'p-3 rounded-xl transition-colors',
            styles.iconBg,
            styles.iconText,
            styles.hoverBg
          )}
        >
          {icon}
        </div>
        {tagLabel && (
          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
            {tagLabel}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-sm font-bold mb-1 relative z-10">{label}</p>
      <p className="text-3xl font-extrabold text-slate-900 relative z-10">{value}</p>
    </div>
  );
}
