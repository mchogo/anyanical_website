interface Env {
  DB: D1Database;
}

interface AccountRow {
  id: string;
  discord_user_id: string;
  name: string;
  unit: string;
  created_at: string;
}

interface RecordRow {
  id: string;
  account_id: string;
  discord_user_id: string;
  date: string;
  pnl: number;
  notes: string | null;
}

const json = (data: unknown, status = 200): Response => Response.json(data, { status });

async function verifyToken(request: Request): Promise<string | null> {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const res = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id: string };
    return user.id ?? null;
  } catch {
    return null;
  }
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await verifyToken(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  const segments = params['path'] as string[];
  const path = segments.join('/');
  const method = request.method;
  const db = env.DB;

  // ── GET /api/pnl/accounts ────────────────────────────────────────────────
  if (path === 'pnl/accounts' && method === 'GET') {
    const { results } = await db
      .prepare(
        'SELECT id, name, unit, created_at FROM accounts WHERE discord_user_id = ?',
      )
      .bind(userId)
      .all<AccountRow>();
    return json(
      results.map((r) => ({
        id: r.id,
        name: r.name,
        unit: r.unit,
        createdAt: r.created_at,
      })),
    );
  }

  // ── POST /api/pnl/accounts ───────────────────────────────────────────────
  if (path === 'pnl/accounts' && method === 'POST') {
    const body = (await request.json()) as {
      id: string;
      name: string;
      unit: string;
      createdAt: string;
    };
    await db
      .prepare(
        'INSERT INTO accounts (id, discord_user_id, name, unit, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(body.id, userId, body.name.trim(), body.unit.trim(), body.createdAt)
      .run();
    return json(
      { id: body.id, name: body.name, unit: body.unit, createdAt: body.createdAt },
      201,
    );
  }

  // ── DELETE /api/pnl/accounts/:id ────────────────────────────────────────
  if (path.startsWith('pnl/accounts/') && method === 'DELETE') {
    const accountId = segments[2];
    const row = await db
      .prepare('SELECT id FROM accounts WHERE id = ? AND discord_user_id = ?')
      .bind(accountId, userId)
      .first<{ id: string }>();
    if (!row) return json({ error: 'Not Found' }, 404);
    await db.batch([
      db.prepare('DELETE FROM daily_records WHERE account_id = ?').bind(accountId),
      db.prepare('DELETE FROM accounts WHERE id = ?').bind(accountId),
    ]);
    return json({ ok: true });
  }

  // ── GET /api/pnl/records ─────────────────────────────────────────────────
  if (path === 'pnl/records' && method === 'GET') {
    const { results } = await db
      .prepare(
        'SELECT id, account_id, date, pnl, notes FROM daily_records WHERE discord_user_id = ?',
      )
      .bind(userId)
      .all<RecordRow>();
    return json(
      results.map((r) => ({
        id: r.id,
        accountId: r.account_id,
        date: r.date,
        pnl: r.pnl,
        notes: r.notes ?? undefined,
      })),
    );
  }

  // ── POST /api/pnl/records ────────────────────────────────────────────────
  if (path === 'pnl/records' && method === 'POST') {
    const body = (await request.json()) as {
      accountId: string;
      date: string;
      pnl: number;
      notes?: string;
      id?: string;
    };

    // Verify the account belongs to the user
    const account = await db
      .prepare('SELECT id FROM accounts WHERE id = ? AND discord_user_id = ?')
      .bind(body.accountId, userId)
      .first<{ id: string }>();
    if (!account) return json({ error: 'Not Found' }, 404);

    const id = body.id ?? crypto.randomUUID();
    const notes = body.notes?.trim() || null;

    await db
      .prepare(
        `INSERT INTO daily_records (id, account_id, discord_user_id, date, pnl, notes)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(account_id, date) DO UPDATE SET id = excluded.id, pnl = excluded.pnl, notes = excluded.notes`,
      )
      .bind(id, body.accountId, userId, body.date, body.pnl, notes)
      .run();

    return json({
      id,
      accountId: body.accountId,
      date: body.date,
      pnl: body.pnl,
      notes: notes ?? undefined,
    });
  }

  // ── DELETE /api/pnl/records/:accountId/:date ─────────────────────────────
  if (path.startsWith('pnl/records/') && method === 'DELETE' && segments.length === 4) {
    const accountId = segments[2];
    const date = segments[3];
    await db
      .prepare(
        'DELETE FROM daily_records WHERE account_id = ? AND date = ? AND discord_user_id = ?',
      )
      .bind(accountId, date, userId)
      .run();
    return json({ ok: true });
  }

  return json({ error: 'Not Found' }, 404);
};
