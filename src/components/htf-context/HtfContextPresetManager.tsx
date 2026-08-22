import { useState } from 'react';

import type { HtfSearchPreset } from '../../hooks/useHtfContextSearchPresets';

const buttonClass =
  'inline-flex min-h-9 items-center justify-center rounded-full bg-white/[0.04] px-3.5 text-xs font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-40';

const inputClass =
  'min-h-9 flex-1 rounded-full bg-white/[0.06] px-3.5 text-sm text-white ring-1 ring-white/10 placeholder:text-slate-600 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300';

export const HtfContextPresetManager = ({
  presets,
  selectedPresetId,
  isMutating,
  statusMessage,
  onApplyPresetId,
  onCreatePreset,
  onOverwritePreset,
  onRenamePreset,
  onDeletePreset,
  onSetDefaultPreset,
  onRefresh,
  onResetFilters,
}: {
  presets: HtfSearchPreset[];
  selectedPresetId: string | null;
  isMutating: boolean;
  statusMessage: string | null;
  onApplyPresetId: (id: string | null) => void;
  onCreatePreset: (name: string) => void;
  onOverwritePreset: () => void;
  onRenamePreset: (id: string, name: string) => void;
  onDeletePreset: (id: string) => void;
  onSetDefaultPreset: (id: string) => void;
  onRefresh: () => void;
  onResetFilters: () => void;
}) => {
  const [creatingName, setCreatingName] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedPreset = presets.find((p) => p.id === selectedPresetId) ?? null;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-500">プリセット</p>
        <span role="status" aria-live="polite" className="text-xs text-emerald-300">
          {statusMessage}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor="htf-preset-select" className="sr-only">
          適用するプリセットを選択
        </label>
        <select
          id="htf-preset-select"
          value={selectedPresetId ?? ''}
          onChange={(e) => onApplyPresetId(e.target.value || null)}
          className="min-h-9 flex-1 rounded-full bg-white/[0.06] px-3.5 text-sm text-white ring-1 ring-white/10 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          <option value="">（プリセット未選択・今の条件のみ）</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.isDefault ? '★ ' : ''}
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isMutating}
          className={buttonClass}
          title="サーバーから再読込"
        >
          🔁
        </button>
      </div>

      {creatingName !== null ? (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = creatingName.trim();
            if (!trimmed) return;
            onCreatePreset(trimmed);
            setCreatingName(null);
          }}
        >
          <label htmlFor="htf-preset-new-name" className="sr-only">
            新しいプリセットの名前
          </label>
          <input
            id="htf-preset-new-name"
            type="text"
            autoFocus
            value={creatingName}
            onChange={(e) => setCreatingName(e.target.value)}
            placeholder="プリセット名（例: 上位足チェック用）"
            maxLength={50}
            className={inputClass}
          />
          <button type="submit" disabled={isMutating} className={buttonClass}>
            保存
          </button>
          <button
            type="button"
            onClick={() => setCreatingName(null)}
            className={buttonClass}
          >
            キャンセル
          </button>
        </form>
      ) : renamingName !== null && selectedPreset ? (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = renamingName.trim();
            if (!trimmed) return;
            onRenamePreset(selectedPreset.id, trimmed);
            setRenamingName(null);
          }}
        >
          <label htmlFor="htf-preset-rename" className="sr-only">
            プリセットの新しい名前
          </label>
          <input
            id="htf-preset-rename"
            type="text"
            autoFocus
            value={renamingName}
            onChange={(e) => setRenamingName(e.target.value)}
            maxLength={50}
            className={inputClass}
          />
          <button type="submit" disabled={isMutating} className={buttonClass}>
            変更
          </button>
          <button
            type="button"
            onClick={() => setRenamingName(null)}
            className={buttonClass}
          >
            キャンセル
          </button>
        </form>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCreatingName('')}
            disabled={isMutating}
            className={buttonClass}
          >
            💾 新しい条件として保存
          </button>
          {selectedPreset && (
            <button
              type="button"
              onClick={onOverwritePreset}
              disabled={isMutating}
              className={buttonClass}
            >
              上書き保存
            </button>
          )}
          <button type="button" onClick={onResetFilters} className={buttonClass}>
            🔄 条件をリセット
          </button>

          {selectedPreset && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                className={buttonClass}
              >
                ⋯ その他
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-10 mt-1 min-w-[10rem] rounded-lg border border-white/10 bg-slate-900 p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingName(selectedPreset.name);
                      setMenuOpen(false);
                    }}
                    className="block w-full rounded px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/10"
                  >
                    名前変更
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSetDefaultPreset(selectedPreset.id);
                      setMenuOpen(false);
                    }}
                    disabled={selectedPreset.isDefault}
                    className="block w-full rounded px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/10 disabled:opacity-40"
                  >
                    既定に設定
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingDeleteId(selectedPreset.id);
                      setMenuOpen(false);
                    }}
                    className="block w-full rounded px-3 py-2 text-left text-xs text-rose-300 hover:bg-white/10"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {confirmingDeleteId && (
        <div className="mt-3 rounded-lg border border-rose-300/30 bg-rose-300/[0.06] p-3 text-xs">
          <p className="text-rose-200">このプリセットを削除しますか？元に戻せません。</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onDeletePreset(confirmingDeleteId);
                setConfirmingDeleteId(null);
              }}
              className="inline-flex min-h-8 items-center justify-center rounded-full bg-rose-400 px-3.5 text-xs font-bold text-slate-950 hover:bg-rose-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              削除する
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDeleteId(null)}
              className={buttonClass}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
