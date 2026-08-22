import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { DiscordAuthSession } from './useDiscordAuth';

const LS_KEY = 'wmb.favorites';

const readLocal = (): string[] => {
  try {
    const v = localStorage.getItem(LS_KEY);
    const parsed: unknown = v ? JSON.parse(v) : [];
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
};

const writeLocal = (next: string[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    // 端末側の保存に失敗しても(プライベートブラウズ時の容量制限等)、
    // 画面上の状態自体は保つ。プレミアムであればサーバー側が正本になる。
  }
};

export type FavoritesContextValue = {
  favorites: string[];
  canAccessPremium: boolean;
  isAuthenticated: boolean;
  toggleFavorite: (route: string) => void;
  isSaving: boolean;
  saveError: boolean;
  statusMessage: string | null;
  retry: () => void;
};

export const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  canAccessPremium: false,
  isAuthenticated: false,
  toggleFavorite: () => {},
  isSaving: false,
  saveError: false,
  statusMessage: null,
  retry: () => {},
});

export const useFavoritesContext = () => useContext(FavoritesContext);

export const useFavorites = (
  session: DiscordAuthSession | null,
  canAccessPremium: boolean,
  isAuthenticated: boolean,
): FavoritesContextValue => {
  const [favorites, setFavorites] = useState<string[]>(readLocal);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const accessToken = session?.accessToken;
  const latestSaveId = useRef(0);
  const lastAttempt = useRef<{ next: string[]; rollbackTo: string[] } | null>(null);

  const announce = useCallback((message: string) => {
    setStatusMessage(message);
    window.setTimeout(
      () => setStatusMessage((prev) => (prev === message ? null : prev)),
      3000,
    );
  }, []);

  // サーバー側(プレミアム)を正本として起動時に読み込む。取得中にtoggleFavoriteが
  // 呼ばれていた場合はこの初期ロードで上書きしないよう、saveIdでガードする。
  useEffect(() => {
    if (!canAccessPremium || !accessToken) return;
    let cancelled = false;
    const saveId = ++latestSaveId.current;
    fetch('/api/favorites', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ favorites: unknown }>;
      })
      .then((data) => {
        if (cancelled || saveId !== latestSaveId.current) return;
        const remote = Array.isArray(data.favorites)
          ? data.favorites.filter((x): x is string => typeof x === 'string')
          : [];
        setFavorites(remote);
        writeLocal(remote);
      })
      .catch(() => {
        // 初回取得の失敗はローカル保存分のままにしておく(致命的ではない)。
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, canAccessPremium]);

  const saveFavorites = useCallback(
    (next: string[], rollbackTo: string[]) => {
      lastAttempt.current = { next, rollbackTo };
      writeLocal(next);
      if (!canAccessPremium || !accessToken) return;

      const saveId = ++latestSaveId.current;
      setIsSaving(true);
      setSaveError(false);
      fetch('/api/favorites', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ favorites: next }),
      })
        .then((res) => {
          if (saveId !== latestSaveId.current) return; // 古い応答は無視(新しい状態を巻き戻さない)
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setIsSaving(false);
        })
        .catch(() => {
          if (saveId !== latestSaveId.current) return;
          setFavorites(rollbackTo);
          writeLocal(rollbackTo);
          setIsSaving(false);
          setSaveError(true);
          announce('お気に入りの保存に失敗しました。もう一度お試しください');
        });
    },
    [accessToken, canAccessPremium, announce],
  );

  const toggleFavorite = useCallback(
    (route: string) => {
      setFavorites((prev) => {
        const next = prev.includes(route)
          ? prev.filter((r) => r !== route)
          : [...prev, route];
        saveFavorites(next, prev);
        return next;
      });
    },
    [saveFavorites],
  );

  const retry = useCallback(() => {
    if (!lastAttempt.current) return;
    const { next, rollbackTo } = lastAttempt.current;
    setFavorites(next);
    saveFavorites(next, rollbackTo);
  }, [saveFavorites]);

  return {
    favorites,
    canAccessPremium,
    isAuthenticated,
    toggleFavorite,
    isSaving,
    saveError,
    statusMessage,
    retry,
  };
};
