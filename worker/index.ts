interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ADMIN_USER_IDS?: string; // comma-separated Discord user IDs — set via wrangler secret
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

interface GapPredictionRow {
  id: string;
  discord_user_id: string;
  week_key: string;
  symbol: string;
  direction: string;
  confidence: number;
  note: string;
  created_at: string;
}

interface QuizResultRow {
  id: string;
  discord_user_id: string;
  type_code: string;
  answers_json: string | null;
  created_at: string;
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

const isAdmin = (userId: string, env: Env): boolean => {
  if (!env.ADMIN_USER_IDS) return false;
  return env.ADMIN_USER_IDS.split(',').map((id) => id.trim()).includes(userId);
};

async function handleApi(request: Request, env: Env): Promise<Response> {
  const userId = await verifyToken(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  const pathname = new URL(request.url).pathname;
  const apiPath = pathname.replace(/^\/api\//, '');
  const segments = apiPath.split('/');
  const method = request.method;
  const db = env.DB;

  // ── GET /api/pnl/accounts ────────────────────────────────────────────────
  if (apiPath === 'pnl/accounts' && method === 'GET') {
    const { results } = await db
      .prepare('SELECT id, name, unit, created_at FROM accounts WHERE discord_user_id = ?')
      .bind(userId)
      .all<AccountRow>();
    return json(
      results.map((r) => ({ id: r.id, name: r.name, unit: r.unit, createdAt: r.created_at })),
    );
  }

  // ── POST /api/pnl/accounts ───────────────────────────────────────────────
  if (apiPath === 'pnl/accounts' && method === 'POST') {
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
    return json({ id: body.id, name: body.name, unit: body.unit, createdAt: body.createdAt }, 201);
  }

  // ── PATCH /api/pnl/accounts/:id ─────────────────────────────────────────
  if (apiPath.startsWith('pnl/accounts/') && method === 'PATCH' && segments.length === 3) {
    const accountId = segments[2];
    const body = (await request.json()) as { unit?: string; name?: string };
    const row = await db
      .prepare('SELECT id FROM accounts WHERE id = ? AND discord_user_id = ?')
      .bind(accountId, userId)
      .first<{ id: string }>();
    if (!row) return json({ error: 'Not Found' }, 404);
    const setParts: string[] = [];
    const binds: string[] = [];
    if (body.name !== undefined) { setParts.push('name = ?'); binds.push(body.name.trim()); }
    if (body.unit !== undefined) { setParts.push('unit = ?'); binds.push(body.unit.trim()); }
    if (setParts.length > 0) {
      await db
        .prepare(`UPDATE accounts SET ${setParts.join(', ')} WHERE id = ? AND discord_user_id = ?`)
        .bind(...binds, accountId, userId)
        .run();
    }
    return json({ ok: true });
  }

  // ── DELETE /api/pnl/accounts/:id ────────────────────────────────────────
  if (apiPath.startsWith('pnl/accounts/') && method === 'DELETE') {
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
  if (apiPath === 'pnl/records' && method === 'GET') {
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
  if (apiPath === 'pnl/records' && method === 'POST') {
    const body = (await request.json()) as {
      accountId: string;
      date: string;
      pnl: number;
      notes?: string;
      id?: string;
    };
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
    return json({ id, accountId: body.accountId, date: body.date, pnl: body.pnl, notes: notes ?? undefined });
  }

  // ── GET /api/favorites ──────────────────────────────────────────────────
  if (apiPath === 'favorites' && method === 'GET') {
    const row = await db
      .prepare('SELECT favorites_json FROM user_settings WHERE discord_user_id = ?')
      .bind(userId)
      .first<{ favorites_json: string }>();
    const favorites: string[] = row ? (JSON.parse(row.favorites_json) as string[]) : [];
    return json({ favorites });
  }

  // ── PUT /api/favorites ──────────────────────────────────────────────────
  if (apiPath === 'favorites' && method === 'PUT') {
    const body = (await request.json()) as { favorites: unknown };
    const list = Array.isArray(body.favorites) ? (body.favorites as string[]).slice(0, 30) : [];
    const favJson = JSON.stringify(list);
    await db
      .prepare(
        `INSERT INTO user_settings (discord_user_id, favorites_json) VALUES (?, ?)
         ON CONFLICT(discord_user_id) DO UPDATE SET favorites_json = excluded.favorites_json`,
      )
      .bind(userId, favJson)
      .run();
    return json({ ok: true });
  }

  // ── DELETE /api/pnl/records/:accountId/:date ─────────────────────────────
  if (apiPath.startsWith('pnl/records/') && method === 'DELETE' && segments.length === 4) {
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

  // ── GET /api/gap-predictions ────────────────────────────────────────────
  if (apiPath === 'gap-predictions' && method === 'GET') {
    const { results } = await db
      .prepare(
        'SELECT id, week_key, symbol, direction, confidence, note, created_at FROM gap_predictions WHERE discord_user_id = ? ORDER BY created_at DESC',
      )
      .bind(userId)
      .all<GapPredictionRow>();
    return json(
      results.map((r) => ({
        id: r.id, weekKey: r.week_key, symbol: r.symbol,
        direction: r.direction, confidence: r.confidence, note: r.note, createdAt: r.created_at,
      })),
    );
  }

  // ── PUT /api/gap-predictions ─────────────────────────────────────────────
  if (apiPath === 'gap-predictions' && method === 'PUT') {
    const body = (await request.json()) as { predictions: GapPredictionRow[] };
    const list = Array.isArray(body.predictions) ? body.predictions.slice(0, 200) : [];
    await db.prepare('DELETE FROM gap_predictions WHERE discord_user_id = ?').bind(userId).run();
    if (list.length > 0) {
      await db.batch(
        list.map((p) =>
          db
            .prepare(
              'INSERT INTO gap_predictions (id, discord_user_id, week_key, symbol, direction, confidence, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            )
            .bind(p.id ?? crypto.randomUUID(), userId, p.weekKey ?? p.week_key, p.symbol, p.direction, p.confidence, p.note ?? '', p.createdAt ?? p.created_at),
        ),
      );
    }
    return json({ ok: true });
  }

  // ── GET /api/quiz-results ────────────────────────────────────────────────
  if (apiPath === 'quiz-results' && method === 'GET') {
    const { results } = await db
      .prepare(
        'SELECT id, type_code, answers_json, created_at FROM quiz_results WHERE discord_user_id = ? ORDER BY created_at DESC LIMIT 20',
      )
      .bind(userId)
      .all<QuizResultRow>();
    return json(
      results.map((r) => ({
        id: r.id, typeCode: r.type_code,
        answers: r.answers_json ? (JSON.parse(r.answers_json) as unknown) : {},
        createdAt: r.created_at,
      })),
    );
  }

  // ── POST /api/quiz-results ───────────────────────────────────────────────
  if (apiPath === 'quiz-results' && method === 'POST') {
    const body = (await request.json()) as {
      id: string; typeCode: string; answers?: Record<string, string>; createdAt: string;
    };
    await db
      .prepare(
        'INSERT OR IGNORE INTO quiz_results (id, discord_user_id, type_code, answers_json, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(body.id, userId, body.typeCode, body.answers ? JSON.stringify(body.answers) : null, body.createdAt)
      .run();
    return json({ ok: true }, 201);
  }

  // ── GET /api/admin/overview ─────────────────────────────────────────────
  if (apiPath === 'admin/overview' && method === 'GET') {
    if (!isAdmin(userId, env)) return json({ error: 'Forbidden' }, 403);
    const [usersRes, accountsRes, recordsRes, settingsRes] = await db.batch([
      db.prepare('SELECT COUNT(DISTINCT discord_user_id) as count FROM accounts'),
      db.prepare('SELECT COUNT(*) as count FROM accounts'),
      db.prepare('SELECT COUNT(*) as count FROM daily_records'),
      db.prepare('SELECT COUNT(*) as count FROM user_settings'),
    ]);
    return json({
      userCount: (usersRes.results[0] as { count: number }).count,
      accountCount: (accountsRes.results[0] as { count: number }).count,
      recordCount: (recordsRes.results[0] as { count: number }).count,
      favoritesUserCount: (settingsRes.results[0] as { count: number }).count,
    });
  }

  // ── GET /api/admin/users ─────────────────────────────────────────────────
  if (apiPath === 'admin/users' && method === 'GET') {
    if (!isAdmin(userId, env)) return json({ error: 'Forbidden' }, 403);
    const { results } = await db
      .prepare(
        `SELECT a.discord_user_id,
                COUNT(DISTINCT a.id)    AS account_count,
                COUNT(r.id)             AS record_count,
                MAX(r.date)             AS last_record_date
         FROM accounts a
         LEFT JOIN daily_records r ON r.discord_user_id = a.discord_user_id
         GROUP BY a.discord_user_id
         ORDER BY record_count DESC`,
      )
      .all<{
        discord_user_id: string;
        account_count: number;
        record_count: number;
        last_record_date: string | null;
      }>();
    return json(
      results.map((r) => ({
        discordUserId: r.discord_user_id,
        accountCount: r.account_count,
        recordCount: r.record_count,
        lastRecordDate: r.last_record_date,
      })),
    );
  }

  // ── GET /api/admin/gap-predictions ──────────────────────────────────────
  if (apiPath === 'admin/gap-predictions' && method === 'GET') {
    if (!isAdmin(userId, env)) return json({ error: 'Forbidden' }, 403);
    const { results } = await db
      .prepare(
        'SELECT discord_user_id, week_key, symbol, direction, confidence, note, created_at FROM gap_predictions ORDER BY created_at DESC LIMIT 1000',
      )
      .all<GapPredictionRow>();
    return json(
      results.map((r) => ({
        discordUserId: r.discord_user_id, weekKey: r.week_key, symbol: r.symbol,
        direction: r.direction, confidence: r.confidence, note: r.note, createdAt: r.created_at,
      })),
    );
  }

  // ── GET /api/admin/quiz-results ──────────────────────────────────────────
  if (apiPath === 'admin/quiz-results' && method === 'GET') {
    if (!isAdmin(userId, env)) return json({ error: 'Forbidden' }, 403);
    const { results } = await db
      .prepare(
        'SELECT discord_user_id, type_code, created_at FROM quiz_results ORDER BY created_at DESC LIMIT 1000',
      )
      .all<{ discord_user_id: string; type_code: string; created_at: string }>();
    return json(
      results.map((r) => ({ discordUserId: r.discord_user_id, typeCode: r.type_code, createdAt: r.created_at })),
    );
  }

  // ── GET /api/admin/users/:discordId ──────────────────────────────────────
  if (apiPath.startsWith('admin/users/') && method === 'GET' && segments.length === 3) {
    if (!isAdmin(userId, env)) return json({ error: 'Forbidden' }, 403);
    const targetId = segments[2];
    const [accountsRes, recordsRes] = await db.batch([
      db.prepare('SELECT id, name, unit, created_at FROM accounts WHERE discord_user_id = ?').bind(targetId),
      db
        .prepare(
          'SELECT id, account_id, date, pnl, notes FROM daily_records WHERE discord_user_id = ? ORDER BY date DESC',
        )
        .bind(targetId),
    ]);
    return json({
      accounts: (accountsRes.results as AccountRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        unit: r.unit,
        createdAt: r.created_at,
      })),
      records: (recordsRes.results as RecordRow[]).map((r) => ({
        id: r.id,
        accountId: r.account_id,
        date: r.date,
        pnl: r.pnl,
        notes: r.notes ?? undefined,
      })),
    });
  }

  return json({ error: 'Not Found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
