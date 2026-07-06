import { useCallback, useEffect, useState } from 'react';

import type { DiscordAuthSession } from './useDiscordAuth';

// ミニゲーム（ハイロー / ローソク足スワイプ）のスコア保存・取得。
// 認証は既存の Discord OAuth トークンを Bearer で送り、Worker 側の
// verifyToken → discord_user_id スコープに従う。

export type GameId = 'highlow' | 'candle_swipe' | 'profit_tower';

export type LeaderboardEntry = {
  rank: number;
  userTag: string;
  isMe: boolean;
  bestScore: number;
  bestStreak: number;
  lastPlayed: string;
};

type MyScores = {
  bestScore: number;
  bestStreak: number;
};

export const useGameScores = (game: GameId, session: DiscordAuthSession | null) => {
  const [myScores, setMyScores] = useState<MyScores>({ bestScore: 0, bestStreak: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const token = session?.accessToken ?? null;

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [scoresRes, lbRes] = await Promise.all([
        fetch(`/api/games/scores?game=${game}`, { headers }),
        fetch(`/api/games/leaderboard?game=${game}&limit=10`, { headers }),
      ]);
      if (scoresRes.ok) {
        const data = (await scoresRes.json()) as MyScores;
        setMyScores({ bestScore: data.bestScore ?? 0, bestStreak: data.bestStreak ?? 0 });
      }
      if (lbRes.ok) {
        setLeaderboard((await lbRes.json()) as LeaderboardEntry[]);
      }
    } catch {
      // ネットワーク断はUI側で致命でないため握りつぶす（表示は前回値のまま）
    }
  }, [game, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitScore = useCallback(
    async (score: number, bestStreak: number, meta?: Record<string, unknown>) => {
      if (!token) return;
      setIsSaving(true);
      try {
        await fetch('/api/games/scores', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ game, score, bestStreak, meta }),
        });
        await refresh();
      } catch {
        // 保存失敗はスコア表示に影響させない
      } finally {
        setIsSaving(false);
      }
    },
    [game, refresh, token],
  );

  return { myScores, leaderboard, submitScore, isSaving, canSave: token !== null };
};
