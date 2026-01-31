export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatRelativeTime(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffHr < 24) return `${diffHr}h atrás`;
  return `${diffDays}d atrás`;
}

export function formatScheduledTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getSourceLabel(source: string): string {
  const map: Record<string, string> = {
    'claude-ai': 'Claude AI',
    rss: 'RSS Feed',
    manual: 'Manual',
    template: 'Template',
  };
  return map[source] || source;
}
