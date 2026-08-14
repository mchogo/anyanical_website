import { formatDateLabel, useMatomeEntry } from '../hooks/useMatomeEntries';
import { MatomeEntryCard } from './MatomeEntryCard';

export const MatomeEntryPage = ({ entryId }: { entryId: string }) => {
  const state = useMatomeEntry(entryId);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <a
        href="#/matome"
        className="text-xs font-bold text-cyan-200 underline decoration-cyan-300/30 underline-offset-4 hover:text-cyan-100"
      >
        ← 最新のまとめへ戻る
      </a>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
        SNS Matome Detail
      </p>

      {state.phase === 'loading' ? (
        <p className="py-10 text-center text-sm text-slate-500">読み込み中…</p>
      ) : state.phase === 'error' ? (
        <p className="py-10 text-center text-sm text-slate-500">
          まとめを取得できませんでした。時間をおいて再度お試しください。
        </p>
      ) : state.phase === 'not-found' ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-center">
          <h1 className="text-2xl font-black text-white">まとめが見つかりません</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            削除済み、またはリンクが古い可能性があります。最新一覧か月別アーカイブから探してください。
          </p>
          <a
            href="#/matome"
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
          >
            SNS話題まとめへ
          </a>
        </div>
      ) : (
        <>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
            {state.entry.headline}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
            <span>{formatDateLabel(state.entry.entryDate)}</span>
            <a
              href={`#/matome/archive/${state.entry.entryDate.slice(0, 7)}`}
              className="text-cyan-200 underline decoration-cyan-300/30 underline-offset-4 hover:text-cyan-100"
            >
              この月のまとめを見る
            </a>
          </div>
          <div className="mt-6">
            <MatomeEntryCard entry={state.entry} />
          </div>
        </>
      )}
    </main>
  );
};
