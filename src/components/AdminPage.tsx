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
type Record = { id: string; accountId: string; date: string; pnl: number; notes?: string };
type UserDetail = { accounts: Account[]; records: Record[] };

const apiFetch = async <T>(path: string, token: string): Promise<T | null> => {
  const res = await fetch(`/api/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-white">{value.toLocaleString()}</p>
  </div>
);

const UserDetailPanel = ({
  userId,
  token,
  onClose,
}: {
  userId: string;
  token: string;
  onClose: () => void;
}) => {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void apiFetch<UserDetail>(`admin/users/${userId}`, token).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [userId, token]);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-start overflow-y-auto bg-slate-950/90 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-3xl rounded-lg border border-white/10 bg-slate-900 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Discord ID</p>
            <p className="font-mono text-sm text-white">{userId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.04] text-slate-400 ring-1 ring-white/10 transition hover:text-white"
          >
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">読み込み中...</p>}

        {detail && (
          <>
            <div className="mb-4">
              <p className="mb-2 text-sm font-bold text-white">口座 ({detail.accounts.length})</p>
              {detail.accounts.length === 0 ? (
                <p className="text-xs text-slate-500">なし</p>
              ) : (
                <div className="space-y-1">
                  {detail.accounts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                    >
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
              {detail.records.length === 0 ? (
                <p className="text-xs text-slate-500">なし</p>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
                  {detail.records.map((r) => {
                    const acct = detail.accounts.find((a) => a.id === r.accountId);
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 rounded border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs"
                      >
                        <span className="w-24 shrink-0 text-slate-500">{r.date}</span>
                        <span
                          className={`w-20 shrink-0 font-mono font-semibold ${r.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}
                        >
                          {r.pnl >= 0 ? '+' : ''}
                          {r.pnl.toLocaleString()}
                          {acct ? ` ${acct.unit}` : ''}
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

export const AdminPage = ({ auth }: { auth: DiscordAuth }) => {
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
        <UserDetailPanel
          userId={selectedUserId}
          token={token}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-rose-300">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-white">管理ダッシュボード</h1>
        <p className="mt-2 text-sm text-slate-400">全ユーザーの登録情報を確認できます。</p>
      </section>

      {error && (
        <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <p className="rounded-lg border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-200">
            {error}
          </p>
        </section>
      )}

      {overview && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="ユーザー数" value={overview.userCount} />
            <StatCard label="口座数" value={overview.accountCount} />
            <StatCard label="レコード数" value={overview.recordCount} />
            <StatCard label="お気に入り設定済み" value={overview.favoritesUserCount} />
          </div>
        </section>
      )}

      {users && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <p className="mb-4 text-sm font-bold text-white">ユーザー一覧</p>
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
                      <tr
                        key={u.discordUserId}
                        onClick={() => setSelectedUserId(u.discordUserId)}
                        className="cursor-pointer transition hover:bg-white/[0.03]"
                      >
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
        </section>
      )}

      {!overview && !error && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">読み込み中...</p>
        </section>
      )}
    </main>
  );
};
