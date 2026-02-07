import { cn } from '@/lib/utils';

interface AvatarProps {
  initials?: string;
  emoji?: string;
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-xl',
  lg: 'w-14 h-14 text-2xl',
};

export function Avatar({
  initials,
  emoji,
  src,
  alt = '',
  size = 'md',
  className,
}: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('rounded-full object-cover', sizeStyles[size], className)}
      />
    );
  }

  if (emoji) {
    return (
      <div
        role="img"
        aria-label={alt || 'Avatar'}
        className={cn(
          'rounded-full bg-slate-900 text-white flex items-center justify-center font-bold border-4 border-white shadow-sm',
          sizeStyles[size],
          className
        )}
      >
        {emoji}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold',
        sizeStyles[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
