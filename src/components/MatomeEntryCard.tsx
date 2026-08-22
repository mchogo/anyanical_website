import { useRef, useState } from 'react';

import type { MatomeEntry } from '../hooks/useMatomeEntries';
import { XPostEmbed } from './XPostEmbed';

const ANYA_AVATAR_SRC = '/cBKP4W4-_400x400.jpg';

const AnyaAvatar = () => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-300/15 text-lg">
        🐾
      </span>
    );
  }

  return (
    <img
      src={ANYA_AVATAR_SRC}
      alt="あにゃ"
      className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-cyan-300/30"
      onError={() => setFailed(true)}
    />
  );
};

// 匿名の軽いリアクション。多重投票の厳密な防止はサーバー側で行わず、
// 同一ブラウザからの連打だけをlocalStorageで防ぐ想定。
const REACTED_STORAGE_KEY = 'matome-reacted-ids';

const getReactedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(REACTED_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === 'string')
        : [],
    );
  } catch {
    return new Set();
  }
};

const setReactedIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(REACTED_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorageが使えなくても機能自体は継続する
  }
};

const markReacted = (id: string) => {
  const ids = getReactedIds();
  ids.add(id);
  setReactedIds(ids);
};

const unmarkReacted = (id: string) => {
  const ids = getReactedIds();
  ids.delete(id);
  setReactedIds(ids);
};

const ReactionButton = ({
  entryId,
  initialCount,
}: {
  entryId: string;
  initialCount: number;
}) => {
  const [count, setCount] = useState(initialCount);
  const [reacted, setReacted] = useState(() => getReactedIds().has(entryId));
  const [isSaving, setIsSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const latestRequestId = useRef(0);

  const handleClick = () => {
    if (reacted || isSaving) return;

    const requestId = ++latestRequestId.current;
    setReacted(true);
    setCount((c) => c + 1);
    setFailed(false);
    setIsSaving(true);
    markReacted(entryId);

    fetch(`/api/matome/entries/${entryId}/react`, { method: 'POST' })
      .then((res) => {
        if (requestId !== latestRequestId.current) return null;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ reactionCount: number }>;
      })
      .then((data) => {
        if (requestId !== latestRequestId.current || !data) return;
        setCount(data.reactionCount);
        setIsSaving(false);
      })
      .catch(() => {
        if (requestId !== latestRequestId.current) return;
        // 楽観的に加算していたカウント・反応済み状態・localStorageの記録を戻し、再試行できるようにする
        setReacted(false);
        setCount((c) => c - 1);
        unmarkReacted(entryId);
        setIsSaving(false);
        setFailed(true);
      });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={reacted || isSaving}
        aria-label={
          failed ? 'いいねの送信に失敗しました。もう一度押してください' : undefined
        }
        className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition disabled:cursor-default ${
          reacted
            ? 'bg-cyan-300/15 text-cyan-200 ring-1 ring-cyan-300/30'
            : failed
              ? 'bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/30 hover:bg-rose-400/20'
              : 'bg-white/[0.06] text-slate-300 ring-1 ring-white/15 hover:bg-cyan-300/10 hover:text-cyan-100'
        }`}
      >
        👍 {count}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {failed ? 'いいねの送信に失敗しました。もう一度お試しください' : ''}
      </span>
      {failed && (
        <p className="text-[11px] text-rose-300">
          送信に失敗しました。再度押してください
        </p>
      )}
    </div>
  );
};

export const MatomeEntryCard = ({ entry }: { entry: MatomeEntry }) => (
  <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
    <h2 className="text-lg font-black leading-snug text-white">{entry.headline}</h2>

    <div className="mt-3 flex justify-center overflow-hidden rounded-xl">
      <XPostEmbed url={entry.sourceUrl} />
    </div>

    <div className="mt-4 flex items-start gap-3 border-t border-white/10 pt-4">
      <AnyaAvatar />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-cyan-200">あにゃ</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-300">
          {entry.commentary}
        </p>
      </div>
    </div>

    <div className="mt-3 flex justify-end">
      <ReactionButton entryId={entry.id} initialCount={entry.reactionCount} />
    </div>
  </article>
);
