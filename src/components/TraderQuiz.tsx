import { useEffect, useState } from 'react';

import { useDiscordAuth } from '../hooks/useDiscordAuth';

type AxisKey = 'ai' | 'sl' | 'rc' | 'yd';
type TypeCode = string; // e.g. "ASRY"

type QuizResultRecord = {
  id: string;
  typeCode: string;
  answers: Partial<Record<AxisKey, string>>;
  createdAt: string;
};

type Question = {
  axis: AxisKey;
  text: string;
  optionA: { letter: string; text: string };
  optionB: { letter: string; text: string };
};

const questions: Question[] = [
  {
    axis: 'ai',
    text: 'エントリーを決めるとき、主に何を根拠にしますか？',
    optionA: { letter: 'A', text: 'テクニカル分析やラインで判断する' },
    optionB: { letter: 'I', text: '値動きの流れや相場感で判断する' },
  },
  {
    axis: 'sl',
    text: 'どちらのスタイルがしっくりきますか？',
    optionA: { letter: 'S', text: '素早く決めて、その日に完結させる' },
    optionB: { letter: 'L', text: 'チャンスを絞って、数日〜週単位で保有する' },
  },
  {
    axis: 'rc',
    text: '含み益が出ているとき、どうしたくなりますか？',
    optionA: { letter: 'R', text: 'もう少し伸ばしてみたい' },
    optionB: { letter: 'C', text: '早めに確保してリスクを消したい' },
  },
  {
    axis: 'yd',
    text: 'トレードするとき、最も重視することは？',
    optionA: { letter: 'Y', text: '自分が決めたルール・条件に沿っているか' },
    optionB: { letter: 'D', text: 'そのときの相場の空気や流れ' },
  },
  {
    axis: 'ai',
    text: 'チャートを開いたらまず何を確認しますか？',
    optionA: { letter: 'A', text: '主要なサポート・レジスタンスの位置' },
    optionB: { letter: 'I', text: '今の値動きのリズムと勢い' },
  },
  {
    axis: 'sl',
    text: '週末に相場チェックするとき、主に何を考えますか？',
    optionA: { letter: 'S', text: '来週の短期的な動きのヒントを探す' },
    optionB: { letter: 'L', text: '中長期の流れと環境認識を整理する' },
  },
  {
    axis: 'rc',
    text: 'ポジションサイズを決めるとき、重視するのは？',
    optionA: { letter: 'R', text: '勝てる局面では大きめに張りたい' },
    optionB: { letter: 'C', text: '毎回のリスク額を一定に保ちたい' },
  },
  {
    axis: 'yd',
    text: 'うまくいくトレードのパターンは？',
    optionA: { letter: 'Y', text: '同じ条件で入って再現性が高い' },
    optionB: { letter: 'D', text: '状況に合わせて柔軟に対応できた' },
  },
  {
    axis: 'ai',
    text: '負けトレードを振り返るとき、一番気になることは？',
    optionA: { letter: 'A', text: 'エントリー条件の分析が正しかったか' },
    optionB: { letter: 'I', text: '入るタイミングが合っていたか' },
  },
  {
    axis: 'sl',
    text: '利確するとき、どちらが気持ちいいですか？',
    optionA: { letter: 'S', text: 'テキパキ利確してピンをつけたとき' },
    optionB: { letter: 'L', text: '大きなトレンドに乗って一気に取れたとき' },
  },
  {
    axis: 'rc',
    text: '連敗が続いたとき、どう対処しますか？',
    optionA: { letter: 'R', text: '取り返すきっかけを積極的に探す' },
    optionB: { letter: 'C', text: 'ロットを下げて一旦様子を見る' },
  },
  {
    axis: 'yd',
    text: '理想のトレーダー像は？',
    optionA: { letter: 'Y', text: 'ルールを守り感情を排除するシステムトレーダー' },
    optionB: { letter: 'D', text: '相場を読んで状況に応じる裁量トレーダー' },
  },
];

type TraderTypeData = {
  code: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  recommendedStyle: string;
  compatible: string[];
};

const traderTypes: TraderTypeData[] = [
  {
    code: 'ASRY',
    name: '速戦スキャルパー',
    emoji: '⚡',
    tagline: 'データで素早く、ルール通りに刻む',
    description:
      'テクニカル分析を武器に、短期足で素早くエントリーし積極的に利を伸ばすタイプ。ルールに忠実で再現性が高く、高頻度トレードを得意とします。',
    strengths: [
      '再現性が高く負けパターンを潰しやすい',
      '素早い判断力とエントリー精度',
      '積極的なリスクテイクで大きな利を狙える',
    ],
    weaknesses: [
      'オーバートレードしやすい',
      '相場が荒れると連敗しやすい',
      'ルールに縛られて相場変化への対応が遅れる',
    ],
    recommendedStyle:
      '明確なエントリー条件を設定し、デイトレ〜スキャルに集中。毎日のトレード記録でルールを磨く。',
    compatible: ['ALCY', 'ISRD'],
  },
  {
    code: 'ASRD',
    name: '直撃スキャルパー',
    emoji: '🎯',
    tagline: '分析を基盤に、感覚で決め打ちする',
    description:
      '分析で状況を把握しながらも、最終的な判断は相場感で動くタイプ。積極的な短期トレードで、高い瞬発力を持っています。',
    strengths: [
      '分析と感覚の両方を活用できる',
      '臨機応変なエントリーができる',
      '素早い利確で資金回転が速い',
    ],
    weaknesses: [
      'ルールが曖昧になりやすい',
      '感情に流されるリスクがある',
      '記録・検証がしにくい',
    ],
    recommendedStyle:
      '基本ルールを設けつつ、最終判断に裁量を残す形がベスト。裁量の範囲をあらかじめ決めておく。',
    compatible: ['ALCY', 'ISCY'],
  },
  {
    code: 'ASCY',
    name: '精密スキャルパー',
    emoji: '🔬',
    tagline: '条件を絞ってコツコツ積み上げる',
    description:
      'テクニカルで条件を絞り込み、ルールに従って慎重に短期トレードするタイプ。安定感が高く、着実に利を積み上げます。',
    strengths: [
      '高い安定性と一貫したリスク管理',
      'ドローダウンが小さい',
      'ルールが明確で検証・改善がしやすい',
    ],
    weaknesses: [
      '利が伸びにくい場面がある',
      '機会損失が多くなりがち',
      'チャンス時にロットを上げられない',
    ],
    recommendedStyle:
      'エントリー回数を絞り、勝率を高める方向に特化。EAや半自動ツールとの相性が良い。',
    compatible: ['ILRD', 'ASRY'],
  },
  {
    code: 'ASCD',
    name: '堅実スキャルパー',
    emoji: '🛡️',
    tagline: '分析で慎重に、感覚で微調整する',
    description:
      '分析を基盤に、裁量で状況を見ながら保守的に動くタイプ。リスクを取らずに短期で着実に利を積みます。',
    strengths: [
      'リスク管理が徹底されている',
      '慎重なため損失が小さい',
      '相場環境に合わせて柔軟に動ける',
    ],
    weaknesses: [
      '利が小さくなりやすい',
      '優位性のある局面でも攻めきれない',
      '判断基準がぶれやすい',
    ],
    recommendedStyle:
      '明確な損切りラインを設定した上で裁量を使う。手法のルール化に少しずつ取り組む。',
    compatible: ['ILRY', 'ASCY'],
  },
  {
    code: 'ALRY',
    name: '猛進スイング型',
    emoji: '🚀',
    tagline: 'データと戦略で大きな波に乗る',
    description:
      'テクニカル分析でトレンドを見極め、積極的にポジションを持ち続けるタイプ。大きな利益を狙う戦略的スイングトレーダーです。',
    strengths: [
      '大きなトレンドで高いリターンを得られる',
      '再現性のある戦略を磨ける',
      '長期的な視点で相場を見られる',
    ],
    weaknesses: [
      '引きつけが甘いと含み損が大きくなる',
      '短期の振れに振り回されやすい',
      '含み益のある局面でも我慢が必要',
    ],
    recommendedStyle:
      '週足・日足でのトレンド把握を徹底し、エントリーは4時間足以下で絞る。明確な利確目標を持つ。',
    compatible: ['ISCY', 'ASCD'],
  },
  {
    code: 'ALRD',
    name: '大胆スイング型',
    emoji: '🦅',
    tagline: '分析と裁量で大きく狙う',
    description:
      'テクニカル分析を理解しつつ、裁量で大きな流れに乗るタイプ。相場の波を読む力があり、積極的に大きな利を取りに行きます。',
    strengths: [
      '大局観が優れている',
      '状況変化への対応が速い',
      '一度の利益が大きくなりやすい',
    ],
    weaknesses: [
      '感情的な判断で損切りが遅れる',
      '裁量が広すぎると一貫性が保てない',
      '連敗すると追い銭リスクがある',
    ],
    recommendedStyle:
      '裁量の範囲を事前にルール化。大きな方向感があるときだけポジションを持つよう意識する。',
    compatible: ['ASCY', 'ILCY'],
  },
  {
    code: 'ALCY',
    name: '長期型戦略家',
    emoji: '♟️',
    tagline: 'ルールと分析で安定した成長を目指す',
    description:
      'テクニカル分析に基づくルールを守りながら、慎重に中長期のポジションを積み上げるタイプ。安定感が非常に高いです。',
    strengths: [
      '一貫性のある戦略で長期的に安定する',
      'ドローダウンが小さい',
      '精神的なブレが少ない',
    ],
    weaknesses: [
      '機会を逃しやすい',
      '大きなリターンを得にくい',
      '相場が荒れると利益が出にくい',
    ],
    recommendedStyle:
      '明確なトレードルールをドキュメント化し、記録・検証を習慣化。EAとの相性が良い。',
    compatible: ['ASRY', 'ISRD'],
  },
  {
    code: 'ALCD',
    name: '冷静長期型',
    emoji: '🧊',
    tagline: 'データを信頼して粘り強く待つ',
    description:
      '分析結果を信頼し、慎重に中長期保有するタイプ。焦らず相場を見続け、納得のいくチャンスにだけ乗ります。',
    strengths: ['精神的な安定感が高い', '損失を最小化できる', 'チャンスを精査できる'],
    weaknesses: [
      'チャンスを見逃しやすい',
      '利が伸びにくい',
      'ルールが固まっていないと動けない',
    ],
    recommendedStyle:
      '週次でトレード計画を立て、条件が揃った場合だけエントリー。記録して少しずつ改善する。',
    compatible: ['ISRY', 'ASRD'],
  },
  {
    code: 'ISRY',
    name: '嗅覚スキャルパー',
    emoji: '🦊',
    tagline: '感覚と仕掛けで瞬発力を発揮する',
    description:
      '相場感でタイミングを掴み、短期で積極的にトレードするタイプ。高い瞬発力と直感力を持ち、素早い判断で利を積み上げます。',
    strengths: [
      '瞬発力とタイミング感が優れている',
      'ルールに縛られず機会を逃さない',
      '流れが良い時に大きく取れる',
    ],
    weaknesses: [
      '根拠が薄くなりやすい',
      '感情に流されるリスクが高い',
      'ドローダウン期に収拾がつきにくい',
    ],
    recommendedStyle:
      '感覚を磨きながらも、最低限の損切りルールは厳守。トレード記録で自分のパターンを把握する。',
    compatible: ['ALCD', 'ASCY'],
  },
  {
    code: 'ISRD',
    name: '自由スキャルパー',
    emoji: '🌊',
    tagline: '流れを読んで自在にスキャルする',
    description:
      '相場感と裁量を活かして短期で自由にトレードするタイプ。直感と柔軟性が武器で、流れが良い相場で実力を発揮します。',
    strengths: [
      '相場の流れへの適応力が高い',
      '柔軟で機動的なトレードができる',
      '良い流れをつかんだときの瞬発力がある',
    ],
    weaknesses: [
      '基準がなくオーバートレードしやすい',
      '損切りが甘くなりやすい',
      '記録・改善のサイクルが回しにくい',
    ],
    recommendedStyle:
      '感覚トレードに最低限のルール（最大損失額・損切りライン）を設ける。デイでの損失上限を決める。',
    compatible: ['ALCY', 'ASCD'],
  },
  {
    code: 'ISCY',
    name: '慎重感覚型',
    emoji: '🦉',
    tagline: '感じ取った流れをリスク管理で固める',
    description:
      '相場感に頼りながらも、リスク管理は慎重に行うタイプ。直感と安全策を組み合わせた、バランスの良いスタイルです。',
    strengths: [
      '安心感のある取引ができる',
      '相場の雰囲気を読む力がある',
      'ルールが守られていれば安定する',
    ],
    weaknesses: [
      '判断根拠が曖昧になりやすい',
      '相場感が外れると立て直しが難しい',
      '条件が整わず機会を逃すことも',
    ],
    recommendedStyle:
      '感覚に頼りながらもチェックリスト形式でエントリー条件を確認する習慣をつける。',
    compatible: ['ALRY', 'ASRD'],
  },
  {
    code: 'ISCD',
    name: '守備感覚型',
    emoji: '🐢',
    tagline: '感覚を信じて慎重に、着実に動く',
    description:
      '相場感で方向感を掴み、裁量で動きながらもリスクは最小限に抑えるタイプ。資金を守ることを最優先にしています。',
    strengths: [
      '資金保全能力が高い',
      '感覚が当たれば着実に積み上げる',
      'メンタルが安定している',
    ],
    weaknesses: ['利が伸びにくい', 'チャンスを見逃しやすい', '相場感頼りで根拠が薄い'],
    recommendedStyle:
      '少ないトレード数でも確実に利を積む方向で。感覚を磨くために日足・週足でのメモを習慣化。',
    compatible: ['ALRY', 'ALRD'],
  },
  {
    code: 'ILRY',
    name: '大局積極型',
    emoji: '🌐',
    tagline: '大きな流れを感じ取り、ルールで攻める',
    description:
      '相場全体の大きな動きを感覚で捉え、ルールに基づいて積極的にスイングトレードするタイプ。大局観と戦略性を兼ね備えています。',
    strengths: [
      '大きなトレンドを掴む嗅覚がある',
      'ルールで管理しながら積極的に動ける',
      '長期的に高いリターンを狙える',
    ],
    weaknesses: [
      '短期の逆行に対してメンタルが揺れやすい',
      '大きなポジションを持ちすぎるリスク',
      'エントリーが早すぎることがある',
    ],
    recommendedStyle:
      '週足・日足の方向性を感覚で把握し、エントリー条件だけルール化する。大きなトレンド専門に絞る。',
    compatible: ['ASCD', 'ISCD'],
  },
  {
    code: 'ILRD',
    name: '自然体スイング型',
    emoji: '🌿',
    tagline: '大きな流れに乗って自然に動く',
    description:
      '相場の大きな流れを感じ取り、裁量で自然にポジションを持つタイプ。相場感に優れ、無理をせず流れに乗ります。',
    strengths: [
      '相場への自然な適応力が高い',
      '無理のない判断で長続きしやすい',
      '大局観が優れている',
    ],
    weaknesses: [
      'ルールがないと損切りが遅れる',
      '感覚が外れた時の対処が難しい',
      '裁量の一貫性を保ちにくい',
    ],
    recommendedStyle:
      '大きな流れだけに絞ってポジションを持ち、感覚エントリーでも損切りラインだけはあらかじめ決める。',
    compatible: ['ASCY', 'ALCY'],
  },
  {
    code: 'ILCY',
    name: '直感安定型',
    emoji: '🌸',
    tagline: '感覚と慎重さで長期の安定を目指す',
    description:
      '相場感でチャンスを見極め、慎重に中長期のポジションを管理するタイプ。安定感が高く、焦らず着実に資産を育てます。',
    strengths: [
      '精神的に安定してトレードできる',
      '大きな損失を避けられる',
      '自分のペースで長く続けられる',
    ],
    weaknesses: [
      '利が伸びにくい傾向がある',
      '感覚で判断するため根拠が説明しにくい',
      '機会損失が多い',
    ],
    recommendedStyle:
      'スイングトレードに特化し、感覚で方向感を掴んだ後は損切り・利確だけ事前に設定する。',
    compatible: ['ALRD', 'ASRY'],
  },
  {
    code: 'ILCD',
    name: '達観トレーダー',
    emoji: '🧘',
    tagline: '相場を俯瞰して淡々と動く',
    description:
      '相場全体を広い視野で見渡し、感覚と慎重さで淡々とスイングトレードするタイプ。欲に振り回されず、相場と向き合います。',
    strengths: ['感情的にブレにくい', '資金を長期的に守れる', '相場の大局を見誤りにくい'],
    weaknesses: [
      'チャンスを見送りすぎる',
      '利を積み上げるペースが遅い',
      '根拠の言語化が苦手',
    ],
    recommendedStyle:
      '長期投資に近い感覚でスイングに取り組み、月次・週次でパフォーマンスを振り返る習慣を持つ。',
    compatible: ['ASRY', 'ISRY'],
  },
];

const typeMap = new Map(traderTypes.map((t) => [t.code, t]));
const quizStorageKey = (ownerId: string) => `wmb.traderQuiz.${ownerId}`;

const createId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readQuizHistory = (ownerId: string): QuizResultRecord[] => {
  try {
    const item = window.localStorage.getItem(quizStorageKey(ownerId));
    return item ? (JSON.parse(item) as QuizResultRecord[]) : [];
  } catch {
    return [];
  }
};

const writeQuizHistory = (ownerId: string, history: QuizResultRecord[]) => {
  window.localStorage.setItem(quizStorageKey(ownerId), JSON.stringify(history));
};

const formatSavedAt = (value: string) =>
  new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value));

const computeType = (answers: Record<AxisKey, string>): TypeCode => {
  const ai = answers.ai || 'A';
  const sl = answers.sl || 'S';
  const rc = answers.rc || 'C';
  const yd = answers.yd || 'Y';
  return `${ai}${sl}${rc}${yd}`;
};

const axisLabels: Record<AxisKey, { a: string; b: string }> = {
  ai: { a: '分析型', b: '感覚型' },
  sl: { a: '短期型', b: '長期型' },
  rc: { a: '積極型', b: '慎重型' },
  yd: { a: 'システム型', b: '裁量型' },
};

const ShareButton = ({ typeData }: { typeData: TraderTypeData }) => {
  const [copied, setCopied] = useState(false);

  const shareText = `私のトレーダータイプは「${typeData.name}」(${typeData.code}) ！\n${typeData.tagline}\n#あにゃFX #トレーダータイプ診断`;
  const shareUrl =
    typeof window === 'undefined'
      ? ''
      : `https://twitter.com/intent/tweet?${new URLSearchParams({
          text: shareText,
          url: `${window.location.origin}${window.location.pathname}#/tools/trader-quiz`,
        }).toString()}`;

  const handleCopy = () => {
    void navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={shareUrl}
        rel="noopener noreferrer"
        target="_blank"
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/[0.06] px-5 text-sm font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
      >
        Xでシェア
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/[0.04] px-5 text-sm font-bold text-slate-400 ring-1 ring-white/10 transition hover:bg-white/[0.06] hover:text-slate-200"
      >
        {copied ? '✓ コピーしました' : '文面コピー'}
      </button>
    </div>
  );
};

export const TraderQuiz = () => {
  const auth = useDiscordAuth();
  const ownerId = auth.session?.user.id ?? 'guest';
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<AxisKey, string>>>({});
  const [history, setHistory] = useState<QuizResultRecord[]>(() =>
    readQuizHistory(ownerId),
  );

  useEffect(() => {
    const ownHistory = readQuizHistory(ownerId);
    if (auth.isAuthenticated && ownerId !== 'guest') {
      const guestHistory = readQuizHistory('guest');
      if (guestHistory.length > 0) {
        const merged = [...ownHistory, ...guestHistory]
          .filter(
            (record, index, records) =>
              records.findIndex(
                (candidate) =>
                  candidate.typeCode === record.typeCode &&
                  candidate.createdAt === record.createdAt,
              ) === index,
          )
          .sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 20);
        writeQuizHistory(ownerId, merged);
        setHistory(merged);
        return;
      }
    }
    setHistory(ownHistory);
  }, [auth.isAuthenticated, ownerId]);

  const saveResult = (nextAnswers: Partial<Record<AxisKey, string>>) => {
    const typeCode = computeType(nextAnswers as Record<AxisKey, string>);
    const record: QuizResultRecord = {
      id: createId(),
      typeCode,
      answers: nextAnswers,
      createdAt: new Date().toISOString(),
    };
    setHistory((current) => {
      const next = [record, ...current].slice(0, 20);
      writeQuizHistory(ownerId, next);
      return next;
    });
  };

  const handleAnswer = (letter: string) => {
    const q = questions[currentQ];
    const next = { ...answers, [q.axis]: letter };
    setAnswers(next);

    if (currentQ < questions.length - 1) {
      setCurrentQ((n) => n + 1);
    } else {
      saveResult(next);
      setPhase('result');
    }
  };

  const handleRestart = () => {
    setPhase('intro');
    setCurrentQ(0);
    setAnswers({});
  };

  if (phase === 'intro') {
    return (
      <div className="animate-fade-in mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-cyan-300/20 bg-white/[0.035] p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
            Trader Type Quiz
          </p>
          <h1 className="mt-3 text-3xl font-black text-white">トレーダータイプ16診断</h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            12問の質問に答えて、あなたのトレードスタイルを4つの軸で分析。
            16タイプのトレーダー像の中からあなたに近いタイプを診断します。
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: '判断スタイル', desc: '分析型 vs 感覚型' },
              { label: '時間軸', desc: '短期型 vs 長期型' },
              { label: 'リスク管理', desc: '積極型 vs 慎重型' },
              { label: '売買方針', desc: 'システム型 vs 裁量型' },
            ].map((axis) => (
              <div
                key={axis.label}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-3"
              >
                <p className="text-xs font-bold text-cyan-200">{axis.label}</p>
                <p className="mt-1 text-xs text-slate-500">{axis.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-slate-950/50 p-4 text-left">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-white">診断結果の保存</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {auth.isAuthenticated
                    ? 'Discordユーザー別に診断結果を保存します。'
                    : 'ゲスト保存中です。Discordログインすると自分の記録として保存できます。'}
                </p>
              </div>
              {!auth.isAuthenticated && (
                <button
                  type="button"
                  onClick={() => auth.signIn('#/tools/trader-quiz')}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
                >
                  Discordログイン
                </button>
              )}
            </div>
          </div>

          {history.length > 0 && (
            <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-4 text-left">
              <p className="text-sm font-bold text-cyan-100">保存済みの診断</p>
              <div className="mt-3 space-y-2">
                {history.slice(0, 3).map((record) => {
                  const savedType = typeMap.get(record.typeCode);
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/50 p-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          {savedType?.name ?? record.typeCode}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatSavedAt(record.createdAt)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-cyan-100">
                        {record.typeCode}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setPhase('quiz')}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-300 px-8 text-base font-black text-slate-950 transition hover:bg-cyan-200"
          >
            診断スタート →
          </button>
          <p className="mt-4 text-xs text-slate-600">
            全12問 · 結果はこの端末に保存されます
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = questions[currentQ];
    const progress = (currentQ / questions.length) * 100;

    return (
      <div className="animate-fade-in mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {currentQ + 1} / {questions.length}
            </span>
            <button
              type="button"
              onClick={handleRestart}
              className="text-slate-600 transition hover:text-slate-300"
            >
              最初からやり直す
            </button>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-300 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Q{currentQ + 1}
          </p>
          <h2 className="mt-3 text-lg font-bold text-white sm:text-xl">{q.text}</h2>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => handleAnswer(q.optionA.letter)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/20 text-xs font-black text-cyan-200">
                A
              </span>
              {q.optionA.text}
            </button>
            <button
              type="button"
              onClick={() => handleAnswer(q.optionB.letter)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/20 text-xs font-black text-cyan-200">
                B
              </span>
              {q.optionB.text}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeCode = computeType(answers as Record<AxisKey, string>);
  const typeData = typeMap.get(typeCode) ?? traderTypes[0];
  const compatibles = typeData.compatible
    .map((c) => typeMap.get(c))
    .filter(Boolean) as TraderTypeData[];

  const axisOrder: AxisKey[] = ['ai', 'sl', 'rc', 'yd'];
  const axisAnswers = axisOrder.map((axis) => ({
    axis,
    choice: (answers as Record<AxisKey, string>)[axis] ?? '',
    label: (() => {
      const a = axisLabels[axis];
      const choice = (answers as Record<AxisKey, string>)[axis];
      if (axis === 'ai') return choice === 'A' ? a.a : a.b;
      if (axis === 'sl') return choice === 'S' ? a.a : a.b;
      if (axis === 'rc') return choice === 'R' ? a.a : a.b;
      return choice === 'Y' ? a.a : a.b;
    })(),
  }));

  return (
    <div className="animate-fade-in mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="space-y-5">
        <div className="rounded-2xl border border-cyan-300/20 bg-white/[0.035] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
            Your Type · {typeData.code}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-4xl">{typeData.emoji}</span>
            <div>
              <h2 className="text-2xl font-black text-white">{typeData.name}</h2>
              <p className="mt-0.5 text-sm text-slate-400">{typeData.tagline}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-400">{typeData.description}</p>

          <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/50 p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-white">この結果を保存しました</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {auth.isAuthenticated
                    ? 'Discordユーザー別の診断履歴に保存されています。'
                    : 'ゲスト履歴に保存されています。Discordログインすると次回以降も自分の記録として管理できます。'}
                </p>
              </div>
              {!auth.isAuthenticated && (
                <button
                  type="button"
                  onClick={() => auth.signIn('#/tools/trader-quiz')}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
                >
                  Discordログイン
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {axisAnswers.map(({ axis, label }) => (
              <div
                key={axis}
                className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-3 text-center"
              >
                <p className="text-xs font-bold text-cyan-200">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
              Strengths
            </p>
            <ul className="mt-3 space-y-2">
              {typeData.strengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-rose-300/20 bg-rose-300/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-200">
              Weaknesses
            </p>
            <ul className="mt-3 space-y-2">
              {typeData.weaknesses.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 shrink-0 text-rose-400">△</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
            Recommended Style
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {typeData.recommendedStyle}
          </p>
        </div>

        {compatibles.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Compatible Types
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {compatibles.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2"
                >
                  <span>{c.emoji}</span>
                  <span className="text-sm font-bold text-white">{c.name}</span>
                  <span className="text-xs text-slate-500">{c.code}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Saved Results
            </p>
            <div className="mt-3 grid gap-2">
              {history.slice(0, 5).map((record) => {
                const savedType = typeMap.get(record.typeCode);
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/50 p-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">
                        {savedType?.name ?? record.typeCode}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatSavedAt(record.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-cyan-100">
                      {record.typeCode}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <ShareButton typeData={typeData} />
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/[0.04] px-5 text-sm font-bold text-slate-400 ring-1 ring-white/10 transition hover:bg-white/[0.06] hover:text-slate-200"
          >
            もう一度診断する
          </button>
        </div>
      </div>
    </div>
  );
};
