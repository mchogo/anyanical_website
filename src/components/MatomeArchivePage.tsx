import { formatMonthLabel, useMatomeEntries } from '../hooks/useMatomeEntries';
import { MatomeEntryList } from './MatomeEntryList';

const shiftYm = (ym: string, delta: number): string => {
  const [yearStr, monthStr] = ym.split('-');
  const zeroIndexed = Number(yearStr) * 12 + (Number(monthStr) - 1) + delta;
  const year = Math.floor(zeroIndexed / 12);
  const month = (zeroIndexed % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
};

export const MatomeArchivePage = ({ ym }: { ym: string }) => {
  const [yearStr, monthStr] = ym.split('-');
  const state = useMatomeEntries(Number(yearStr), Number(monthStr));

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <a
        href="#/matome"
        className="text-xs font-bold text-cyan-200 underline decoration-cyan-300/30 underline-offset-4 hover:text-cyan-100"
      >
        ← 最新のまとめへ戻る
      </a>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
        SNS Matome Archive
      </p>
      <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
        {formatMonthLabel(ym)}のまとめ
      </h1>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
        <a
          href={`#/matome/archive/${shiftYm(ym, -1)}`}
          className="inline-flex min-h-9 items-center justify-center rounded-full bg-white/[0.06] px-4 text-xs font-bold text-white ring-1 ring-white/15 transition hover:bg-white/10"
        >
          ← 前月
        </a>
        <p className="font-black text-white">{formatMonthLabel(ym)}</p>
        <a
          href={`#/matome/archive/${shiftYm(ym, 1)}`}
          className="inline-flex min-h-9 items-center justify-center rounded-full bg-white/[0.06] px-4 text-xs font-bold text-white ring-1 ring-white/15 transition hover:bg-white/10"
        >
          翌月 →
        </a>
      </div>

      <div className="mt-6">
        {state.phase === 'loading' ? (
          <p className="py-10 text-center text-sm text-slate-500">読み込み中…</p>
        ) : state.phase === 'error' ? (
          <p className="py-10 text-center text-sm text-slate-500">
            まとめを取得できませんでした。時間をおいて再度お試しください。
          </p>
        ) : state.entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            この月のまとめはありません。
          </p>
        ) : (
          <MatomeEntryList entries={state.entries} />
        )}
      </div>

      <p className="mt-10 text-center text-xs leading-5 text-slate-600">
        本ページは話題になった投稿の紹介とあにゃの個人的な感想であり、投資助言ではありません。掲載内容に誤りや削除依頼がある場合はDiscordの運営窓口までご連絡ください。
      </p>
    </main>
  );
};
