import type {
  Post, QueueStats, Persona, User, NavItem, TabItem,
  RSSSource, DailyMetric, TopPost, Activity, APIConnection, PersonaDetail,
} from '@/types';

export const currentUser: User = {
  id: 'user-1',
  name: 'Jean Dev',
  initials: 'JD',
  plan: 'Pro Plan',
};

export const personas: Persona[] = [
  {
    id: 'persona-1',
    name: 'FutNews Br',
    handle: '@futnews_br',
    emoji: '\u26BD',
  },
  {
    id: 'persona-2',
    name: 'Tech Insider',
    handle: '@techinsider_ai',
    emoji: '\uD83E\uDD16',
  },
];

export const activePersona: Persona = personas[0];

export const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutGrid' },
  { id: 'queue', label: 'Fila de Posts', href: '/queue', icon: 'Layers', badge: 3 },
  { id: 'sources', label: 'Fontes (RSS)', href: '/sources', icon: 'Rss' },
  { id: 'analytics', label: 'Analytics', href: '/analytics', icon: 'BarChart2' },
];

export const queueStats: QueueStats = {
  pending: 12,
  approved: 24,
  rejected: 2,
  aiPerformance: 98,
};

export const queueTabs: TabItem[] = [
  { id: 'queue', label: 'Fila', count: 3 },
  { id: 'scheduled', label: 'Agendados' },
  { id: 'published', label: 'Publicados' },
];

export const posts: Post[] = [
  {
    id: 'post-1',
    content:
      '\uD83D\uDEA8 O MENINO DA VILA T\u00C1 VOLTANDO? Segundo fontes do GE, Neymar j\u00E1 disse SIM ao Santos! #SantosFC #Neymar',
    status: 'pending',
    source: 'rss',
    sourceName: 'GE - Futebol',
    author: {
      name: 'FutNews Br',
      handle: '@futnews_br',
      avatarEmoji: '\u26BD',
    },
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    hasImage: true,
  },
  {
    id: 'post-2',
    content:
      'A IA t\u00E1 ficando cada vez mais humana. \uD83E\uDD16 A OpenAI lan\u00E7ou hoje um modelo focado em Racioc\u00EDnio L\u00F3gico. #AI',
    status: 'scheduled',
    source: 'rss',
    sourceName: 'TechCrunch',
    author: {
      name: 'FutNews Br',
      handle: '@futnews_br',
      avatarInitials: 'FN',
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    scheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'post-3',
    content:
      '\uD83D\uDD25 BOMBA no mercado! Flamengo anuncia contrata\u00E7\u00E3o de refor\u00E7o surpresa para a temporada 2026. Torcida vai \u00E0 loucura! #CRF #Flamengo',
    status: 'pending',
    source: 'claude-ai',
    sourceName: 'Claude AI',
    author: {
      name: 'FutNews Br',
      handle: '@futnews_br',
      avatarEmoji: '\u26BD',
    },
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'post-4',
    content:
      'Resultados da rodada: Palmeiras 2x1, Corinthians 0x0, S\u00E3o Paulo 3x1. Confira os melhores momentos! #Brasileir\u00E3o',
    status: 'published',
    source: 'manual',
    sourceName: 'Manual',
    author: {
      name: 'FutNews Br',
      handle: '@futnews_br',
      avatarEmoji: '\u26BD',
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
  },
];

// ========== RSS Sources ==========

export const rssSources: RSSSource[] = [
  {
    id: 'source-1',
    name: 'GE - Futebol',
    url: 'https://ge.globo.com/rss/futebol/',
    category: 'Esportes',
    status: 'active',
    lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    articleCount: 342,
    icon: '\u26BD',
  },
  {
    id: 'source-2',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'Tecnologia',
    status: 'active',
    lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    articleCount: 891,
    icon: '\uD83D\uDCBB',
  },
  {
    id: 'source-3',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'Tecnologia',
    status: 'active',
    lastSync: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    articleCount: 567,
    icon: '\uD83D\uDCF1',
  },
  {
    id: 'source-4',
    name: 'ESPN Brasil',
    url: 'https://www.espn.com.br/rss/',
    category: 'Esportes',
    status: 'paused',
    lastSync: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    articleCount: 213,
    icon: '\uD83C\uDFC6',
  },
  {
    id: 'source-5',
    name: 'Hacker News',
    url: 'https://news.ycombinator.com/rss',
    category: 'Tecnologia',
    status: 'error',
    lastSync: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    articleCount: 1204,
    icon: '\uD83D\uDDA5\uFE0F',
  },
  {
    id: 'source-6',
    name: 'UOL Esporte',
    url: 'https://www.uol.com.br/esporte/rss/',
    category: 'Esportes',
    status: 'active',
    lastSync: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    articleCount: 456,
    icon: '\uD83C\uDDEB\uD83C\uDDF7',
  },
];

// ========== Analytics ==========

export const dailyMetrics: DailyMetric[] = [
  { date: '24 Jan', posts: 8, impressions: 12400, engagements: 890 },
  { date: '25 Jan', posts: 12, impressions: 18900, engagements: 1230 },
  { date: '26 Jan', posts: 6, impressions: 9800, engagements: 670 },
  { date: '27 Jan', posts: 15, impressions: 24500, engagements: 1890 },
  { date: '28 Jan', posts: 10, impressions: 16700, engagements: 1120 },
  { date: '29 Jan', posts: 18, impressions: 31200, engagements: 2340 },
  { date: '30 Jan', posts: 14, impressions: 22800, engagements: 1670 },
];

export const topPosts: TopPost[] = [
  {
    id: 'top-1',
    content: '\uD83D\uDEA8 Neymar confirma retorno ao Santos! Contrato assinado at\u00E9 2027.',
    impressions: 45200,
    engagements: 3890,
    likes: 2100,
    retweets: 890,
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'top-2',
    content: '\uD83D\uDD25 Flamengo anuncia refor\u00E7o surpresa para a temporada 2026.',
    impressions: 32100,
    engagements: 2670,
    likes: 1560,
    retweets: 670,
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'top-3',
    content: 'Palmeiras vence e abre 5 pontos de vantagem na lideran\u00E7a do Brasileir\u00E3o.',
    impressions: 28900,
    engagements: 2100,
    likes: 1200,
    retweets: 540,
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'top-4',
    content: 'OpenAI anuncia modelo com capacidades multim\u00EDdia avan\u00E7adas. #AI #Tech',
    impressions: 21500,
    engagements: 1890,
    likes: 980,
    retweets: 450,
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ========== Dashboard Activity ==========

export const recentActivities: Activity[] = [
  {
    id: 'act-1',
    type: 'post_published',
    description: 'Post sobre Neymar publicado com sucesso',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-2',
    type: 'ai_generated',
    description: 'Claude gerou 3 novos posts sobre futebol',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-3',
    type: 'source_synced',
    description: 'GE - Futebol sincronizado (12 novos artigos)',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-4',
    type: 'post_approved',
    description: 'Post sobre Brasileir\u00E3o aprovado e agendado',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-5',
    type: 'post_rejected',
    description: 'Post sobre transfer\u00EAncias descartado (duplicado)',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-6',
    type: 'source_synced',
    description: 'TechCrunch sincronizado (8 novos artigos)',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

// ========== Settings - API Connections ==========

export const apiConnections: APIConnection[] = [
  {
    id: 'conn-twitter',
    name: 'Twitter / X',
    description: 'Publique posts automaticamente na sua conta.',
    connected: true,
    icon: 'Twitter',
  },
  {
    id: 'conn-claude',
    name: 'Claude AI',
    description: 'Gere conte\u00FAdo inteligente com IA.',
    connected: true,
    icon: 'Bot',
  },
  {
    id: 'conn-telegram',
    name: 'Telegram Bot',
    description: 'Receba notifica\u00E7\u00F5es em tempo real.',
    connected: false,
    icon: 'Send',
  },
];

// ========== Personas Detail ==========

export const personasDetail: PersonaDetail[] = [
  {
    id: 'persona-1',
    name: 'FutNews Br',
    handle: '@futnews_br',
    emoji: '\u26BD',
    description: 'Perfil de not\u00EDcias de futebol brasileiro. Cobre Brasileir\u00E3o, Libertadores e transfer\u00EAncias.',
    tone: 'Urgente e empolgante',
    topics: ['Futebol', 'Brasileir\u00E3o', 'Transfer\u00EAncias', 'Libertadores'],
    postsCount: 342,
    followersCount: 12500,
    engagementRate: 4.8,
    twitterConnected: true,
  },
  {
    id: 'persona-2',
    name: 'Tech Insider',
    handle: '@techinsider_ai',
    emoji: '\uD83E\uDD16',
    description: 'Perfil focado em tecnologia, IA e inova\u00E7\u00E3o. Cobre lan\u00E7amentos e tend\u00EAncias.',
    tone: 'Informativo e curioso',
    topics: ['IA', 'Tecnologia', 'Startups', 'Inova\u00E7\u00E3o'],
    postsCount: 189,
    followersCount: 8200,
    engagementRate: 3.5,
    twitterConnected: true,
  },
  {
    id: 'persona-3',
    name: 'Crypto Watch',
    handle: '@cryptowatch_br',
    emoji: '\uD83D\uDCB0',
    description: 'Acompanhamento do mercado crypto, an\u00E1lises e alertas de pre\u00E7o.',
    tone: 'Anal\u00EDtico e direto',
    topics: ['Bitcoin', 'Ethereum', 'DeFi', 'NFTs'],
    postsCount: 56,
    followersCount: 3100,
    engagementRate: 2.9,
    twitterConnected: false,
  },
];
