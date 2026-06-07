import { EXTERNAL_LINKS } from '../config/navigation';

const EXNESS_SIGNUP_URL = 'https://x.gd/CxfuR';
const NOTE_MEMBERSHIP_URL = 'https://note.com/anyafx/membership';
const MEMBERSHIP_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSc9odFoGLOGFGpCN_OsZewwzXhO61xdzBxY6bQk_NCsQHeq2Q/viewform?usp=dialog';

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
    title: 'その他リンク',
    body: 'Discord、X、サブスク、各種案内はlit.linkに集約しています。',
    href: EXTERNAL_LINKS[0].href,
    label: 'lit.link/anyafx',
  },
];

const membershipSteps = [
  {
    title: 'noteメンバーシップへ参加',
    body: 'まず通常プランへ加入してください。2025/04/01以降の加入は1日約150円のプランが適用されます。',
  },
  {
    title: '加入確認を送付',
    body: 'noteのユーザーIDが分かるスクリーンショットを、DiscordまたはXのDMで送ってください。Xで送る場合はDiscord IDも添えてください。',
  },
  {
    title: 'フォーム申請も可能',
    body: 'DMのやり取りを簡略化したい場合は、note加入後に専用フォームから申請できます。',
  },
  {
    title: '権限付与後に次ステップへ',
    body: '基本的に1日以内に確認します。権限付与後、必要に応じてTradingView IDなど次の提出へ進んでください。',
  },
];

const planStatus = [
  {
    title: '通常プラン',
    status: '公開中',
    body: '現在はこちらのプランのみ公開中です。予告なく値上げする場合がありますが、既に加入中の方は加入時点の料金が適用されます。',
  },
  {
    title: '個別サポート付きプラン',
    status: '満員・非公開',
    body: '現在は非公開です。再募集予定はありません。参加希望の場合はDMで待ちリストへの追加を相談してください。',
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
  {
    title: 'Anya Gold Cent',
    subtitle: 'セント口座ストラテジー',
    body: 'ID: 153191918 / 0.01ロット / 2000セント',
    href: 'https://my.hfm.com/jp/copy-trading/provider-details?provider=153191918',
    label: 'ストラテジー詳細',
  },
  {
    title: 'Anya Gold',
    subtitle: 'ドル口座ストラテジー',
    body: 'ID: 147038068 / 0.01ロット / 1000ドル',
    href: 'https://my.hfm.com/jp/copy-trading/provider-details?provider=147038068',
    label: 'ストラテジー詳細',
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
      <p className="text-sm font-semibold text-amber-200">Join guide</p>
      <h2 className="mt-2 text-2xl font-bold text-white">noteメンバーシップ参加方法</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
        noteメンバーシップへ加入後、加入確認を送ってください。確認後、Discordの限定チャンネル権限を付与します。
        申請前に必ずnote側の加入が完了していることを確認してください。
      </p>
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
      <h3 className="text-lg font-bold text-white">加入後の流れ</h3>
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
        noteメンバーシップへの加入完了後に、DMまたはフォーム申請を行ってください。加入前の申請では確認できません。
      </div>
    </section>

    <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <h3 className="text-lg font-bold text-white">運用リンク</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        口座開設、EA、HFM Copy
        Tradingは任意の運用導線です。条件やリスクを確認してから利用してください。
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
