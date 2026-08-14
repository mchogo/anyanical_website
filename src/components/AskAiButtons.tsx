// NewMatch(newmatch.app)の「ASK AI」ボタンと同じ方式。各AIサービスへ
// 質問文をURLパラメータで渡す。ChatGPT/Perplexityはネイティブにプリフィルされる。
// Claude/GeminiはWeb版のURLプリフィルが公式サポートされていないため、リンク先は
// 開くがテキスト欄への自動入力は保証されない（NewMatch側も同じ実装だったため踏襲）。

type AskAiTarget = {
  label: string;
  icon: string;
  buildUrl: (prompt: string) => string;
};

const ASK_AI_TARGETS: AskAiTarget[] = [
  {
    label: 'ChatGPTに聞く',
    icon: '💬',
    buildUrl: (prompt) =>
      `https://chatgpt.com/?hints=search&q=${encodeURIComponent(prompt)}`,
  },
  {
    label: 'Geminiに聞く',
    icon: '✨',
    buildUrl: (prompt) => `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}`,
  },
  {
    label: 'Claudeに聞く',
    icon: '🔶',
    buildUrl: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    label: 'Perplexityに聞く',
    icon: '🔎',
    buildUrl: (prompt) =>
      `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
  },
];

export const AskAiButtons = ({ prompt }: { prompt: string }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {ASK_AI_TARGETS.map((target) => (
      <a
        key={target.label}
        href={target.buildUrl(prompt)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-slate-950 shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5 hover:bg-slate-100"
      >
        <span aria-hidden="true">{target.icon}</span>
        {target.label}
      </a>
    ))}
  </div>
);
