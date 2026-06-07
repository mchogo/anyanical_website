import { EXTERNAL_LINKS } from '../config/navigation';

const EXNESS_SIGNUP_URL = 'https://x.gd/CxfuR';

const strategyCards = [
  {
    title: 'Gold weekend bias',
    body: '週末ニュースでXAUUSD相当のperpが動いたとき、月曜の窓開け、東京時間の初動、ロンドン勢の追随を分けて見ます。',
  },
  {
    title: 'BTC risk sentiment',
    body: 'BTCUSDは週末も流動性があり、リスクオン・リスクオフの先行反応として確認しやすい銘柄です。',
  },
  {
    title: 'USDJPY macro watch',
    body: 'ドル円は要人発言、金利観測、地政学ヘッドラインの影響を受けやすいため、金や指数と並べて確認します。',
  },
];

const strategySteps = [
  '週末ボードで金・指数・ドル円・BTCの変化率を確認',
  'TradingViewチャートで節目、前週高安、ギャップ候補を確認',
  '経済指標ページで月曜から水曜までの重要イベントを確認',
  'EA稼働前にスプレッド、ロット、最大ポジション、停止条件を確認',
];

const communityFeatures = [
  {
    title: '市場メモ',
    body: '週末に出たニュース、金・BTC・ドル円の反応、週明けに見る価格帯を短く整理します。',
  },
  {
    title: 'ツール導線',
    body: '相場ボード、通貨強弱、経済指標、窓開け監視を同じ導線から確認できます。',
  },
  {
    title: '運用チェック',
    body: '裁量、半裁量EA、全自動EAのどれでも、稼働前に確認したい項目を見落とさないようにします。',
  },
];

const participationRoutes = [
  {
    title: 'その他リンク',
    body: 'サブスク、Discord、各種案内はlit.linkに集約しています。',
    href: EXTERNAL_LINKS[0].href,
    label: 'lit.link/anyafx',
  },
  {
    title: 'Exness口座開設',
    body: '裁量トレード、半裁量EA、全自動EAの運用環境を準備するための口座開設リンクです。',
    href: EXNESS_SIGNUP_URL,
    label: 'Exnessで口座開設',
  },
];

const hfmStrategies = [
  {
    title: 'Anya Gold Cent',
    subtitle: 'セント口座ストラテジー',
    id: '153191918',
    lotRatio: '0.01ロット / 2000セント',
    href: 'https://my.hfm.com/jp/copy-trading/provider-details?provider=153191918',
  },
  {
    title: 'Anya Gold',
    subtitle: 'ドル口座ストラテジー',
    id: '147038068',
    lotRatio: '0.01ロット / 1000ドル',
    href: 'https://my.hfm.com/jp/copy-trading/provider-details?provider=147038068',
  },
];

const faqItems = [
  {
    question: '初心者でも使えますか？',
    answer:
      '相場ボード自体はニュース後の変化を確認するためのものです。実際に取引する場合は、まず小さいロットで検証し、損失許容額を決めてから使ってください。',
  },
  {
    question: 'どの銘柄を見るべきですか？',
    answer:
      '金、BTC、ドル円、S&P500、日経225を優先すると、週末のリスク心理と週明けの窓開け候補を把握しやすくなります。',
  },
  {
    question: 'EAは常時稼働でいいですか？',
    answer:
      '重要指標、週明け直後、急変時はスプレッドや約定条件が悪化しやすいため、稼働条件と停止条件を先に決める必要があります。',
  },
];

export const StrategyGuidePage = () => (
  <section className="space-y-6">
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
      <p className="text-sm font-semibold text-cyan-200">Strategy guide</p>
      <h2 className="mt-2 text-2xl font-bold text-white">週末相場から月曜の取引計画へ</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
        週末のperp価格は公式市場の価格ではありません。ただ、ニュースに対する市場参加者の反応を見る材料になります。
        金、BTC、ドル円、指数を並べて、月曜にどこを確認するかを決めるためのページです。
      </p>
    </section>

    <div className="grid gap-4 lg:grid-cols-3">
      {strategyCards.map((card) => (
        <article
          key={card.title}
          className="rounded-lg border border-white/10 bg-white/[0.035] p-5"
        >
          <h3 className="text-lg font-bold text-white">{card.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">{card.body}</p>
        </article>
      ))}
    </div>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <h3 className="text-lg font-bold text-white">確認フロー</h3>
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
  </section>
);

export const CommunityGuidePage = () => (
  <section className="space-y-6">
    <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
      <p className="text-sm font-semibold text-emerald-200">Community</p>
      <h2 className="mt-2 text-2xl font-bold text-white">
        ツールとコミュニティ導線をまとめる
      </h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
        相場の確認、週明けの準備、EA稼働前チェック、各種案内を分散させず、必要なリンクへすぐ移動できる構成にしています。
      </p>
    </section>

    <div className="grid gap-4 lg:grid-cols-3">
      {communityFeatures.map((feature) => (
        <article
          key={feature.title}
          className="rounded-lg border border-white/10 bg-white/[0.035] p-5"
        >
          <h3 className="text-lg font-bold text-white">{feature.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">{feature.body}</p>
        </article>
      ))}
    </div>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <h3 className="text-lg font-bold text-white">よくある質問</h3>
      <div className="mt-4 space-y-3">
        {faqItems.map((item) => (
          <details
            key={item.question}
            className="group rounded-lg border border-white/10 bg-white/[0.035]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-semibold text-white">
              <span>{item.question}</span>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-300/10 text-emerald-200 ring-1 ring-emerald-300/20 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="border-t border-white/10 px-4 py-4 text-sm leading-6 text-slate-400">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  </section>
);

export const ParticipationGuidePage = () => (
  <section className="space-y-6">
    <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
      <p className="text-sm font-semibold text-amber-200">Join / Affiliate</p>
      <h2 className="mt-2 text-2xl font-bold text-white">参加方法と運用リンク</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
        サブスク、Discord、口座開設、HFMストラテジーなど、運用前に確認するリンクをまとめています。
        取引条件、口座タイプ、リスク許容額は必ず自分で確認してください。
      </p>
    </section>

    <div className="grid gap-4 lg:grid-cols-2">
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
      <h3 className="text-lg font-bold text-white">HFM Copy Trading</h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {hfmStrategies.map((strategy) => (
          <article
            key={strategy.id}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-5"
          >
            <p className="text-xs font-semibold uppercase text-slate-500">
              {strategy.subtitle}
            </p>
            <h4 className="mt-2 text-xl font-bold text-white">{strategy.title}</h4>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">ストラテジーID</dt>
                <dd className="mt-1 font-semibold text-slate-200 tabular-nums">
                  {strategy.id}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">ロット比率</dt>
                <dd className="mt-1 font-semibold text-amber-200">{strategy.lotRatio}</dd>
              </div>
            </dl>
            <a
              href={strategy.href}
              rel="nofollow noopener noreferrer"
              target="_blank"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
            >
              ストラテジー詳細
            </a>
          </article>
        ))}
      </div>
    </section>
  </section>
);
