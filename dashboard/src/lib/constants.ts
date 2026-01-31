export const SOURCE_ICONS: Record<string, string> = {
  'claude-ai': 'cpu',
  rss: 'rss',
  manual: 'pencil',
  template: 'file-text',
};

export const STAT_CARD_STYLES: Record<
  string,
  { iconBg: string; iconText: string; hoverBg: string }
> = {
  amber: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-500',
    hoverBg: 'group-hover:bg-amber-400 group-hover:text-white',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-500',
    hoverBg: 'group-hover:bg-emerald-400 group-hover:text-white',
  },
  red: {
    iconBg: 'bg-red-50',
    iconText: 'text-red-500',
    hoverBg: 'group-hover:bg-red-400 group-hover:text-white',
  },
  sky: {
    iconBg: 'bg-sky-50',
    iconText: 'text-sky-500',
    hoverBg: 'group-hover:bg-sky-400 group-hover:text-white',
  },
};
