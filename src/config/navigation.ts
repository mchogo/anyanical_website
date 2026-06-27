export const INTERNAL_NAV_LINKS = [
  {
    label: '相場ボード',
    href: '#/board',
  },
  {
    label: '通貨強弱',
    href: '#/tools/currency-strength',
  },
  {
    label: '経済指標',
    href: '#/tools/economic-calendar',
  },
  {
    label: '窓開け監視',
    href: '#/tools/gap-watch',
  },
  {
    label: 'EAチェック',
    href: '#/tools/ea-checklist',
  },
  {
    label: '戦略',
    href: '#/tools/strategy',
  },
  {
    label: 'コピトレ',
    href: '#/tools/copytrade',
  },
  {
    label: 'コミュニティ',
    href: '#/tools/community',
  },
  {
    label: 'プレミアム',
    href: '#/tools/participation',
  },
  {
    label: '半裁量サイン',
    href: '#/tools/semi-auto-sign',
  },
  {
    label: 'トレード日誌',
    href: '#/tools/trade-journal',
  },
] as const;

export const NAV_LINK_GROUPS = [
  {
    label: '相場ツール',
    href: '#/market',
    description: '価格、強弱、指標、窓開け',
    links: [
      {
        label: '相場ボード',
        href: '#/board',
      },
      {
        label: '通貨強弱',
        href: '#/tools/currency-strength',
      },
      {
        label: '経済指標',
        href: '#/tools/economic-calendar',
      },
      {
        label: '窓開け監視',
        href: '#/tools/gap-watch',
      },
    ],
  },
  {
    label: 'EA・コピトレ',
    href: '#/ea-copytrade',
    description: 'EAチェック、戦略、コピトレ、サイン',
    links: [
      {
        label: 'EAチェック',
        href: '#/tools/ea-checklist',
      },
      {
        label: '戦略',
        href: '#/tools/strategy',
      },
      {
        label: 'コピトレ',
        href: '#/tools/copytrade',
      },
      {
        label: '半裁量サイン',
        href: '#/tools/semi-auto-sign',
      },
    ],
  },
  {
    label: 'プレミアム',
    href: '#/premium',
    description: 'コミュニティ、参加案内、日誌',
    links: [
      {
        label: 'コミュニティ',
        href: '#/tools/community',
      },
      {
        label: '参加案内',
        href: '#/tools/participation',
      },
      {
        label: 'トレード日誌',
        href: '#/tools/trade-journal',
      },
    ],
  },
] as const;

export const EXTERNAL_LINKS = [
  {
    label: 'リンク集',
    href: 'https://lit.link/anyafx',
    description: 'Discord、X、サブスク、各種案内',
  },
] as const;
