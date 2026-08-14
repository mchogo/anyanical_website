import { useState } from 'react';

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
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

const markReacted = (id: string) => {
  const ids = getReactedIds();
  ids.add(id);
  try {
    localStorage.setItem(REACTED_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorageが使えなくても機能自体は継続する
  }
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

  const handleClick = () => {
    if (reacted) return;
    setReacted(true);
    setCount((c) => c + 1);
    markReacted(entryId);
    fetch(`/api/matome/entries/${entryId}/react`, { method: 'POST' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { reactionCount: number } | null) => {
        if (data) setCount(data.reactionCount);
      })
      .catch(() => {
        // 反映に失敗してもUI上は反応済みのままにする（連打防止を優先）
      });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={reacted}
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition disabled:cursor-default ${
        reacted
          ? 'bg-cyan-300/15 text-cyan-200 ring-1 ring-cyan-300/30'
          : 'bg-white/[0.06] text-slate-300 ring-1 ring-white/15 hover:bg-cyan-300/10 hover:text-cyan-100'
      }`}
    >
      👍 {count}
    </button>
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
