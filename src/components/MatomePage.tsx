import {
  formatDateLabel,
  formatMonthLabel,
  useLatestMatomeEntries,
  useMatomeArchiveMonths,
} from '../hooks/useMatomeEntries';
import { MatomeEntryList } from './MatomeEntryList';

const LATEST_LIMIT = 10;

export const MatomePage = () => {
  const state = useLatestMatomeEntries(LATEST_LIMIT);
  const monthsState = useMatomeArchiveMonths();

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
        SNS Matome
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          あにゃの相場SNS話題まとめ
        </h1>
        {state.phase === 'ready' && state.entries.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200 ring-1 ring-cyan-300/25">
            定期更新・最終更新 {formatDateLabel(state.entries[0].entryDate)}
          </span>
        )}
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
        Xで話題になったトレード関連の投稿を、あにゃが毎日ピックアップして毒舌気味にツッコミます。新しいものから順に並んでいます。個人の見解・感想であり、特定の投稿や投稿者の主張を裏付ける・断定するものではありません。投資判断はご自身で行ってください。
      </p>

      {monthsState.phase === 'ready' && monthsState.months.length > 0 && (
        <button
          type="button"
          onClick={() =>
            document
              .getElementById('matome-archive-section')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          className="mt-3 text-xs font-bold text-cyan-200 underline decoration-cyan-300/30 underline-offset-4 hover:text-cyan-100"
        >
          過去のまとめを見る ↓
        </button>
      )}

      <div className="mt-8">
        {state.phase === 'loading' ? (
          <p className="py-10 text-center text-sm text-slate-500">読み込み中…</p>
        ) : state.phase === 'error' ? (
          <p className="py-10 text-center text-sm text-slate-500">
            まとめを取得できませんでした。時間をおいて再度お試しください。
          </p>
        ) : state.entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            まとめはまだありません。
          </p>
        ) : (
          <MatomeEntryList entries={state.entries} />
        )}
      </div>

      {monthsState.phase === 'ready' && monthsState.months.length > 0 && (
        <div
          id="matome-archive-section"
          className="mt-10 scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
        >
          <p className="text-sm font-bold text-slate-300">過去のまとめ</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {monthsState.months.map((m) => (
              <a
                key={m.ym}
                href={`#/matome/archive/${m.ym}`}
                className="inline-flex min-h-9 items-center justify-center rounded-full bg-white/[0.06] px-4 text-xs font-bold text-slate-200 ring-1 ring-white/15 transition hover:bg-cyan-300/10 hover:text-cyan-100"
              >
                {formatMonthLabel(m.ym)}のまとめ（{m.count}件）
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="mt-10 text-center text-xs leading-5 text-slate-600">
        本ページは話題になった投稿の紹介とあにゃの個人的な感想であり、投資助言ではありません。掲載内容に誤りや削除依頼がある場合はDiscordの運営窓口までご連絡ください。
      </p>
    </main>
  );
};
