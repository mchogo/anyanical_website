// ツールページ(#/tools/*)の正本定義。以前は同じID一覧が App.tsx の
// toolPageIds と ToolPage.tsx の toolPages に別々に手で維持されていて
// (ここ以外にも FloatingNav 用のナビ短縮ラベルは src/config/navigation.ts に、
// SEO用の meta description は src/config/pageMeta.ts に、それぞれ目的が
// 異なる別データとして残している)、追加漏れやタイトルのズレが起きやすかった。
// ここではページの存在・表示タイトル・説明・href だけを一箇所にまとめ、
// App.tsx はここからIDリストを導出する。
export type ToolPageId =
  | 'currency-strength'
  | 'economic-calendar'
  | 'gap-watch'
  | 'ea-checklist'
  | 'strategy'
  | 'copytrade'
  | 'community'
  | 'participation'
  | 'semi-auto-sign'
  | 'trade-journal'
  | 'trader-quiz'
  | 'member-dashboard'
  | 'daily-mission'
  | 'gap-prediction'
  | 'highlow-sprint'
  | 'candle-swipe'
  | 'profit-tower'
  | 'game-ranking'
  | 'trade-tarot'
  | 'anya-method-slides'
  | 'htf-context';

export type ToolPageMeta = {
  id: ToolPageId;
  title: string;
  description: string;
  href: string;
};

export const TOOL_PAGES: ToolPageMeta[] = [
  {
    id: 'currency-strength',
    title: '通貨強弱',
    description: '主要通貨の強弱とクロスレート',
    href: '#/tools/currency-strength',
  },
  {
    id: 'economic-calendar',
    title: '経済指標',
    description: '日本語・東京時間の指標カレンダー',
    href: '#/tools/economic-calendar',
  },
  {
    id: 'gap-watch',
    title: '窓開け監視',
    description: '週末価格と金曜基準の差',
    href: '#/tools/gap-watch',
  },
  {
    id: 'ea-checklist',
    title: 'EAチェック',
    description: '半裁量EA・全自動EAの稼働前確認',
    href: '#/tools/ea-checklist',
  },
  {
    id: 'strategy',
    title: '戦略',
    description: 'プレミアム、Discord、半裁量EAの活用案内',
    href: '#/tools/strategy',
  },
  {
    id: 'copytrade',
    title: 'HFMコピトレ',
    description: 'Anya Gold Cent / Anya Gold / Anya Wemof Gold のストラテジー情報',
    href: '#/tools/copytrade',
  },
  {
    id: 'community',
    title: 'コミュニティ',
    description: 'ツール、メモ、各種案内のまとめ',
    href: '#/tools/community',
  },
  {
    id: 'participation',
    title: 'プレミアム',
    description: 'noteメンバーシップ、加入手続き、Discord権限付与',
    href: '#/tools/participation',
  },
  {
    id: 'semi-auto-sign',
    title: '半裁量サイン',
    description:
      'XAUUSD専用のDiscord通知サイン。サイン種別・通知チャンネル・利用開始手順を確認します。',
    href: '#/tools/semi-auto-sign',
  },
  {
    id: 'trade-journal',
    title: '損益カレンダー',
    description:
      'Discordログインで1口座まで使える日次損益カレンダー。複数口座管理はプレミアムで解放されます。',
    href: '#/tools/trade-journal',
  },
  {
    id: 'trader-quiz',
    title: 'トレーダータイプ16診断',
    description:
      '12問に答えて4つの軸であなたのトレードスタイルを分析。16タイプから診断結果を表示します。',
    href: '#/tools/trader-quiz',
  },
  {
    id: 'member-dashboard',
    title: 'メンバーダッシュボード',
    description:
      'Discordログイン状態、今日の相場ミッション、週末ギャップ予想、プレミアム導線をまとめて確認します。',
    href: '#/tools/member-dashboard',
  },
  {
    id: 'daily-mission',
    title: '今日の相場ミッション',
    description:
      '相場ボード、通貨強弱、経済指標、窓開け監視、振り返りを毎日の確認ルーティンとして管理します。',
    href: '#/tools/daily-mission',
  },
  {
    id: 'gap-prediction',
    title: '週末ギャップ予想',
    description:
      'GOLD、USDJPY、BTCなどの週末方向感を予想して、週明けに答え合わせするゲームです。',
    href: '#/tools/gap-prediction',
  },
  {
    id: 'highlow-sprint',
    title: '60セカンズ・ハイロー',
    description:
      'BTC・GOLDのリアルタイム価格が60秒後に上がるか下がるかを予想するミニゲーム。連勝でスコア倍率が上がります。',
    href: '#/tools/highlow-sprint',
  },
  {
    id: 'candle-swipe',
    title: 'ローソク足スワイプ道場',
    description:
      '実際の過去チャートの続きを右（上がる）/ 左（下がる）スワイプで即断するトレーニングゲームです。',
    href: '#/tools/candle-swipe',
  },
  {
    id: 'profit-tower',
    title: '利確タワー',
    description:
      '陽線ブロックを積み上げて資金を複利で増やすミニゲーム。重なりがゼロになると崩壊、5段ごとに利確できます。',
    href: '#/tools/profit-tower',
  },
  {
    id: 'game-ranking',
    title: 'ゲームランキング',
    description:
      '参加中のミニゲームのランキングをまとめて確認し、各ゲームへ遊びに行けます。',
    href: '#/tools/game-ranking',
  },
  {
    id: 'trade-tarot',
    title: 'トレードタロット',
    description:
      '相場の迷いをカードに尋ねる、夜の占い館。トレーダー版大アルカナ22枚があなたに寄り添います。',
    href: '#/tools/trade-tarot',
  },
  {
    id: 'anya-method-slides',
    title: 'アニャニカル解説',
    description:
      '環境認識からエントリーパターン①〜③までを音声付きスライドで振り返る学習用まとめ。本編はプレミアム限定です。',
    href: '#/tools/anya-method-slides',
  },
  {
    id: 'htf-context',
    title: 'Anyanical Market Dashboard',
    description:
      'Anyanical ToolkitのAI環境認識（上目線/下目線/レンジ、上下ターゲット）をカテゴリ別・時間足別(MN1/W1/D1/H4)でまとめて確認します。本編はプレミアム限定です。',
    href: '#/tools/htf-context',
  },
];

export const TOOL_PAGE_IDS: ToolPageId[] = TOOL_PAGES.map((page) => page.id);
