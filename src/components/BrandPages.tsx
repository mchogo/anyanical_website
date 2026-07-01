import { useEffect, useRef, useState } from 'react';

import recommendedSettingNote from '../assets/copytrade/recommended-setting-note.png';
import recommendedSettingScreen from '../assets/copytrade/recommended-setting-screen.png';
import cancelCountProof from '../assets/proof/cancel-count.png';
import memberCountProof from '../assets/proof/member-count.png';
import { EXTERNAL_LINKS } from '../config/navigation';
import { getJstYearMonth, usePnLShowcase, type ShowcaseAccount } from '../hooks/usePnLShowcase';
import { calcStats, generatePnLCard } from '../utils/pnlCard';

const CountUp = ({
  to,
  suffix = '',
  duration = 1400,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * to));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <span ref={spanRef}>
      {count}
      {suffix}
    </span>
  );
};

const EXNESS_SIGNUP_URL = 'https://x.gd/CxfuR';
const NOTE_MEMBERSHIP_URL = 'https://note.com/anyafx/membership';
const NOTE_DISCORD_GUIDE_URL = 'https://note.com/anyafx/n/n614fec6d40d8';
const DISCORD_INVITE_URL = 'https://discord.gg/G6xWszr9CZ';
const INDICATORS_NOTE_URL = 'https://note.com/anyafx/n/nc05844962145';
const MEMBERSHIP_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSc9odFoGLOGFGpCN_OsZewwzXhO61xdzBxY6bQk_NCsQHeq2Q/viewform?usp=dialog';
const SEMI_AUTO_EA_FORM_URL = 'https://forms.gle/1EiRMR257pgQ9GDJ7';
const EA_DISTRIBUTION_CHANNEL_URL =
  'https://discord.com/channels/1152131321297129534/1488800327514718270';
const SIGN_ROLE_CHANNEL_URL =
  'https://discord.com/channels/1152131321297129534/1318354632698761310';
const SIGN_SETUP_CHANNEL_URL =
  'https://discord.com/channels/1152131321297129534/1488799255593357322';
const SIGN_CHANNEL_AGGRESSIVE_URL =
  'https://discord.com/channels/1152131321297129534/1512036779224596490';
const SIGN_CHANNEL_STANDARD_URL =
  'https://discord.com/channels/1152131321297129534/1494547003709984889';
const SIGN_HFM_STRATEGY_CHANNEL_URL =
  'https://discord.com/channels/1152131321297129534/1505746885657362462';

type StatEntry =
  | { countTo: number; suffix?: string; label: string; body: string }
  | { text: string; label: string; body: string };

const premiumStats: StatEntry[] = [
  {
    countTo: 95,
    suffix: '%+',
    label: '継続率',
    body: '直近のメンバー継続率は9.5割超え。短期の煽りではなく、毎日見返せる実用メモを重視しています。',
  },
  {
    countTo: 150,
    suffix: '+名',
    label: '在籍メンバー',
    body: '上限制のクローズドコミュニティ。満員の月は募集なし。空きが出た月初のみ参加できます。',
  },
  {
    text: 'Daily',
    label: '日々の考察',
    body: 'ゴールド、ドル円、BTCなどの目線、注意ライン、崩れる条件をDiscordで継続的に共有します。',
  },
  {
    text: 'Tools',
    label: '限定案内',
    body: 'note加入者向けの補足記事、Discord権限付与、関連リンクをまとめ、必要な情報へ迷わず移動できるようにします。',
  },
];

const membershipProofImages = [
  {
    title: '参加メンバー数',
    label: '151人参加中',
    body: 'noteメンバーシップ管理画面のスクリーンショットです。参加人数の規模感を確認できます。',
    src: memberCountProof,
    alt: 'noteメンバーシップの参加メンバー数が151人と表示されている管理画面',
  },
  {
    title: '退会予定者数',
    label: '退会予定3人',
    body: '継続率の参考として、退会予定者数もあわせて掲載しています。',
    src: cancelCountProof,
    alt: 'noteメンバーシップの退会予定者数が3人と表示されている管理画面',
  },
];

const renderStatValue = (stat: StatEntry) =>
  'countTo' in stat ? <CountUp to={stat.countTo} suffix={stat.suffix} /> : stat.text;

const strategySteps = [
  'noteメンバーシップで限定記事や参加案内を確認',
  'Discord限定チャンネルで日々の目線やチャート解説を追う',
  'オリジナルインジやbot/EA関連の案内を必要に応じて確認',
  'コピートレードや半裁量EAは資金量とリスク条件を確認して検討',
];

const strategyOfferCards = [
  {
    title: 'noteメンバーシップ',
    badge: 'Subscribe',
    body: '週末相場の見方、XAUUSD・BTCUSD・USDJPYの注目ポイント、限定チャンネル案内を確認したい人向けの入口です。',
    href: '#/tools/participation',
    label: 'プレミアムを見る',
  },
  {
    title: 'HFMコピートレード',
    badge: 'Copy trade',
    body: 'Anya Gold Cent / Anya Gold のストラテジー情報を確認できます。資金量とロット比率を理解したうえで検討してください。',
    href: '#/tools/copytrade',
    label: 'コピトレを見る',
  },
  {
    title: '半裁量EA',
    badge: 'Semi-auto EA',
    body: '指定リンクで開設したExness口座を認証し、MT5へEAを設置して使う半裁量運用です。申請フォームと稼働前チェックを確認してください。',
    href: '#/tools/ea-checklist',
    label: 'EAチェックを見る',
  },
];

const semiAutoEaSetupSteps = [
  {
    title: 'Exness口座を指定リンクから開設',
    body: 'このEAは指定リンクから開設された口座のみで動作します。Bondや他EAで使用中の対象アカウントがあれば、そのまま利用可能です。',
    href: EXNESS_SIGNUP_URL,
    label: '口座開設リンク',
  },
  {
    title: '口座タイプとリスク設定を決める',
    body: '基本目安は2000ドルに対して0.01ロット。スタンダード口座を標準とし、セント口座は練習向けですが約定が重くなる場合があります。',
  },
  {
    title: '新EA専用フォームで口座認証を申請',
    body: '口座開設後、新EA専用フォームから申請してください。セント口座専用EAの申請フォームとは別です。',
    href: SEMI_AUTO_EA_FORM_URL,
    label: '認証申請フォーム',
  },
  {
    title: 'EAをダウンロードしてMT5へ設置',
    body: '申請後、EA配布チャンネルからファイルを取得してMT5へ設置します。認証は基本的に申請から48時間以内が目安です。',
    href: EA_DISTRIBUTION_CHANNEL_URL,
    label: 'EA配布チャンネル',
  },
];

const semiAutoEaRiskRows = [
  {
    account: 'スタンダード',
    balance: '2000ドル〜',
    lot: '0.01ロット',
    note: '標準的な運用設定',
  },
  {
    account: 'セント',
    balance: '2,000セント',
    lot: '0.01ロット',
    note: '最初の練習向け',
  },
  {
    account: 'セント',
    balance: '20,000セント',
    lot: '0.1ロット',
    note: 'スタンダード移行前の中間設定',
  },
];

const communityLinks = [
  {
    title: 'Discordサーバー',
    body: 'アニャニカル覗き部屋。公開チャンネルと限定チャンネルがあります。',
    href: DISCORD_INVITE_URL,
    label: 'Discordに参加',
  },
  {
    title: 'Discord案内note',
    body: 'サーバー概要、チャンネル構成、限定チャンネルの見方をまとめた案内記事です。',
    href: NOTE_DISCORD_GUIDE_URL,
    label: '案内noteを見る',
  },
  {
    title: 'オリジナルインジまとめ',
    body: 'Discordメンバー向けのインジやbot関連情報を確認できます。',
    href: INDICATORS_NOTE_URL,
    label: 'インジまとめ',
  },
];

const communityChannels = [
  {
    title: 'サーバー概要',
    body: '全員が見られる概要チャンネル。限定チャンネルの閲覧手順もここから確認します。',
  },
  {
    title: '裁量関係',
    body: 'ポジション共有、立ち回り予定、エントリーパターン、ローソク足の読み方を確認します。',
  },
  {
    title: 'チャート関係',
    body: 'ドル円・ゴールドを中心に、毎日のチャートやリアルタイム確認用リンクを共有します。',
  },
  {
    title: '天と地 / EA関係',
    body: 'EAやbotの運用、ポジション決済、損切りを含む共有を確認します。',
  },
  {
    title: 'アラート関係',
    body: 'ロール変更や通知設定と組み合わせて、自分が見たいアラートを調整します。',
  },
  {
    title: 'その他企画',
    body: 'Discordメンバー限定の企画や、未公開noteの先出しなどの案内を確認します。',
  },
];

const communityAccessSteps = [
  {
    title: 'Discordへ参加',
    body: 'まずサーバーに参加し、公開チャンネルで概要と閲覧手順を確認します。',
  },
  {
    title: 'noteプランへ加入',
    body: '限定チャンネルやインジ利用権付きプランに加入し、会員証やnote IDを送付します。',
  },
  {
    title: '権限付与を待つ',
    body: '確認後にロールが付与され、限定チャンネルを閲覧できるようになります。',
  },
  {
    title: '必要ならTradingView IDを申請',
    body: 'オリジナルインジ利用にはTradingView IDの連絡、または利用申請フォームが必要です。',
  },
];

const participationRoutes = [
  {
    title: 'noteメンバーシップ',
    body: '通常プランへの参加はこちらから。加入後にDiscord/XのID確認へ進んでください。',
    href: NOTE_MEMBERSHIP_URL,
    label: 'note加入ページ',
  },
  {
    title: '加入申請フォーム',
    body: 'DMを省略したい場合は、note加入後に専用フォームから申請してください。',
    href: MEMBERSHIP_FORM_URL,
    label: 'フォームで申請',
  },
  {
    title: 'リンク集',
    body: 'Discord、X、サブスク、各種案内はlit.linkに集約しています。',
    href: EXTERNAL_LINKS[0].href,
    label: 'lit.link/anyafx',
  },
];

const membershipSteps = [
  {
    title: 'noteメンバーシップへ参加',
    body: 'まず通常プランへ加入してください。募集状況を確認し、参加できる月のみ加入手続きへ進みます。',
  },
  {
    title: 'Discordへ参加',
    body: '公開チャンネルに入り、サーバー概要と限定チャンネルの案内を確認します。',
  },
  {
    title: '加入確認を送付',
    body: 'note会員証のスクリーンショット、note ID、Discord IDをDiscordまたはXのDMで送ってください。',
  },
  {
    title: 'フォーム申請も可能',
    body: 'DMのやり取りを簡略化したい場合は、note加入後に専用フォームから申請できます。',
  },
  {
    title: '限定ロール付与を待つ',
    body: '確認後、Discord側の限定チャンネル権限を付与します。基本的に1日以内の確認を目安にしています。',
  },
  {
    title: '記事・インジ・サインを確認',
    body: '週末の振り返り、ゴールド/ドル円の先出し考察、オリジナルインジ、半裁量サインの見方を確認します。',
  },
];

const premiumFaqItems = [
  {
    question: '先出し考察は売買指示ですか？',
    answer:
      '売買指示ではありません。ゴールド/ドル円の方向感、注目ライン、崩れる条件を先に整理するものです。最終的なエントリー判断、ロット、損切りは必ず自分のルールで確認してください。',
  },
  {
    question: '半裁量サインだけでエントリーしていいですか？',
    answer:
      '推奨していません。半裁量サインは天底候補や反転候補を拾うための通知です。通知をきっかけに、チャート、時間足、指標、リスク許容を確認してから判断してください。',
  },
  {
    question: 'オリジナルインジはどこで使えますか？',
    answer:
      'TradingViewでの利用を想定しています。利用にはTradingView IDの連絡や、案内に沿った申請が必要になる場合があります。表示されたサインやラインは判断補助として扱ってください。',
  },
  {
    question: 'note加入後、どれくらいでDiscord権限が付きますか？',
    answer:
      '通常は申請内容を確認後、1日以内を目安に権限付与します。note会員証、note ID、Discord IDが確認できない場合は付与が遅れることがあります。',
  },
  {
    question: '初心者でも内容を追えますか？',
    answer:
      '追えますが、完全な初心者向けの売買指示サービスではありません。最初は週末の振り返りと毎日の目線を読み、慣れてきたらインジや半裁量サインを判断補助として使う流れがおすすめです。',
  },
  {
    question: '退会したらDiscord権限はどうなりますか？',
    answer:
      'noteメンバーシップの退会後は、原則としてDiscordの限定チャンネル権限も対象外になります。再参加する場合は、再度加入確認と申請を行ってください。',
  },
];

const planStatus = [
  {
    title: '通常プラン',
    status: '月初のみ募集',
    body: '新規募集は毎月1日前後のみ実施しています。上限150名のため空きがない月は募集なしです。既存メンバーの料金は加入時点のまま適用されます。',
  },
  {
    title: '個別サポート付きプラン',
    status: '満員・非公開',
    body: '現在は非公開です。再募集予定はありません。参加希望の場合はDMで待ちリストへの追加を相談してください。',
  },
];

const premiumContentCards = [
  {
    title: '週末の振り返り記事',
    badge: 'Weekend',
    target: '週明けの見方を整理したい人',
    body: '週末に出た材料、金曜クローズからの変化、月曜に見るべきポイントを記事でまとめます。',
    items: ['週末材料', '金曜比の整理', '週明けの注目点'],
    href: NOTE_MEMBERSHIP_URL,
    label: 'noteで確認',
  },
  {
    title: 'ゴールド/ドル円の先出し考察',
    badge: 'Daily',
    target: 'エントリー前に目線を作りたい人',
    body: '毎日更新で、ゴールドとドル円の方向感、注目ライン、崩れる条件を先に出します。',
    items: ['毎日更新', 'XAUUSD', 'USDJPY'],
    href: NOTE_MEMBERSHIP_URL,
    label: '考察を見る',
  },
  {
    title: '相場の見方が変わるオリジナルインジ',
    badge: 'Indicator',
    target: 'チャート判断を補助したい人',
    body: '注目すべき価格帯や反応を見つけやすくするための、オリジナルインジ案内を確認できます。',
    items: ['TradingView', '注目価格帯', '判断補助'],
    href: INDICATORS_NOTE_URL,
    label: 'インジを見る',
  },
  {
    title: '天底を捉える半裁量サイン',
    badge: 'Signal',
    target: '反転候補を通知で拾いたい人',
    body: 'XAUUSDの天井・底になりやすい場面を、Discord通知で確認できる半裁量サインです。',
    items: ['XAUUSD', 'Discord通知', '半裁量判断'],
    href: '#/tools/semi-auto-sign',
    label: 'サインを見る',
  },
];

const copyTradeStrategies = [
  {
    title: 'Anya Gold Cent',
    subtitle: '公開中 / セント口座ストラテジー',
    body: '小さめの資金単位で始めたい人向け。ID: 153191918 / 0.01ロット / 2000セント',
    href: 'https://my.hfm.com/jp/copy-trading/provider-details?provider=153191918',
    label: '公開ページを見る',
  },
  {
    title: 'Anya Gold',
    subtitle: '公開中 / ドル口座ストラテジー',
    body: 'ドル建て口座で標準的に運用したい人向け。ID: 147038068 / 0.01ロット / 1000ドル',
    href: 'https://my.hfm.com/jp/copy-trading/provider-details?provider=147038068',
    label: '公開ページを見る',
  },
];

const copyTradeNoticeItems = [
  {
    title: '公開中のストラテジー',
    badge: 'Public',
    body: 'Anya Gold Cent と Anya Gold をHFM側で公開しています。上のストラテジーカードから各公開ページを確認してください。',
  },
  {
    title: '取引ロジック',
    badge: 'Logic',
    body: '半裁量EAによる運用です。完全自動放置ではなく、相場環境に応じた裁量判断を組み合わせたハイブリッドなEA運用を行います。',
  },
  {
    title: 'TradingView複合シグナル',
    badge: 'Signal',
    body: 'TradingView上の複数ストラテジーを複合的に組み合わせ、最適なエントリーシグナルを飛ばして発注しています。',
  },
  {
    title: '資金管理・出金ルール',
    badge: 'Risk',
    body: 'リスクヘッジおよび倍率ズレを防ぐため、1000ドルを超えた分は週末に定期的に資金を抜く予定です。複利運用を止めるものではありませんが、リスク管理は必ず行ってください。',
  },
];

const copyTradeRecommendedSettings = [
  {
    title: 'HFM設定画面',
    body: 'Volume Allocation 100%、レスキューレベル 0% を目安にします。',
    src: recommendedSettingScreen,
    alt: 'HFMのコピー取引設定画面でVolume Allocationが100%、レスキューレベルが0%になっている推奨設定例',
  },
  {
    title: '設定値のメモ',
    body: '最小取引量はチェック、最大取引量は任意です。損切りを入れたい場合はレスキューレベルを調整してください。',
    src: recommendedSettingNote,
    alt: 'HFMコピー取引の推奨設定値をまとめたメモ',
  },
];

const operationLinks = [
  {
    title: 'Exness口座開設',
    subtitle: '裁量 / 半裁量EA / 全自動EA',
    body: 'EA運用環境を準備したい場合の口座開設リンクです。',
    href: EXNESS_SIGNUP_URL,
    label: 'Exnessで口座開設',
  },
];

const faqItems = [
  {
    question: '具体的な手法を教えてください',
    answer:
      '「これだけやっていれば勝てる」という固定の手法はありません。日々の相場観やエントリーの根拠はすべてチャンネルの考察にまとめていますが、それらを総称して「アニャニカル」と呼んでいます。既存の優れた手法を自分なりに組み合わせ、言語化したものです。',
  },
  {
    question: '先出し（売買指示）はありますか？',
    answer:
      '一切ありません。「ここで買って、ここで売る」という売買指示を期待しているなら、当サーバーは不向きです。「どの価格帯に注目し、どちらの方向に優位性を感じているか」を毎日アウトプットしているだけです。自分の頭で考えず他人のシグナルに頼っているうちは勝てるようになりません。',
  },
  {
    question: 'メンバーになったのに限定チャンネルが見られません',
    answer:
      '権限付与の同期が必要なため、個別にご連絡ください。noteの会員証のスクリーンショットを添えて、管理者宛DMまたはDiscord内の個別メッセージでご連絡いただければ、確認後に順次アクセス権限を付与します。',
  },
  {
    question: 'なぜサブスク形式で運営しているのですか？',
    answer:
      '毎日の考察、週末の振り返り、インジや半裁量サインの案内を継続して見返せる場所にしたいからです。短期の煽りではなく、日々の目線作りに使う覗き部屋として運営しています。',
  },
  {
    question: 'デイスイングbotのチャンネルが見当たりません',
    answer:
      'あえてデフォルトで非表示に設定しています。通知頻度が高いため全員に強制表示させていません。「ロール変更」チャンネルから表示・非表示をご自身で切り替えられます。操作が分からない場合は質問スペースでご連絡ください。',
  },
];

export const StrategyGuidePage = () => (
  <section className="space-y-6">
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
      <p className="text-sm font-semibold text-cyan-200">Membership value</p>
      <h2 className="mt-2 text-2xl font-bold text-white">
        相場を見る習慣を、ひとりで終わらせないために
      </h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
        相場ボードやチャートは、見るだけでは使い切れません。プレミアム、Discord、半裁量EA、HFMコピトレを目的別に切り分け、
        日々の相場考察、補助ツール、運用前チェックまで見返せるようにしています。
      </p>
    </section>

    <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-200">おすすめ</p>
          <h3 className="mt-1 text-lg font-bold text-white">
            興味に合わせて選べる関連案内
          </h3>
        </div>
        <p className="text-sm text-slate-400">
          学ぶ、任せる、補助する。目的に合わせて見たい内容を選べます。
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {strategyOfferCards.map((offer) => (
          <article
            key={offer.title}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-5"
          >
            <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/20">
              {offer.badge}
            </span>
            <h4 className="mt-4 text-lg font-bold text-white">{offer.title}</h4>
            <p className="mt-3 text-sm leading-6 text-slate-400">{offer.body}</p>
            <a
              href={offer.href}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-200"
            >
              {offer.label}
            </a>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <h3 className="text-lg font-bold text-white">活用フロー</h3>
      <ol className="mt-4 grid gap-3 md:grid-cols-2">
        {strategySteps.map((step, index) => (
          <li
            key={step}
            className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-300 text-sm font-bold text-slate-950">
              {index + 1}
            </span>
            <span className="leading-6">{step}</span>
          </li>
        ))}
      </ol>
    </section>

    <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-amber-200">Semi-auto EA</p>
          <h3 className="mt-1 text-lg font-bold text-white">
            半裁量EA 導入・セットアップ
          </h3>
        </div>
        <p className="text-sm text-slate-400">
          指定リンク口座、認証申請、MT5設置までの流れ
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        {semiAutoEaSetupSteps.map((step, index) => (
          <article
            key={step.title}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-4"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-300 text-sm font-bold text-slate-950">
              {index + 1}
            </span>
            <h4 className="mt-4 text-base font-bold text-white">{step.title}</h4>
            <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
            {'href' in step ? (
              <a
                href={step.href}
                rel="nofollow noopener noreferrer"
                target="_blank"
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
              >
                {step.label}
              </a>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/40">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">口座タイプ</th>
              <th className="px-4 py-3">資金目安</th>
              <th className="px-4 py-3">ロット例</th>
              <th className="px-4 py-3">特徴</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {semiAutoEaRiskRows.map((row) => (
              <tr key={`${row.account}-${row.balance}`}>
                <td className="px-4 py-4 font-semibold text-white">{row.account}</td>
                <td className="px-4 py-4 text-slate-300">{row.balance}</td>
                <td className="px-4 py-4 text-amber-200">{row.lot}</td>
                <td className="px-4 py-4 text-slate-400">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
          基本は5分足稼働を想定し、1分足で高リターン、15分足で安定寄りなど調整できます。半裁量のため、トレード判断と検証が結果に直結します。
        </div>
        <div className="rounded-lg border border-red-300/20 bg-red-300/10 p-4 text-sm leading-6 text-red-100">
          既存Exness口座のパートナー紐付け変更はできません。未紐付けの場合は、別メールアドレスまたはGmailエイリアスで指定リンクから新規登録してください。
        </div>
      </div>
    </section>
  </section>
);

const PnLShowcaseCard = () => {
  const initial = getJstYearMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [activeIdx, setActiveIdx] = useState(0);
  const [navDir, setNavDir] = useState<'left' | 'right' | null>(null);
  const state = usePnLShowcase(year, month);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  // Keep showing the tab list (account names don't change month to month)
  // while a new month is loading, so the button row doesn't flash empty.
  const [lastAccounts, setLastAccounts] = useState<ShowcaseAccount[]>([]);

  useEffect(() => {
    if (state.phase === 'ready') setLastAccounts(state.data.accounts);
  }, [state]);

  const accounts = state.phase === 'ready' ? state.data.accounts : lastAccounts;
  const clampedIdx = Math.min(activeIdx, Math.max(accounts.length - 1, 0));
  // Tracks the currently-shown blob URL so we only revoke it once the next
  // image has taken its place — revoking eagerly made the <img> flash empty.
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.phase !== 'ready') return;
    const acc = state.data.accounts[clampedIdx];
    if (!acc) return;
    let cancelled = false;
    generatePnLCard({
      stats: calcStats(acc.records),
      records: acc.records,
      periodLabel: `${state.data.year}年${state.data.month + 1}月`,
      unit: acc.unit,
      accountName: acc.accountName,
      viewMode: 'month',
      year: state.data.year,
      month: state.data.month,
    }).then((blob) => {
      if (cancelled) return;
      const newUrl = URL.createObjectURL(blob);
      const oldUrl = currentUrlRef.current;
      currentUrlRef.current = newUrl;
      setImgUrl(newUrl);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [state, clampedIdx]);

  useEffect(() => {
    return () => {
      if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current);
    };
  }, []);

  if (state.phase === 'empty' || state.phase === 'error') return null;

  const nowYm = (() => {
    const now = getJstYearMonth();
    return now.year * 12 + now.month;
  })();
  const curYm = year * 12 + month;
  const canGoPrev = nowYm - curYm < 12;
  const canGoNext = curYm < nowYm;

  const prevMonth = () => {
    if (!canGoPrev) return;
    setNavDir('right');
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (!canGoNext) return;
    setNavDir('left');
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };
  const selectTab = (i: number) => {
    setNavDir(null);
    setActiveIdx(i);
  };

  return (
    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-200">Live Track Record</p>
          <h3 className="mt-1 text-lg font-bold text-white">損益実績</h3>
        </div>
        <p className="text-sm text-slate-500">
          <a
            href="#/tools/trade-journal"
            className="font-semibold text-cyan-300 underline decoration-dotted underline-offset-2 transition hover:text-cyan-200"
          >
            損益カレンダー
          </a>
          の実データを自動反映しています。
        </p>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.04] text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ←
          </button>
          <p className="min-w-[6.5rem] text-center text-sm font-bold text-white">
            {year}年{month + 1}月
          </p>
          <button
            onClick={nextMonth}
            disabled={!canGoNext}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.04] text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            →
          </button>
        </div>

        {accounts.length > 1 && (
          <div className="flex rounded-full bg-white/[0.04] p-0.5 ring-1 ring-white/10">
            {accounts.map((acc, i) => (
              <button
                key={acc.accountId}
                onClick={() => selectTab(i)}
                className={`rounded-full px-3 py-0.5 text-xs font-bold transition ${
                  i === clampedIdx
                    ? 'bg-cyan-300 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {acc.accountName}
              </button>
            ))}
          </div>
        )}
      </div>

      {!imgUrl && (
        <div className="mt-4 aspect-[1200/630] w-full animate-pulse rounded-lg bg-slate-950/40" />
      )}
      {imgUrl && (
        <div
          key={imgUrl}
          className={
            navDir === 'left'
              ? 'animate-slide-in-right'
              : navDir === 'right'
                ? 'animate-slide-in-left'
                : 'animate-fade-in'
          }
        >
          <img
            src={imgUrl}
            alt="損益カレンダー"
            className="mt-4 w-full rounded-lg border border-white/10"
          />
        </div>
      )}

      <p className="mt-3 text-xs leading-5 text-slate-500">
        ※ このデータは週次〜月次で更新しています。最新の損益は実際の口座でご確認ください。
      </p>
      <a
        href="#/tools/trade-journal"
        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-cyan-300 transition hover:text-cyan-200"
      >
        自分の損益カレンダーを記録する →
      </a>
    </section>
  );
};

export const CopyTradeGuidePage = () => (
  <section className="space-y-6">
    <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
      <p className="text-sm font-semibold text-emerald-200">HFM Copy trade</p>
      <h2 className="mt-2 text-2xl font-bold text-white">HFMコピートレード</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
        HFM側で公開している Anya Gold Cent / Anya Gold
        のストラテジー情報をまとめています。
        週利10〜20%をひとつの目安としていますが、相場状況により結果は変動します。資金量、ロット比率、損失リスクを理解したうえで検討してください。
      </p>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-200">Strategies</p>
          <h3 className="mt-1 text-lg font-bold text-white">口座タイプ別ストラテジー</h3>
        </div>
        <p className="text-sm text-slate-500">
          ロット比率は運用目安です。開始前にHFM側の条件を必ず確認してください。
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {copyTradeStrategies.map((strategy) => (
          <article
            key={strategy.href}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-5"
          >
            <p className="text-xs font-semibold uppercase text-slate-500">
              {strategy.subtitle}
            </p>
            <h4 className="mt-2 text-xl font-bold text-white">{strategy.title}</h4>
            <p className="mt-3 text-sm leading-6 text-slate-400">{strategy.body}</p>
            <a
              href={strategy.href}
              rel="nofollow noopener noreferrer"
              target="_blank"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-200"
            >
              {strategy.label}
            </a>
          </article>
        ))}
      </div>
    </section>

    <PnLShowcaseCard />

    <section className="rounded-lg border border-emerald-300/20 bg-slate-900/80 p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-200">Notice</p>
          <h3 className="mt-1 text-lg font-bold text-white">
            ストラテジー公開のお知らせ
          </h3>
        </div>
        <p className="text-sm text-slate-500">参加前に必ず確認してください。</p>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/40 p-4">
        <p className="text-sm leading-6 text-slate-300">
          HFMにてコピートレードのストラテジーを公開しました。半裁量EAを使ったストラテジーです。
          運用の詳細および重要な資金管理ルールをまとめています。
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {copyTradeNoticeItems.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-white/10 bg-white/[0.035] p-4"
          >
            <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/20">
              {item.badge}
            </span>
            <h4 className="mt-3 font-bold text-white">{item.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/40 p-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-200">Recommended settings</p>
            <h4 className="mt-1 font-bold text-white">推奨設定イメージ</h4>
          </div>
          <p className="text-sm text-slate-500">
            参加前にHFM側の設定値を必ず確認してください。
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          {copyTradeRecommendedSettings.map((setting) => (
            <article
              key={setting.title}
              className="overflow-hidden rounded-lg border border-white/10 bg-slate-950"
            >
              <a
                href={setting.src}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-h-72 overflow-hidden bg-white transition opacity-95 hover:opacity-100"
              >
                <img
                  src={setting.src}
                  alt={setting.alt}
                  className="h-auto w-full object-cover object-top"
                  loading="lazy"
                />
              </a>
              <div className="border-t border-white/10 bg-slate-950 p-4">
                <h5 className="font-bold text-white">{setting.title}</h5>
                <p className="mt-2 text-sm leading-6 text-slate-400">{setting.body}</p>
                <a
                  href={setting.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
                >
                  画像を大きく見る
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-red-300/20 bg-red-300/10 p-4">
        <h4 className="font-bold text-red-100">
          重要: ナンピンおよびコピー倍率に関する注意点
        </h4>
        <p className="mt-2 text-sm leading-6 text-red-100/90">
          本ストラテジーは、相場状況によってナンピン（ポジションの追加保有）を行うケースがあります。
          コピー倍率のバランスによっては、ナンピンポジションが正しくコピーされない危険性があります。
          その結果、親口座と比べて損失が発生したり、利益が目減りしたりする可能性があります。
          倍率設定は慎重に行ってください。
        </p>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        投資は自己責任です。参加する場合は余剰資金で行い、損失リスクを理解したうえで判断してください。
      </p>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <h3 className="text-lg font-bold text-white">確認してから始めること</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          {
            title: '資金量とロット比率',
            body: 'セント口座とドル口座で前提が違います。自分の資金量に合う設定か確認してください。',
          },
          {
            title: 'ドローダウン許容',
            body: 'コピートレードは損失が出る可能性があります。最大損失を想定してから始めてください。',
          },
          {
            title: '利益目安',
            body: '週利10〜20%が目安です。ただし相場状況により変動し、利益を保証するものではありません。',
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-white/10 bg-white/[0.035] p-4"
          >
            <h4 className="font-bold text-white">{item.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  </section>
);

export const CommunityGuidePage = () => (
  <section className="space-y-6">
    <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
      <p className="text-sm font-semibold text-emerald-200">Community</p>
      <h2 className="mt-2 text-2xl font-bold text-white">Discordコミュニティ案内</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
        アニャニカル覗き部屋では、日々の目線、チャート分析、エントリーパターン、インジ、bot、EA関連の情報を整理して確認できます。
        公開チャンネルと限定チャンネルがあるため、まず概要と閲覧手順を確認してください。
      </p>
    </section>

    <div className="grid gap-4 lg:grid-cols-3">
      {communityLinks.map((link) => (
        <article
          key={link.href}
          className="rounded-lg border border-white/10 bg-white/[0.035] p-5"
        >
          <h3 className="text-lg font-bold text-white">{link.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">{link.body}</p>
          <a
            href={link.href}
            rel="nofollow noopener noreferrer"
            target="_blank"
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-200"
          >
            {link.label}
          </a>
        </article>
      ))}
    </div>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <h3 className="text-lg font-bold text-white">チャンネルで見られる内容</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {communityChannels.map((channel) => (
          <article
            key={channel.title}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-4"
          >
            <h4 className="font-bold text-white">{channel.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">{channel.body}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
      <h3 className="text-lg font-bold text-white">限定チャンネルを見る流れ</h3>
      <ol className="mt-4 grid gap-3 md:grid-cols-2">
        {communityAccessSteps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-300 text-sm font-bold text-slate-950">
              {index + 1}
            </span>
            <span>
              <span className="block font-semibold text-white">{step.title}</span>
              <span className="mt-1 block leading-6 text-slate-400">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <a
        href="#/tools/participation"
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
      >
        プレミアムを確認
      </a>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <h3 className="text-lg font-bold text-white">よくある質問</h3>
      <div className="mt-4 space-y-3">
        {faqItems.map((item) => (
          <details
            key={item.question}
            className="rounded-lg border border-white/10 bg-white/[0.035]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-semibold text-white">
              <span>{item.question}</span>
              <span className="faq-icon grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-300/10 text-emerald-200 ring-1 ring-emerald-300/20">
                +
              </span>
            </summary>
            <div className="faq-body border-t border-white/10">
              <div className="faq-body-inner">
                <p className="px-4 py-4 text-sm leading-6 text-slate-400">
                  {item.answer}
                </p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  </section>
);

export const ParticipationGuidePage = () => (
  <section className="space-y-6">
    <section className="overflow-hidden rounded-lg border border-amber-300/20 bg-slate-900/90">
      <div className="bg-amber-300/10 p-5">
        <p className="text-sm font-semibold text-amber-200">Premium</p>
        <h2 className="mt-2 text-2xl font-bold text-white">プレミアム案内</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
          プレミアムはnoteメンバーシップです。週末の振り返り記事、ゴールド/ドル円の先出し考察、オリジナルインジ、半裁量サインをまとめています。
          加入後に確認申請を行うと、Discord側の限定チャンネル権限を付与します。
        </p>
      </div>
      <div className="grid gap-0 border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {premiumStats.map((stat) => (
          <article
            key={stat.label}
            className="border-b border-white/10 p-5 sm:border-r last:sm:border-r-0 sm:border-b-0"
          >
            <p className="text-3xl font-black text-amber-200">{renderStatValue(stat)}</p>
            <h3 className="mt-3 text-lg font-bold text-white">{stat.label}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{stat.body}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-amber-200">Membership proof</p>
          <h3 className="mt-1 text-lg font-bold text-white">参加状況の実績</h3>
        </div>
        <p className="text-sm text-slate-500">
          noteメンバーシップ管理画面の一部を掲載しています。
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {membershipProofImages.map((image) => (
          <article
            key={image.title}
            className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/40"
          >
            <div className="border-b border-white/10 p-4">
              <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-300/20">
                {image.label}
              </span>
              <h4 className="mt-3 text-lg font-bold text-white">{image.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">{image.body}</p>
            </div>
            <div className="bg-white p-2">
              <img
                src={image.src}
                alt={image.alt}
                className="h-auto w-full rounded-md object-cover"
                loading="lazy"
              />
            </div>
          </article>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        掲載画像は確認時点の画面です。人数や退会予定数は時期により変動します。
      </p>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-amber-200">Included contents</p>
          <h3 className="mt-1 text-lg font-bold text-white">
            プレミアムで確認できる内容
          </h3>
        </div>
        <p className="text-sm text-slate-500">
          相場を見る基準、週明けの準備、チャート判断の補助、通知サインをまとめています。
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        {premiumContentCards.map((card) => (
          <article
            key={card.title}
            className="flex min-h-full flex-col rounded-lg border border-white/10 bg-slate-950/40 p-5"
          >
            <span className="w-fit rounded-full bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-300/20">
              {card.badge}
            </span>
            <h4 className="mt-4 text-lg font-bold text-white">{card.title}</h4>
            <p className="mt-2 text-xs font-semibold text-slate-500">{card.target}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{card.body}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {card.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href={card.href}
              rel={
                card.href.startsWith('http') ? 'nofollow noopener noreferrer' : undefined
              }
              target={card.href.startsWith('http') ? '_blank' : undefined}
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
            >
              {card.label}
            </a>
          </article>
        ))}
      </div>
    </section>

    <div className="grid gap-4 lg:grid-cols-3">
      {participationRoutes.map((route) => (
        <article
          key={route.href}
          className="rounded-lg border border-white/10 bg-white/[0.035] p-5"
        >
          <h3 className="text-lg font-bold text-white">{route.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">{route.body}</p>
          <a
            href={route.href}
            rel="nofollow noopener noreferrer"
            target="_blank"
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
          >
            {route.label}
          </a>
        </article>
      ))}
    </div>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-amber-200">Plan status</p>
          <h3 className="mt-1 text-lg font-bold text-white">現在の募集状況</h3>
        </div>
        <p className="text-sm text-slate-500">個別プランは待ちリスト対応です。</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {planStatus.map((plan) => (
          <article
            key={plan.title}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-lg font-bold text-white">{plan.title}</h4>
              <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-300/20">
                {plan.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{plan.body}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-amber-200">After joining</p>
          <h3 className="mt-1 text-lg font-bold text-white">加入後の流れ</h3>
        </div>
        <p className="text-sm text-slate-500">
          note加入後、Discord側の権限付与まで申請が必要です。
        </p>
      </div>
      <ol className="mt-4 grid gap-3 md:grid-cols-2">
        {membershipSteps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-300 text-sm font-bold text-slate-950">
              {index + 1}
            </span>
            <span>
              <span className="block font-semibold text-white">{step.title}</span>
              <span className="mt-1 block leading-6 text-slate-400">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-lg border border-red-300/20 bg-red-300/10 p-4 text-sm leading-6 text-red-100">
        最重要:
        noteメンバーシップへの加入完了後に、DMまたはフォーム申請を行ってください。申請がない場合、Discord限定チャンネルの権限付与ができません。
      </div>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-amber-200">Premium FAQ</p>
          <h3 className="mt-1 text-lg font-bold text-white">プレミアムのよくある質問</h3>
        </div>
        <p className="text-sm text-slate-500">
          加入前に迷いやすい、考察・インジ・サイン・権限付与の扱いです。
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {premiumFaqItems.map((item) => (
          <details
            key={item.question}
            className="rounded-lg border border-white/10 bg-white/[0.035]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-semibold text-white">
              <span>{item.question}</span>
              <span className="faq-icon grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/20">
                +
              </span>
            </summary>
            <div className="faq-body border-t border-white/10">
              <div className="faq-body-inner">
                <p className="px-4 py-4 text-sm leading-6 text-slate-400">
                  {item.answer}
                </p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <h3 className="text-lg font-bold text-white">EA運用リンク</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        口座開設やEA関連は任意の運用メニューです。条件やリスクを確認してから利用してください。
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {operationLinks.map((link) => (
          <article
            key={link.href}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-5"
          >
            <p className="text-xs font-semibold uppercase text-slate-500">
              {link.subtitle}
            </p>
            <h4 className="mt-2 text-lg font-bold text-white">{link.title}</h4>
            <p className="mt-3 text-sm leading-6 text-slate-400">{link.body}</p>
            <a
              href={link.href}
              rel="nofollow noopener noreferrer"
              target="_blank"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
            >
              {link.label}
            </a>
          </article>
        ))}
      </div>
    </section>
  </section>
);

const signTypes = [
  {
    label: '※5mレベル',
    title: '5分足レベル',
    body: '通常ロジックのサインです。前バージョンの通知と同じ基準で、頻度が高めのエントリー候補を通知します。',
    tone: 'cyan' as const,
  },
  {
    label: '※15mレベル',
    title: '15分足レベル',
    body: '15分足ベースのレベルサインです。通常の半裁量判断に使いやすく、バランスの取れた頻度で届きます。',
    tone: 'cyan' as const,
  },
  {
    label: '※30mレベル',
    title: '30分足レベル',
    body: '30分足ベースのレベルサインです。より大きな時間軸の流れを意識したエントリー候補を通知します。',
    tone: 'cyan' as const,
  },
  {
    label: '※15m攻め',
    title: '15分足 攻め仕様',
    body: 'チャンスを拾いやすい攻め仕様のサインです。ノイズが増える場面もあるため、チャートの確認を優先してください。',
    tone: 'amber' as const,
  },
  {
    label: '※30m攻め',
    title: '30分足 攻め仕様',
    body: '30分足ベースの攻め仕様です。HFMストラテジーにも反映しており、積極的にチャンスを拾う設計になっています。',
    tone: 'amber' as const,
  },
];

const signStartSteps = [
  {
    title: '通知ロールを受け取る',
    body: 'Discordの指定チャンネルでロールを取得してください。ロール付与後、通知チャンネルにアクセスできます。',
    href: SIGN_ROLE_CHANNEL_URL,
    label: 'ロール付与チャンネル',
  },
  {
    title: '半裁量EAをダウンロード',
    body: 'EA配布チャンネルからファイルを取得し、MT5へ設置します。Exness指定リンク口座と認証申請が必要です。',
    href: EA_DISTRIBUTION_CHANNEL_URL,
    label: 'EA配布チャンネル',
  },
  {
    title: '利用手順を確認',
    body: 'EA設置後の稼働設定、ロット目安、停止条件を手順チャンネルで確認してください。',
    href: SIGN_SETUP_CHANNEL_URL,
    label: '利用手順チャンネル',
  },
];

const signChannels = [
  {
    title: '攻めサイン + 5mレベル',
    body: '攻め仕様（15m攻め・30m攻め）と5mレベルのサインを流しています。より積極的にチャンスを追いたい場合向けです。',
    href: SIGN_CHANNEL_AGGRESSIVE_URL,
    label: 'チャンネルを確認',
  },
  {
    title: '15m / 30m / 5mレベル',
    body: '通常の15mレベル・30mレベル・5mレベルのサインを流しています。攻め仕様は含まれません。',
    href: SIGN_CHANNEL_STANDARD_URL,
    label: 'チャンネルを確認',
  },
];

const signFilterItems = [
  {
    label: '環境認識',
    body: '1時間足の20SMAで方向を判断する。SMAの傾きと価格の位置を確認する。',
  },
  {
    label: '5分足RSI制限',
    body: 'RSIが60より上なら買わない、40より下なら売らない。突っ込みエントリーを避けるための簡易フィルター。',
  },
];

export const SemiAutoSignPage = () => (
  <section className="space-y-6">
    <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
      <p className="text-sm font-semibold text-amber-200">Semi-discretionary sign</p>
      <h2 className="mt-2 text-2xl font-bold text-white">半裁量サイン</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
        相場の方向感・時間足の流れ・反発候補になりやすい価格帯を組み合わせて、エントリー候補をDiscord通知します。
        通知が届いたタイミングでチャートを確認することで、裁量判断の負担を減らしつつ、狙うポイントを絞りやすくなります。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-amber-300/20 px-3 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-300/30">
          XAUUSD 専用
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 ring-1 ring-white/20">
          半裁量EA連携推奨
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 ring-1 ring-white/20">
          テスト運用中
        </span>
      </div>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-amber-200">Sign types</p>
          <h3 className="mt-1 text-lg font-bold text-white">サイン種別</h3>
        </div>
        <p className="text-sm text-slate-500">
          通知末尾のラベルでサインの種類を判別できます。
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {signTypes.map((sign) => (
          <article
            key={sign.label}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-4"
          >
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                sign.tone === 'amber'
                  ? 'bg-amber-300/10 text-amber-200 ring-amber-300/20'
                  : 'bg-cyan-300/10 text-cyan-200 ring-cyan-300/20'
              }`}
            >
              {sign.label}
            </span>
            <h4 className="mt-4 font-bold text-white">{sign.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">{sign.body}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <p className="text-sm font-semibold text-cyan-200">Notification format</p>
      <h3 className="mt-1 text-lg font-bold text-white">通知の見方</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        通貨ペアと方向が先頭に来るようにしています。通知を受けた瞬間に判断しやすい形式です。
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-300/20 bg-slate-950/60 p-4 font-mono text-sm">
          <p className="text-emerald-300">[XAUUSD] BUY 📈 ※15m攻め</p>
          <p className="mt-1 text-slate-500">@everyone</p>
        </div>
        <div className="rounded-lg border border-rose-300/20 bg-slate-950/60 p-4 font-mono text-sm">
          <p className="text-rose-300">[XAUUSD] SELL 📉 ※5mレベル</p>
          <p className="mt-1 text-slate-500">@everyone</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {[
          { dt: 'XAUUSD', dd: '対象通貨ペア（現在はゴールドのみ）' },
          { dt: 'BUY / SELL', dd: 'エントリー方向' },
          { dt: '📈 / 📉', dd: '方向アイコン（一目で判別可能）' },
          { dt: '※〇〇', dd: 'サイン種別ラベル' },
        ].map((item) => (
          <div
            key={item.dt}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
          >
            <dt className="font-bold text-white">{item.dt}</dt>
            <dd className="mt-1 text-slate-400">{item.dd}</dd>
          </div>
        ))}
      </dl>
    </section>

    <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
      <p className="text-sm font-semibold text-cyan-200">Notification channels</p>
      <h3 className="mt-1 text-lg font-bold text-white">通知チャンネル</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        チャンネルごとに流しているサインの種類が異なります。通知量や運用スタイルに合わせて選んでください。
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {signChannels.map((channel) => (
          <article
            key={channel.href}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-5"
          >
            <h4 className="font-bold text-white">{channel.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">{channel.body}</p>
            <a
              href={channel.href}
              rel="nofollow noopener noreferrer"
              target="_blank"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              {channel.label}
            </a>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
      <p className="text-sm font-semibold text-amber-200">Get started</p>
      <h3 className="mt-1 text-lg font-bold text-white">利用開始の流れ</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        半裁量EAを使う前提の通知です。EAを設定してから通知を受け取ると、サインに合わせた立ち回りがしやすくなります。
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {signStartSteps.map((step, index) => (
          <article
            key={step.title}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-4"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-300 text-sm font-bold text-slate-950">
              {index + 1}
            </span>
            <h4 className="mt-4 font-bold text-white">{step.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">{step.body}</p>
            <a
              href={step.href}
              rel="nofollow noopener noreferrer"
              target="_blank"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
            >
              {step.label}
            </a>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <p className="text-sm font-semibold text-cyan-200">HFM strategy</p>
      <h3 className="mt-1 text-lg font-bold text-white">HFMストラテジーとの連携</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        HFM側で動かしているストラテジーには攻め仕様の半裁量サインを反映しています。
        セント口座でも利用できるようにしているので、必要に応じて確認してください。
      </p>
      <a
        href={SIGN_HFM_STRATEGY_CHANNEL_URL}
        rel="nofollow noopener noreferrer"
        target="_blank"
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-white/10 px-4 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
      >
        HFMストラテジーを確認
      </a>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <p className="text-sm font-semibold text-slate-400">簡易フィルター</p>
      <h3 className="mt-1 text-lg font-bold text-white">
        チャート確認を簡略化したい場合
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        以下のルールを加えるだけでも、突っ込みエントリーを避けやすくなります。
        ただしフィルターを強くすると収益機会も減ります。
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {signFilterItems.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm"
          >
            <p className="font-bold text-white">{item.label}</p>
            <p className="mt-2 leading-6 text-slate-400">{item.body}</p>
          </div>
        ))}
      </div>
    </section>

    <div className="rounded-lg border border-red-300/20 bg-red-300/10 p-4 text-sm leading-6 text-red-100">
      <p className="font-bold">注意事項</p>
      <p className="mt-2">
        サインはエントリー判断の補助です。必ずご自身でチャートを確認し、ロットとリスクを調整してください。
        攻め仕様のサインは通常より積極的な設計のため、資金管理を徹底したうえで使用してください。
        EAの特性上、逆張り気味のサインも含まれます。レンジ相場ではとくにエントリー前の確認を優先してください。
        通知内容・対象・運用ルールはテスト段階のため変更される可能性があります。
      </p>
    </div>
  </section>
);
