import { useEffect, useState } from 'react';
import type { useDiscordAuth } from '../hooks/useDiscordAuth';

type DiscordAuth = ReturnType<typeof useDiscordAuth>;

type Overview = {
  userCount: number;
  accountCount: number;
  recordCount: number;
  favoritesUserCount: number;
};

type UserRow = {
  discordUserId: string;
  accountCount: number;
  recordCount: number;
  lastRecordDate: string | null;
};

type Account = { id: string; name: string; unit: string; createdAt: string };
type PnlRecord = { id: string; accountId: string; date: string; pnl: number; notes?: string };
type UserDetail = { accounts: Account[]; records: PnlRecord[] };

type GapPredRow = {
  discordUserId: string;
  weekKey: string;
  symbol: string;
  direction: 'up' | 'down' | 'flat';
  confidence: number;
  note: string;
  createdAt: string;
};

type QuizRow = {
  discordUserId: string;
  typeCode: string;
  createdAt: string;
};

type Tab = 'overview' | 'users' | 'gap' | 'quiz';

const apiFetch = async <T,>(path: string, token: string): Promise<T | null> => {
  try {
    const res = await fetch(`/api/${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-white">{value.toLocaleString()}</p>
  </div>
);

const TabBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`min-h-9 rounded-full px-4 text-sm font-bold ring-1 transition ${
      active ? 'bg-cyan-300 text-slate-950 ring-cyan-200' : 'bg-white/[0.04] text-slate-300 ring-white/10 hover:bg-white/10'
    }`}
  >
    {children}
  </button>
);

const UserDetailPanel = ({ userId, token, onClose }: { userId: string; token: string; onClose: () => void }) => {
  const [detail, setDetail] = useState<UserDetail | null>(null);

  useEffect(() => {
    void apiFetch<UserDetail>(`admin/users/${userId}`, token).then(setDetail);
  }, [userId, token]);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-start overflow-y-auto bg-slate-950/90 px-4 py-8 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto w-full max-w-3xl rounded-lg border border-white/10 bg-slate-900 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Discord ID</p>
            <p className="font-mono text-sm text-white">{userId}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.04] text-slate-400 ring-1 ring-white/10 transition hover:text-white">✕</button>
        </div>

        {!detail && <p className="text-sm text-slate-500">読み込み中...</p>}

        {detail && (
          <>
            <div className="mb-5">
              <p className="mb-2 text-sm font-bold text-white">口座 ({detail.accounts.length})</p>
              {detail.accounts.length === 0 ? <p className="text-xs text-slate-500">なし</p> : (
                <div className="space-y-1">
                  {detail.accounts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                      <span className="font-semibold text-slate-200">{a.name}</span>
                      <span className="text-xs text-slate-500">{a.unit}</span>
                      <span className="text-xs text-slate-600">{a.createdAt.slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-white">損益レコード ({detail.records.length})</p>
              {detail.records.length === 0 ? <p className="text-xs text-slate-500">なし</p> : (
                <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                  {detail.records.map((r) => {
                    const acct = detail.accounts.find((a) => a.id === r.accountId);
                    return (
                      <div key={r.id} className="flex items-center gap-3 rounded border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs">
                        <span className="w-24 shrink-0 text-slate-500">{r.date}</span>
                        <span className={`w-24 shrink-0 font-mono font-semibold ${r.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {r.pnl >= 0 ? '+' : ''}{r.pnl.toLocaleString()}{acct ? ` ${acct.unit}` : ''}
                        </span>
                        <span className="truncate text-slate-400">{r.notes ?? ''}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const DIRECTION_LABELS = { up: '↑上', down: '↓下', flat: '→横' } as const;
const DIRECTION_COLORS = { up: 'text-emerald-300', down: 'text-rose-300', flat: 'text-slate-400' } as const;

const GapTab = ({ token }: { token: string }) => {
  const [data, setData] = useState<GapPredRow[] | null>(null);

  useEffect(() => {
    void apiFetch<GapPredRow[]>('admin/gap-predictions', token).then(setData);
  }, [token]);

  if (!data) return <p className="text-sm text-slate-500">読み込み中...</p>;
  if (data.length === 0) return <p className="text-sm text-slate-500">データなし</p>;

  // Group by weekKey
  const byWeek = new Map<string, GapPredRow[]>();
  for (const r of data) {
    const list = byWeek.get(r.weekKey) ?? [];
    list.push(r);
    byWeek.set(r.weekKey, list);
  }
  const weeks = [...byWeek.keys()].sort().reverse();

  return (
    <div className="space-y-6">
      {weeks.map((week) => {
        const rows = byWeek.get(week)!;
        const bySymbol = new Map<string, { up: number; down: number; flat: number }>();
        for (const r of rows) {
          const s = bySymbol.get(r.symbol) ?? { up: 0, down: 0, flat: 0 };
          s[r.direction] = (s[r.direction] ?? 0) + 1;
          bySymbol.set(r.symbol, s);
        }
        const symbols = [...bySymbol.keys()].sort();

        return (
          <div key={week} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold text-white">{week}</p>
              <p className="text-xs text-slate-500">{rows.length}件</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                    <th className="pb-2 pr-4 font-semibold">銘柄</th>
                    <th className="pb-2 pr-3 font-semibold text-emerald-400">↑上</th>
                    <th className="pb-2 pr-3 font-semibold text-rose-400">↓下</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-400">→横</th>
                    <th className="pb-2 font-semibold">ユーザー</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {symbols.map((sym) => {
                    const s = bySymbol.get(sym)!;
                    const users = rows.filter((r) => r.symbol === sym);
                    return (
                      <tr key={sym}>
                        <td className="py-2 pr-4 font-semibold text-white">{sym}</td>
                        <td className="py-2 pr-3 text-emerald-300">{s.up || '—'}</td>
                        <td className="py-2 pr-3 text-rose-300">{s.down || '—'}</td>
                        <td className="py-2 pr-3 text-slate-400">{s.flat || '—'}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {users.map((u) => (
                              <span key={u.discordUserId + u.symbol} className={`text-xs ${DIRECTION_COLORS[u.direction]}`} title={`信頼度${u.confidence}% ${u.note}`}>
                                {u.discordUserId.slice(-6)} {DIRECTION_LABELS[u.direction]}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const QuizTab = ({ token }: { token: string }) => {
  const [data, setData] = useState<QuizRow[] | null>(null);

  useEffect(() => {
    void apiFetch<QuizRow[]>('admin/quiz-results', token).then(setData);
  }, [token]);

  if (!data) return <p className="text-sm text-slate-500">読み込み中...</p>;
  if (data.length === 0) return <p className="text-sm text-slate-500">データなし</p>;

  // Count by typeCode
  const counts = new Map<string, number>();
  for (const r of data) counts.set(r.typeCode, (counts.get(r.typeCode) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = data.length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <p className="mb-4 text-sm font-bold text-white">タイプ分布 (計{total}件)</p>
        <div className="space-y-2">
          {sorted.map(([code, count]) => (
            <div key={code} className="flex items-center gap-3">
              <span className="w-14 shrink-0 font-mono text-sm font-bold text-amber-200">{code}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-3 rounded-full bg-cyan-400/60 transition-all"
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs text-slate-400">{count}件 ({Math.round((count / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <p className="mb-3 text-sm font-bold text-white">最近の診断履歴</p>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {data.slice(0, 50).map((r, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="w-32 shrink-0 text-slate-500">{r.createdAt.slice(0, 16).replace('T', ' ')}</span>
              <span className="w-14 shrink-0 font-mono font-bold text-amber-200">{r.typeCode}</span>
              <span className="font-mono text-slate-600">{r.discordUserId.slice(-8)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AdminPage = ({ auth }: { auth: DiscordAuth }) => {
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = auth.session?.accessToken ?? null;

  useEffect(() => {
    if (auth.roleAccess !== 'admin' || !token) return;
    void Promise.all([
      apiFetch<Overview>('admin/overview', token),
      apiFetch<UserRow[]>('admin/users', token),
    ]).then(([ov, us]) => {
      if (!ov || !us) {
        setError('管理者権限が設定されていません。workerのADMIN_USER_IDSを確認してください。');
        return;
      }
      setOverview(ov);
      setUsers(us);
    });
  }, [auth.roleAccess, token]);

  if (auth.roleAccess !== 'admin') {
    return (
      <main className="animate-fade-in">
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
          <p className="text-rose-300">管理者専用ページです。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="animate-fade-in">
      {selectedUserId && token && (
        <UserDetailPanel userId={selectedUserId} token={token} onClose={() => setSelectedUserId(null)} />
      )}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-rose-300">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-white">管理ダッシュボード</h1>
        <p className="mt-2 text-sm text-slate-400">全ユーザーの登録情報を確認できます。</p>
      </section>

      {error && (
        <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <p className="rounded-lg border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-200">{error}</p>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>概要</TabBtn>
          <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>ユーザー ({users?.length ?? '…'})</TabBtn>
          <TabBtn active={tab === 'gap'} onClick={() => setTab('gap')}>ギャップ予想</TabBtn>
          <TabBtn active={tab === 'quiz'} onClick={() => setTab('quiz')}>タイプ診断</TabBtn>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {tab === 'overview' && overview && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="ユーザー数" value={overview.userCount} />
            <StatCard label="口座数" value={overview.accountCount} />
            <StatCard label="損益レコード" value={overview.recordCount} />
            <StatCard label="お気に入り設定済み" value={overview.favoritesUserCount} />
          </div>
        )}

        {tab === 'users' && users && (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <p className="mb-4 text-sm font-bold text-white">ユーザー一覧（行クリックで詳細）</p>
            {users.length === 0 ? (
              <p className="text-sm text-slate-500">登録ユーザーなし</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                      <th className="pb-3 pr-4 font-semibold">Discord ID</th>
                      <th className="pb-3 pr-4 font-semibold text-right">口座</th>
                      <th className="pb-3 pr-4 font-semibold text-right">レコード</th>
                      <th className="pb-3 font-semibold">最終記録</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {users.map((u) => (
                      <tr key={u.discordUserId} onClick={() => setSelectedUserId(u.discordUserId)} className="cursor-pointer transition hover:bg-white/[0.03]">
                        <td className="py-3 pr-4 font-mono text-slate-300">{u.discordUserId}</td>
                        <td className="py-3 pr-4 text-right text-slate-400">{u.accountCount}</td>
                        <td className="py-3 pr-4 text-right text-slate-400">{u.recordCount}</td>
                        <td className="py-3 text-slate-500">{u.lastRecordDate ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'gap' && token && <GapTab token={token} />}
        {tab === 'quiz' && token && <QuizTab token={token} />}

        {!overview && !error && tab === 'overview' && (
          <p className="text-sm text-slate-500">読み込み中...</p>
        )}
      </section>
    </main>
  );
};
