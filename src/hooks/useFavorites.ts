import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { DiscordAuthSession } from './useDiscordAuth';

const LS_KEY = 'wmb.favorites';

const readLocal = (): string[] => {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v ? (JSON.parse(v) as string[]) : [];
  } catch {
    return [];
  }
};

export type FavoritesContextValue = {
  favorites: string[];
  canAccessPremium: boolean;
  toggleFavorite: (route: string) => void;
};

export const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  canAccessPremium: false,
  toggleFavorite: () => {},
});

export const useFavoritesContext = () => useContext(FavoritesContext);

export const useFavorites = (
  session: DiscordAuthSession | null,
  canAccessPremium: boolean,
): FavoritesContextValue => {
  const [favorites, setFavorites] = useState<string[]>(readLocal);

  // Load from server on mount when premium
  useEffect(() => {
    if (!canAccessPremium || !session?.accessToken) return;
    let cancelled = false;
    fetch('/api/favorites', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json() as Promise<{ favorites: string[] }>)
      .then((data) => {
        if (cancelled) return;
        const remote = data.favorites ?? [];
        setFavorites(remote);
        localStorage.setItem(LS_KEY, JSON.stringify(remote));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, canAccessPremium]);

  const toggleFavorite = useCallback(
    (route: string) => {
      setFavorites((prev) => {
        const next = prev.includes(route)
          ? prev.filter((r) => r !== route)
          : [...prev, route];
        localStorage.setItem(LS_KEY, JSON.stringify(next));
        if (canAccessPremium && session?.accessToken) {
          void fetch('/api/favorites', {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ favorites: next }),
          });
        }
        return next;
      });
    },
    [canAccessPremium, session?.accessToken],
  );

  return { favorites, canAccessPremium, toggleFavorite };
};
