const ANYA_AI_URL = 'https://chatgpt.com/g/g-6a746bc7f72881919b5fac26b0b186a9-aniyaai';
const ANYA_AI_RELEASE_URL =
  'https://discord.com/channels/1152131321297129534/1534936700458106920/1534942794811052103';
const DISCORD_INVITE_URL = 'https://discord.gg/G6xWszr9CZ';
const PRIVACY_URL = 'https://anyanical.com/privacy';

const capabilities = [
  {
    icon: '🔰',
    title: '学ぶ順番を整理',
    body: '初心者向けの順序から、調整・修正、時間足連携、環境認識まで段階的に案内します。',
  },
  {
    icon: '📖',
    title: '会員教材から検索',
    body: 'Anyanicalの整理済み会員教材を検索し、関連教材と出典IDを示しながら回答します。',
  },
  {
    icon: '📊',
    title: 'チャート分析を補助',
    body: '画像から確認できる範囲を整理し、上位足・中位足・下位足で次に見る条件を言語化します。',
  },
  {
    icon: '📝',
    title: 'トレードを振り返る',
    body: 'エントリー根拠、SL・TP、無効化条件、判断ミスを検証用の形に整理します。',
  },
];

const startSteps = [
  {
    number: '01',
    title: 'ChatGPTへログイン',
    body: 'あにゃAIはChatGPT上で動きます。利用する本人のChatGPTアカウントでログインしてください。',
  },
  {
    number: '02',
    title: '会員認証を開始',
    body: '「Discord会員認証を開始する」を選び、表示された「Sign in with anyanical.com」を押します。',
  },
  {
    number: '03',
    title: 'Discordで許可',
    body: '対象Discordサーバーへの参加と会員ロールを確認します。DiscordのパスワードをあにゃAIへ渡すことはありません。',
  },
  {
    number: '04',
    title: 'そのまま質問',
    body: '認証後は、用語、学習順序、チャート、振り返りなど、知りたいことを普段の言葉で送れます。',
  },
];

const importantNotes = [
  {
    title: 'ChatGPTの利用枠を使います',
    body: '回答生成に使う利用枠は、あなた自身のChatGPTアカウント側のものです。運営者のOpenAI API残高を使う仕組みではなく、あにゃAIからOpenAI APIの従量料金を別途請求することもありません。利用回数や使える機能は、あなたのChatGPTプランやOpenAI側の制限によって変わります。',
  },
  {
    title: '会員限定・Discord認証が必要です',
    body: '対象Discordサーバーで必要な会員ロールを持つ方のみ教材検索を利用できます。退会やロール変更後は利用できなくなる場合があります。認証ボタンを閉じたときは「あにゃAI」に「会員認証」と送れば再表示できます。',
  },
  {
    title: '売買シグナルや利益保証ではありません',
    body: 'あにゃAIは学習と判断整理の補助です。「今すぐ買う・売る」といった売買指示、利益・勝率・反転の保証は行いません。資金管理と最終的な売買判断は必ずご自身で行ってください。',
  },
  {
    title: '最新相場を自動で見ているわけではありません',
    body: 'リアルタイム価格、ニュース、現在のチャート状況を常に取得しているわけではありません。チャート分析では、画像、銘柄、時間足、現在の目線、迷っている点を送ってください。画像から読めない内容は確認が必要です。',
  },
  {
    title: 'AIは間違えることがあります',
    body: '教材検索を行っても、質問の解釈違い、情報不足、画像の読み違いが起こる可能性があります。重要な判断では関連教材と出典を確認し、不明点はDiscordの運営窓口へ確認してください。',
  },
  {
    title: '秘密情報を入力しないでください',
    body: 'DiscordやChatGPTのパスワード、Cookie、sessionid、認証トークン、Client Secret、口座番号などは、質問文や画像へ貼らないでください。運営からこれらの値を送るよう求めることはありません。',
  },
];

const promptExamples = [
  'アニャニカルを初めて学ぶ順番を教えて',
  '調整と修正の違いを具体例つきで教えて',
  'Noteのエントリー3パターンを整理して',
  'このチャートを上位足・中位足・下位足の順で一緒に分析して',
];

export const AnyaAiGuidePage = () => (
  <main className="relative overflow-hidden pb-20">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_42%),radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_38%)]" />

    <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 sm:pt-20 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
            アニャニカル覗き部屋 Member AI
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-6xl">
            会員教材を、
            <span className="block bg-gradient-to-r from-amber-200 via-yellow-300 to-cyan-200 bg-clip-text text-transparent">
              自分の言葉で学べる。
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            あにゃAIは、アニャニカル覗き部屋の会員限定教材を検索しながら、学習順序、用語、環境認識、チャート分析、エントリー条件、検証を整理するChatGPTです。現在はテスト版として公開しており、Discord会員認証後に利用できます。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={ANYA_AI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-amber-300 px-6 text-sm font-black text-slate-950 shadow-[0_16px_50px_rgba(251,191,36,0.2)] transition hover:bg-amber-200"
            >
              あにゃAIを開く ↗
            </a>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('anya-ai-howto')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white/[0.06] px-6 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/10"
            >
              使い方を確認
            </button>
            <a
              href={ANYA_AI_RELEASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-indigo-400/15 px-6 text-sm font-bold text-indigo-100 ring-1 ring-indigo-300/25 transition hover:bg-indigo-400/25"
            >
              Discordの公開案内を見る ↗
            </a>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            ChatGPTアカウントと対象Discordの会員ロールが必要です。回答生成にはご自身のChatGPT利用枠を使用します。
          </p>
        </div>

        <div className="rounded-3xl border border-amber-300/20 bg-slate-900/80 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur sm:p-7">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-300 text-xl shadow-[0_8px_30px_rgba(251,191,36,0.2)]">
              🐾
            </span>
            <div>
              <p className="text-xs font-bold text-amber-200">ANYA AI</p>
              <p className="font-black text-white">最初に試せる質問</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {promptExamples.map((prompt) => (
              <div
                key={prompt}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-200"
              >
                {prompt}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {capabilities.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
          >
            <span className="text-2xl" aria-hidden="true">
              {item.icon}
            </span>
            <h2 className="mt-4 text-lg font-black text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-300/[0.09] via-slate-900/90 to-slate-950 p-6 sm:p-9 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-sm font-bold text-amber-200">Ask without hesitation</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
            「本人に聞くのは、ちょっと恥ずかしい」
            <span className="block text-amber-200">そんな質問こそ、まずAIへ。</span>
          </h2>
        </div>
        <div className="space-y-3 text-sm leading-7 text-slate-300">
          <p>
            「こんな初歩的なことを聞いていいのかな」「前にも聞いた気がする」「自分の考えをうまく言葉にできない」。そんなときも、あにゃAIなら時間や回数を気にせず質問できます。
          </p>
          <p>
            まずAIと一緒に用語や判断手順を整理し、それでも分からない点だけをDiscordで質問すれば、あにゃ本人やメンバーにも相談しやすくなります。質問文を一緒にまとめてもらう使い方もできます。
          </p>
          <p className="text-xs leading-5 text-slate-500">
            あにゃAIは本人による個別回答ではなく、整理済み教材をもとにした学習補助です。重要な不明点や教材との食い違いはDiscordで確認してください。
          </p>
        </div>
      </div>
    </section>

    <section
      id="anya-ai-howto"
      className="scroll-mt-24 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <p className="text-sm font-bold text-cyan-200">How to start</p>
      <h2 className="mt-2 text-3xl font-black text-white">利用開始は4ステップ</h2>
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {startSteps.map((step) => (
          <article
            key={step.number}
            className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-900/70 p-5"
          >
            <span className="text-4xl font-black text-cyan-300/20">{step.number}</span>
            <h3 className="mt-2 font-black text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{step.body}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-6 sm:p-9">
        <p className="text-sm font-bold text-amber-200">Before you use</p>
        <h2 className="mt-2 text-3xl font-black text-white">利用前に確認してください</h2>
        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          {importantNotes.map((note) => (
            <article
              key={note.title}
              className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"
            >
              <h3 className="font-black text-white">{note.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{note.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-cyan-200 underline decoration-cyan-300/30 underline-offset-4 hover:text-cyan-100"
          >
            プライバシーポリシー
          </a>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-cyan-200 underline decoration-cyan-300/30 underline-offset-4 hover:text-cyan-100"
          >
            Discordの運営窓口
          </a>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-4xl px-4 pt-10 text-center sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-300/15 via-slate-900 to-cyan-300/10 px-6 py-10 sm:px-10">
        <h2 className="text-3xl font-black text-white">準備ができたら、あにゃAIへ</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          最初に会員認証を行い、その後は知りたいテーマをそのまま送ってください。認証ボタンを閉じた場合は「会員認証」と送れば再開できます。
        </p>
        <a
          href={ANYA_AI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-amber-300 px-7 text-sm font-black text-slate-950 transition hover:bg-amber-200"
        >
          注意事項を理解して、あにゃAIを開く ↗
        </a>
      </div>
    </section>
  </main>
);
