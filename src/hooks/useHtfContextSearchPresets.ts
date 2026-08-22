import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_FILTERS,
  filtersEqual,
  normalizeFiltersInput,
  type HtfSearchFilters,
} from '../utils/htfContextFilters';
import type { DiscordAuthSession } from './useDiscordAuth';

export type HtfSearchPreset = {
  id: string;
  name: string;
  filters: HtfSearchFilters;
  schemaVersion: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

// 旧端末ローカル保存（サーバー保存導入前のHtfContextSearchSection.tsxが使っていた形式）。
// サーバー保存を正本にする移行後は、初回ログイン時に1回だけサーバーへ取り込みを試みる。
const LEGACY_STORAGE_KEY = 'htf-context-search-filters';
const LEGACY_IMPORTED_FLAG_KEY = 'htf-context-search-filters-imported';
const LEGACY_IMPORTED_PRESET_NAME = '以前の端末保存条件';

type RawPreset = {
  id: string;
  name: string;
  filters: unknown;
  schemaVersion: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

const toPreset = (raw: RawPreset): HtfSearchPreset => ({
  id: raw.id,
  name: raw.name,
  filters: normalizeFiltersInput(raw.filters),
  schemaVersion: raw.schemaVersion,
  isDefault: raw.isDefault,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

const authHeaders = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

type UseHtfContextSearchPresetsResult = {
  presets: HtfSearchPreset[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  statusMessage: string | null;
  refresh: () => void;
  createPreset: (
    name: string,
    filters: HtfSearchFilters,
  ) => Promise<HtfSearchPreset | null>;
  updatePreset: (
    id: string,
    patch: { name?: string; filters?: HtfSearchFilters },
  ) => Promise<boolean>;
  deletePreset: (id: string) => Promise<boolean>;
  setDefaultPreset: (id: string) => Promise<boolean>;
};

// 検索条件プリセットをDiscordアカウントに紐づけてサーバー(D1)へ保存するhook。
// サーバー側を正本とし、同じDiscordアカウントでログインしたどの端末からも同じプリセットが見える。
// 旧localStorage形式（端末ローカル保存時代の名残）は、ログイン後に1回だけサーバーへ取り込む。
export const useHtfContextSearchPresets = (
  session: DiscordAuthSession | null,
  canAccessPremium: boolean,
): UseHtfContextSearchPresetsResult => {
  const [presets, setPresets] = useState<HtfSearchPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // 古いfetch応答が新しい状態を上書きしないよう、常に「最新のリクエスト」だけ状態反映する。
  const latestRequestId = useRef(0);
  const migrationAttempted = useRef(false);
  const accessToken = session?.accessToken;

  const announce = useCallback((message: string) => {
    setStatusMessage(message);
    window.setTimeout(
      () => setStatusMessage((prev) => (prev === message ? null : prev)),
      3000,
    );
  }, []);

  const fetchPresets = useCallback(async (): Promise<HtfSearchPreset[] | null> => {
    if (!accessToken) return null;
    const res = await fetch('/api/htf-context/search-presets', {
      headers: authHeaders(accessToken),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { presets: RawPreset[] };
    return Array.isArray(data.presets) ? data.presets.map(toPreset) : [];
  }, [accessToken]);

  // ログイン済みかつ未取込の場合のみ、旧localStorage条件をサーバーへ1回だけ取り込む。
  const migrateLegacyLocalStorage = useCallback(
    async (currentPresets: HtfSearchPreset[]) => {
      if (!accessToken || migrationAttempted.current) return;
      migrationAttempted.current = true;

      let legacyRaw: string | null;
      try {
        legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      } catch {
        return;
      }
      if (!legacyRaw) return;
      if (localStorage.getItem(LEGACY_IMPORTED_FLAG_KEY) === '1') {
        try {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          // ignore
        }
        return;
      }

      let legacyFilters: HtfSearchFilters;
      try {
        legacyFilters = normalizeFiltersInput(JSON.parse(legacyRaw));
      } catch {
        // 壊れた旧データはクラッシュさせず、取込を諦めてフラグだけ立てる
        try {
          localStorage.setItem(LEGACY_IMPORTED_FLAG_KEY, '1');
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          // ignore
        }
        return;
      }

      const alreadyPresent = currentPresets.some((p) =>
        filtersEqual(p.filters, legacyFilters),
      );
      if (alreadyPresent) {
        try {
          localStorage.setItem(LEGACY_IMPORTED_FLAG_KEY, '1');
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          // ignore
        }
        return;
      }

      try {
        const res = await fetch('/api/htf-context/search-presets', {
          method: 'POST',
          headers: authHeaders(accessToken),
          body: JSON.stringify({
            name: LEGACY_IMPORTED_PRESET_NAME,
            filters: legacyFilters,
          }),
        });
        if (!res.ok) return; // 保存できなければ旧データは残す（次回また試す）
        const created = toPreset((await res.json()) as RawPreset);
        setPresets((prev) => [...prev, created]);
        localStorage.setItem(LEGACY_IMPORTED_FLAG_KEY, '1');
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        announce('以前の端末保存条件をアカウントへ取り込みました');
      } catch {
        // 通信失敗時は何もしない。旧データを残したまま、次回ログイン時に再試行される
      }
    },
    [accessToken, announce],
  );

  useEffect(() => {
    if (!canAccessPremium || !accessToken) {
      setPresets([]);
      return;
    }
    const requestId = ++latestRequestId.current;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchPresets()
      .then((result) => {
        if (cancelled || requestId !== latestRequestId.current || result === null) return;
        setPresets(result);
        void migrateLegacyLocalStorage(result);
      })
      .catch(() => {
        if (cancelled || requestId !== latestRequestId.current) return;
        setError('検索条件プリセットを取得できませんでした');
      })
      .finally(() => {
        if (cancelled || requestId !== latestRequestId.current) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, canAccessPremium, reloadToken]);

  const refresh = useCallback(() => setReloadToken((v) => v + 1), []);

  const createPreset = useCallback(
    async (name: string, filters: HtfSearchFilters): Promise<HtfSearchPreset | null> => {
      if (!accessToken) return null;
      setIsMutating(true);
      try {
        const res = await fetch('/api/htf-context/search-presets', {
          method: 'POST',
          headers: authHeaders(accessToken),
          body: JSON.stringify({ name, filters }),
        });
        if (!res.ok) {
          announce('保存に失敗しました');
          return null;
        }
        const created = toPreset((await res.json()) as RawPreset);
        setPresets((prev) => [...prev, created]);
        announce('この条件を保存しました');
        return created;
      } catch {
        announce('保存に失敗しました（通信エラー）');
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [accessToken, announce],
  );

  const updatePreset = useCallback(
    async (
      id: string,
      patch: { name?: string; filters?: HtfSearchFilters },
    ): Promise<boolean> => {
      if (!accessToken) return false;
      const previous = presets;
      // 楽観的更新: 失敗時はロールバックする
      setPresets((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name: patch.name ?? p.name,
                filters: patch.filters ?? p.filters,
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      );
      setIsMutating(true);
      try {
        const res = await fetch(`/api/htf-context/search-presets/${id}`, {
          method: 'PUT',
          headers: authHeaders(accessToken),
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          setPresets(previous);
          announce('更新に失敗しました');
          return false;
        }
        const { updatedAt } = (await res.json()) as { updatedAt?: string };
        if (updatedAt) {
          setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, updatedAt } : p)));
        }
        announce('更新しました');
        return true;
      } catch {
        setPresets(previous);
        announce('更新に失敗しました（通信エラー）');
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [accessToken, announce, presets],
  );

  const deletePreset = useCallback(
    async (id: string): Promise<boolean> => {
      if (!accessToken) return false;
      const previous = presets;
      setPresets((prev) => prev.filter((p) => p.id !== id));
      setIsMutating(true);
      try {
        const res = await fetch(`/api/htf-context/search-presets/${id}`, {
          method: 'DELETE',
          headers: authHeaders(accessToken),
        });
        if (!res.ok) {
          setPresets(previous);
          announce('削除に失敗しました');
          return false;
        }
        announce('削除しました');
        return true;
      } catch {
        setPresets(previous);
        announce('削除に失敗しました（通信エラー）');
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [accessToken, announce, presets],
  );

  const setDefaultPreset = useCallback(
    async (id: string): Promise<boolean> => {
      if (!accessToken) return false;
      const previous = presets;
      setPresets((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));
      setIsMutating(true);
      try {
        const res = await fetch(`/api/htf-context/search-presets/${id}/default`, {
          method: 'PUT',
          headers: authHeaders(accessToken),
        });
        if (!res.ok) {
          setPresets(previous);
          announce('既定設定に失敗しました');
          return false;
        }
        announce('既定プリセットを更新しました');
        return true;
      } catch {
        setPresets(previous);
        announce('既定設定に失敗しました（通信エラー）');
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [accessToken, announce, presets],
  );

  return {
    presets,
    isLoading,
    isMutating,
    error,
    statusMessage,
    refresh,
    createPreset,
    updatePreset,
    deletePreset,
    setDefaultPreset,
  };
};

export const HTF_SEARCH_PRESET_DEFAULT_FILTERS = DEFAULT_FILTERS;
