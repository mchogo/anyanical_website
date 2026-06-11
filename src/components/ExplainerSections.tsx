import { EXTERNAL_LINKS } from '../config/navigation';

const featureSections = [
  {
    title: 'サンデー相場とは',
    body: '金・原油・株価指数などの公式市場は週末に休場します。一方で一部の24時間取引市場では価格が動くため、地政学ニュースや要人発言への週末反応を月曜の市場再開前に確認できます。',
  },
  {
    title: '金曜基準の考え方',
    body: '週末の窓開けを確認しやすいように、直近の金曜クローズ付近の価格を比較基準として使います。銘柄ごとの公式市場クローズ時刻には差があるため、あくまで参考値として確認してください。',
  },
  {
    title: '公式市場との差',
    body: '表示価格は公式市場の終値ではありません。COMEX、NYMEX、CME、東証、OTC FXなどとは流動性、需給、取引時間、参照価格の違いにより乖離することがあります。',
  },
];

const eventItems = [
  '中東情勢や地政学リスクの急変',
  'FRB・日銀・政府関係者の週末発言',
  '暗号資産の急落・急騰によるリスク心理の変化',
  '月曜朝の窓開けを事前に警戒したい場面',
];

const faqItems = [
  {
    question: 'サンデーゴールドの価格はどこの値段ですか？',
    answer:
      '24時間取引市場のGOLD価格を優先して表示しています。COMEXやLBMAなどの公式スポットとは参照市場が違うため、需給や流動性によって多少の差が出ることがあります。',
  },
  {
    question: '土日なのに価格がほとんど動かないことがあります。故障ですか？',
    answer:
      '故障とは限りません。公式市場が休場している週末は価格発見が少なく、金や指数は数分以上ほとんど動かないことがあります。カードの最終更新秒数と接続状態を確認してください。',
  },
  {
    question: 'サンデードル円は何を見ていますか？',
    answer:
      '24時間取引市場のJPY価格をUSD/JPYの参考として表示しています。OTC FXや各社CFDの気配値とは完全一致しません。',
  },
  {
    question: '変動率は金曜クローズ比ですか？',
    answer:
      'はい。週末の窓開け確認に使いやすいよう、直近の金曜クローズ付近の価格を基準にしています。ただし公式市場の終値そのものではなく、24時間取引市場側の参考価格です。',
  },
  {
    question: 'このボードの価格でそのまま取引できますか？',
    answer:
      'このページは情報提供用です。実際の注文価格、スプレッド、約定条件は利用する取引所や証券会社で確認してください。',
  },
];

const relatedTools = [
  {
    title: '通貨強弱・ヒートマップ',
    description: '主要通貨の強弱を色でひと目で確認',
    href: '#/tools/currency-strength',
  },
  {
    title: '経済指標カレンダー',
    description: '重要指標と要人発言を東京時間で確認',
    href: '#/tools/economic-calendar',
  },
  {
    title: '窓開け監視ボード',
    description: '週末価格と月曜オープンの差を追跡',
    href: '#/tools/gap-watch',
  },
  {
    title: 'EA運用チェックリスト',
    description: '半裁量EA・全自動EAの稼働前確認',
    href: '#/tools/ea-checklist',
  },
  {
    title: '戦略ガイド',
    description: 'サブスク、コピトレ、半裁量EAの概要',
    href: '#/tools/strategy',
  },
  {
    title: 'コミュニティ案内',
    description: '市場メモ、ツール、各種案内のまとめ',
    href: '#/tools/community',
  },
  {
    title: 'プレミアム',
    description: 'noteメンバーシップ、加入手続き、Discord権限付与',
    href: '#/tools/participation',
  },
  {
    title: 'リンク集',
    description: 'Discord、X、サブスク、各種案内まとめ',
    href: EXTERNAL_LINKS[0].href,
    external: true,
  },
];

const EXNESS_SIGNUP_URL = 'https://x.gd/CxfuR';

const anyaGoldStrategies = [
  {
    accountType: 'セント口座ストラテジー',
    strategyName: 'Anya Gold Cent',
    strategyId: '153191918',
    lotRatio: '0.01ロット / 2000セント',
    note: '小さめの資金単位で運用を始めたい人向け',
    href: 'https://my.hfm.com/jp/copy-trading/provider-details?provider=153191918',
  },
  {
    accountType: 'ドル口座ストラテジー',
    strategyName: 'Anya Gold',
    strategyId: '147038068',
    lotRatio: '0.01ロット / 1000ドル',
    note: 'ドル建て口座で標準的に運用したい人向け',
    href: 'https://my.hfm.com/jp/copy-trading/provider-details?provider=147038068',
  },
];

export const ExplainerSections = () => (
  <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
    <div className="grid gap-4 lg:grid-cols-3">
      {featureSections.map((section, index) => (
        <article
          key={section.title}
          className="card-interactive animate-fade-up rounded-lg border border-white/10 bg-white/[0.035] p-5"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <h2 className="text-lg font-bold text-white">{section.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{section.body}</p>
        </article>
      ))}
    </div>

    <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
        <h2 className="text-lg font-bold text-white">週末に動きやすい材料</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {eventItems.map((item) => (
            <div
              key={item}
              className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
        <h2 className="text-lg font-bold text-white">見方のポイント</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-slate-200">24時間取引価格</dt>
            <dd className="mt-1 text-slate-500">
              週末も動く参考価格。ニュース直後の反応を見る場所。
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-200">TradingViewチャート</dt>
            <dd className="mt-1 text-slate-500">
              CFDやFXの参考チャート。24時間取引価格との水準差を見る補助用。
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-200">金曜クローズ基準</dt>
            <dd className="mt-1 text-slate-500">
              月曜の窓開けリスクを把握するための比較基準。
            </dd>
          </div>
        </dl>
      </section>
    </div>

    <section className="mt-6 overflow-hidden rounded-lg border border-emerald-300/20 bg-gradient-to-br from-emerald-400/15 via-cyan-400/10 to-slate-900 p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-200">
            プレミアムと運用環境の入口
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            考察、Discord、EA環境をまとめて確認
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            日々の相場考察を追いたい人はプレミアムへ。運用環境を整えたい人はExness口座やEAチェックを確認できます。
            裁量トレードだけでなく、半裁量EAや全自動EAを使った運用にも対応できます。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <a
            href="#/tools/participation"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-300 px-5 text-sm font-bold text-slate-950 shadow-glow transition hover:bg-emerald-200"
          >
            プレミアムを見る
          </a>
          <a
            href={EXNESS_SIGNUP_URL}
            rel="noreferrer"
            target="_blank"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-5 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
          >
            Exness口座開設
          </a>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
          <p className="font-semibold text-white">日々の考察</p>
          <p className="mt-2 leading-6 text-slate-400">
            ゴールド、ドル円、BTCなどの目線や注意ラインを継続的に確認。
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
          <p className="font-semibold text-white">裁量トレード</p>
          <p className="mt-2 leading-6 text-slate-400">
            ニュース後の方向感や週明けギャップを見て、自分で判断する運用。
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
          <p className="font-semibold text-white">半裁量EA</p>
          <p className="mt-2 leading-6 text-slate-400">
            エントリー補助、決済補助、リスク管理などをEAで支援する運用。
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
          <p className="font-semibold text-white">全自動EA</p>
          <p className="mt-2 leading-6 text-slate-400">
            ルール化した売買、監視、決済をEAに任せる自動運用。
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/40 p-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-200">Anya Gold strategy</p>
            <h3 className="mt-1 text-xl font-bold text-white">
              口座タイプ別ストラテジー
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            ロット比率は運用目安です。稼働前に必ず設定を確認してください。
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {anyaGoldStrategies.map((strategy) => (
            <article
              key={strategy.strategyId}
              className="rounded-lg border border-white/10 bg-white/[0.035] p-4"
            >
              <p className="text-xs font-semibold uppercase text-slate-500">
                {strategy.accountType}
              </p>
              <h4 className="mt-2 text-lg font-bold text-white">
                {strategy.strategyName}
              </h4>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">ストラテジーID</dt>
                  <dd className="mt-1 font-semibold text-slate-200 tabular-nums">
                    {strategy.strategyId}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">ロット比率</dt>
                  <dd className="mt-1 font-semibold text-emerald-200">
                    {strategy.lotRatio}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-6 text-slate-400">{strategy.note}</p>
              <a
                href={strategy.href}
                rel="nofollow noopener noreferrer"
                target="_blank"
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
              >
                ストラテジー詳細を見る
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="mt-6 rounded-lg border border-white/10 bg-slate-900/80 p-5">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-200">FAQ</p>
          <h2 className="mt-1 text-2xl font-bold text-white">よくある質問</h2>
        </div>
        <p className="text-sm text-slate-500">価格の見方と取引前に確認したいポイント</p>
      </div>

      <div className="space-y-3">
        {faqItems.map((item) => (
          <details
            key={item.question}
            className="rounded-lg border border-white/10 bg-white/[0.035]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-semibold text-white">
              <span>{item.question}</span>
              <span className="faq-icon grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20">
                +
              </span>
            </summary>
            <div className="faq-body border-t border-white/10">
              <div className="faq-body-inner px-4 py-4 text-sm leading-6 text-slate-400">
                {item.answer}
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>

    <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-200">Related tools</p>
          <h2 className="mt-1 text-2xl font-bold text-white">関連ツール</h2>
        </div>
        <p className="text-sm text-slate-500">各ツールは別ページで開きます。</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {relatedTools.map((tool) => (
          <a
            key={tool.href}
            href={tool.href}
            rel={'external' in tool ? 'noopener noreferrer' : undefined}
            target={'external' in tool ? '_blank' : undefined}
            className="card-interactive rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]"
          >
            <p className="font-bold text-white">{tool.title}</p>
            <p className="mt-2 leading-6 text-slate-500">{tool.description}</p>
            <span className="mt-4 inline-flex text-xs font-semibold text-cyan-200">
              {'external' in tool ? '外部リンク' : '開く'}
            </span>
          </a>
        ))}
      </div>
    </section>
  </section>
);
