import { useCallback, useEffect, useRef, useState } from 'react';

import { HTF_CONTEXT_DEFAULT_FAVORITES } from '../config/htfContextSymbols';
import type { DiscordAuthSession } from './useDiscordAuth';

type UseHtfContextFavoritesResult = {
  favorites: string[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  statusMessage: string | null;
  toggleFavorite: (symbol: string) => void;
  retry: () => void;
};

// Anyanical Market Dashboardの銘柄お気に入り。/api/htf-context/favorites にDiscordユーザーIDで
// 紐づけて保存する（この端末だけでなく、同じDiscordアカウントでログインしたどの端末でも共有される）。
// 未設定の新規ユーザーには既定のお気に入り(HTF_CONTEXT_DEFAULT_FAVORITES)をサーバー側が返す。
//
// 保存は楽観的更新（即座に画面反映してからPUT）にしているが、次を守る:
// - saveId方式で「最後に発火した保存」だけを正とし、古いPUT応答が新しい状態を上書きしない
// - 失敗時は直前の状態へロールバックし、aria-live経由で通知する
// - isLoading中は初回取得結果で上書きされる前提の値であることを呼び出し側が判断できるようにする
export const useHtfContextFavorites = (
  session: DiscordAuthSession | null,
  canAccessPremium: boolean,
): UseHtfContextFavoritesResult => {
  const [favorites, setFavorites] = useState<string[]>(HTF_CONTEXT_DEFAULT_FAVORITES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const accessToken = session?.accessToken;
  const latestSaveId = useRef(0);

  const announce = useCallback((message: string) => {
    setStatusMessage(message);
    window.setTimeout(
      () => setStatusMessage((prev) => (prev === message ? null : prev)),
      3000,
    );
  }, []);

  useEffect(() => {
    if (!canAccessPremium || !accessToken) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetch('/api/htf-context/favorites', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ favorites: string[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
      })
      .catch(() => {
        if (cancelled) return;
        setError('お気に入りを取得できませんでした');
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, canAccessPremium]);

  const saveFavorites = useCallback(
    (next: string[], rollbackTo: string[]) => {
      if (!accessToken) return;
      const saveId = ++latestSaveId.current;
      setIsSaving(true);
      fetch('/api/htf-context/favorites', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ favorites: next }),
      })
        .then((res) => {
          if (saveId !== latestSaveId.current) return; // 古い応答は無視（新しい状態を巻き戻さない）
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setIsSaving(false);
        })
        .catch(() => {
          if (saveId !== latestSaveId.current) return;
          setFavorites(rollbackTo);
          setIsSaving(false);
          announce('お気に入りの保存に失敗しました');
        });
    },
    [accessToken, announce],
  );

  const toggleFavorite = useCallback(
    (symbol: string) => {
      setFavorites((prev) => {
        const next = prev.includes(symbol)
          ? prev.filter((s) => s !== symbol)
          : [...prev, symbol];
        saveFavorites(next, prev);
        return next;
      });
    },
    [saveFavorites],
  );

  const retry = useCallback(() => {
    saveFavorites(favorites, favorites);
  }, [favorites, saveFavorites]);

  return { favorites, isLoading, isSaving, error, statusMessage, toggleFavorite, retry };
};
