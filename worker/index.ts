interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ADMIN_USER_IDS?: string; // comma-separated Discord user IDs — set via wrangler secret
  SHOWCASE_ACCOUNT_IDS?: string; // comma-separated accounts.id to expose publicly on /api/pnl/showcase — set via wrangler secret
  DISCORD_GUILD_ID?: string;
  GPT_ALLOWED_ROLE_IDS?: string; // comma-separated Discord role IDs
  MATOME_WRITE_KEY?: string; // shared secret for POST /api/matome/entries (Hermes自動投稿) — set via wrangler secret
  HTF_CONTEXT_WRITE_KEY?: string; // shared secret for POST /api/htf-context (TradingViewアラートWebhook) — set via wrangler secret
  HTF_DIGEST_WEBHOOK_H4?: string; // Discord webhook URL for the 4H HTF context digest (Cron Trigger) — set via wrangler secret
  HTF_DIGEST_WEBHOOK_D1?: string; // 同上、日足
  HTF_DIGEST_WEBHOOK_W1?: string; // 同上、週足
  HTF_DIGEST_WEBHOOK_MN1?: string; // 同上、月足
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

interface GameScoreRow {
  id: string;
  discord_user_id: string;
  game: string;
  score: number;
  best_streak: number;
  meta_json: string | null;
  created_at: string;
}

interface HtfSearchPresetRow {
  id: string;
  name: string;
  filters_json: string;
  schema_version: number;
  is_default: number;
  created_at: string;
  updated_at: string;
}

interface GptKnowledgeRow {
  id: string;
  source_id: string;
  title: string;
  content: string;
  keywords: string;
  sort_order: number;
}

const VALID_GAMES = ['highlow', 'candle_swipe', 'profit_tower'] as const;
type GameId = (typeof VALID_GAMES)[number];
const isValidGame = (value: unknown): value is GameId =>
  typeof value === 'string' && (VALID_GAMES as readonly string[]).includes(value);

const json = (data: unknown, status = 200): Response => Response.json(data, { status });

const tokenHash = async (token: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const createOpaqueSessionToken = (): string =>
  `gpt_${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;

const GPT_SESSION_LIFETIME_SECONDS = 10 * 60;
const DISCORD_SUPPORT_URL = 'https://discord.gg/G6xWszr9CZ';

const GPT_SOURCE_TITLES: Record<string, string> = {
  'INTEGRATION-RULES': '教材統合ルール',
  'ANYANICAL-MASTER': 'Anyanical統合手法マニュアル',
  'DISCORD-BASIC-1': 'アニャニカル基本その1',
  'DISCORD-BASIC-2': 'アニャニカル基本その2',
  'NOTE-COMBINED': 'Noteエントリー手法',
  'INDICATOR-SPECS': 'インジケーター概念一覧',
  'DISCORD-ADVANCED': 'アニャニカル応用',
  'DISCORD-BEGINNER': '初心者向け学習ロードマップ',
};

const PUBLIC_FUND_MODE_SUMMARY = `## ファンドモード

ファンドモードは、相場を動かしているファンドが使うテクニカルを可視化し、水平線として描写するモードです。引力線は斜め線が交差するポイントをもとにしており、その付近は売買が起きやすい観測ポイントとして扱います。

相場では期間の異なるファンド同士の売買がぶつかり合うのが基本であり、表示ラインを無条件・機械的に使うものではありません。銘柄、時間帯、相場環境ごとに検証することで、その日に通常動きやすい範囲を整理する材料として活用できます。

確定線とプレビューは区別して確認し、各ラインだけで価格到達や反転を断定しません。作図基準、算出方法、参照している価格・期間、起点・終点、再現手順は内部ロジックのため案内できません。`;

const publicKnowledgeContent = (row: GptKnowledgeRow): string =>
  row.title.includes('ファンドモード') || row.content.includes('ファンドモード')
    ? PUBLIC_FUND_MODE_SUMMARY
    : row.content;

const getBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization') ?? '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim().replace(/^Bearer\s+/i, '') ?? '';
  return token || null;
};

const DISCORD_OAUTH_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';
const DISCORD_OAUTH_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const OAUTH_AUTHORIZE_PARAMS = [
  'client_id',
  'redirect_uri',
  'response_type',
  'scope',
  'state',
  'code_challenge',
  'code_challenge_method',
  'prompt',
] as const;

const handleGptOAuthAuthorize = (request: Request): Response => {
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const sourceUrl = new URL(request.url);
  const discordUrl = new URL(DISCORD_OAUTH_AUTHORIZE_URL);
  for (const param of OAUTH_AUTHORIZE_PARAMS) {
    const value = sourceUrl.searchParams.get(param);
    if (value !== null) discordUrl.searchParams.set(param, value);
  }
  return new Response(null, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      Location: discordUrl.toString(),
      Pragma: 'no-cache',
    },
  });
};

const handleGptOAuthToken = async (request: Request, env: Env): Promise<Response> => {
  if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
    return json({ error: 'Unsupported Media Type' }, 415);
  }

  const body = await request.text();
  if (body.length > 16_384) return json({ error: 'Payload Too Large' }, 413);

  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
  });
  const authorization = request.headers.get('Authorization');
  if (authorization) headers.set('Authorization', authorization);

  try {
    const discordResponse = await fetch(DISCORD_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers,
      body,
    });
    let responseText = await discordResponse.text();
    try {
      const payload = JSON.parse(responseText) as {
        access_token?: unknown;
        refresh_token?: unknown;
      };
      const accessToken =
        typeof payload.access_token === 'string' ? payload.access_token : '';
      if (accessToken) {
        try {
          const validationResponse = await fetch(
            'https://discord.com/api/v10/users/@me',
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          );
          if (validationResponse.ok) {
            const user = (await validationResponse.json()) as { id?: unknown };
            const userId = typeof user.id === 'string' ? user.id : '';
            const guildId = env.DISCORD_GUILD_ID?.trim() ?? '';
            const allowedRoleIds = parseCommaSeparatedIds(env.GPT_ALLOWED_ROLE_IDS);
            if (userId && guildId && allowedRoleIds.length > 0) {
              const memberResponse = await fetch(
                `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
                { headers: { Authorization: `Bearer ${accessToken}` } },
              );
              const member = memberResponse.ok
                ? ((await memberResponse.json()) as { roles?: unknown })
                : null;
              const roles = Array.isArray(member?.roles)
                ? member.roles.filter((role): role is string => typeof role === 'string')
                : [];
              const accessAllowed = allowedRoleIds.some((roleId) =>
                roles.includes(roleId),
              );
              const sessionToken = createOpaqueSessionToken();
              const sessionHash = await tokenHash(sessionToken);
              const expiresAt =
                Math.floor(Date.now() / 1000) + GPT_SESSION_LIFETIME_SECONDS;
              const updatedAt = new Date().toISOString();
              await env.DB.batch([
                env.DB.prepare(
                  `UPDATE gpt_oauth_sessions
                     SET access_allowed = ?, expires_at = ?, updated_at = ?
                     WHERE discord_user_id = ?`,
                ).bind(accessAllowed ? 1 : 0, expiresAt, updatedAt, userId),
                env.DB.prepare(
                  `INSERT INTO gpt_oauth_sessions
                       (token_hash, discord_user_id, access_allowed, expires_at, updated_at)
                     VALUES (?, ?, ?, ?, ?)`,
                ).bind(sessionHash, userId, accessAllowed ? 1 : 0, expiresAt, updatedAt),
                env.DB.prepare(
                  'DELETE FROM gpt_oauth_sessions WHERE expires_at < ?',
                ).bind(Math.floor(Date.now() / 1000) - 3600),
              ]);
              const outputPayload = JSON.parse(responseText) as Record<string, unknown>;
              outputPayload.access_token = sessionToken;
              outputPayload.token_type = 'Bearer';
              outputPayload.expires_in = GPT_SESSION_LIFETIME_SECONDS;
              responseText = JSON.stringify(outputPayload);
            }
          }
        } catch {
          // Discord確認失敗時は元のOAuthレスポンスをそのまま返す。
        }
      }
    } catch {
      // Discordの非JSONエラー本文は返すが、ログへ本文は出さない。
    }
    return new Response(responseText, {
      status: discordResponse.status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': discordResponse.headers.get('Content-Type') ?? 'application/json',
        Pragma: 'no-cache',
      },
    });
  } catch {
    return json({ error: 'OAuth provider unavailable' }, 503);
  }
};

async function verifyToken(request: Request): Promise<string | null> {
  const token = getBearerToken(request);
  if (!token) return null;
  try {
    const res = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id: string };
    return user.id ?? null;
  } catch {
    return null;
  }
}

type GptAccessResult =
  | { status: 'allowed'; userId: string }
  | {
      status: 'unauthorized';
      reason: 'TOKEN_MISSING' | 'TOKEN_INVALID';
    }
  | { status: 'forbidden'; reason: 'GUILD_REQUIRED' | 'ROLE_REQUIRED' }
  | { status: 'unavailable'; reason: 'NOT_CONFIGURED' | 'DISCORD_UNAVAILABLE' };

const parseCommaSeparatedIds = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

async function verifyGptAccess(request: Request, env: Env): Promise<GptAccessResult> {
  const guildId = env.DISCORD_GUILD_ID?.trim();
  const allowedRoleIds = parseCommaSeparatedIds(env.GPT_ALLOWED_ROLE_IDS);
  if (!guildId || allowedRoleIds.length === 0) {
    return { status: 'unavailable', reason: 'NOT_CONFIGURED' };
  }

  const token = getBearerToken(request);
  if (!token) return { status: 'unauthorized', reason: 'TOKEN_MISSING' };

  if (token.startsWith('gpt_')) {
    const session = await env.DB.prepare(
      `SELECT discord_user_id, access_allowed, expires_at
       FROM gpt_oauth_sessions WHERE token_hash = ?`,
    )
      .bind(await tokenHash(token))
      .first<{ discord_user_id: string; access_allowed: number; expires_at: number }>();
    if (!session || session.expires_at < Math.floor(Date.now() / 1000)) {
      return { status: 'unauthorized', reason: 'TOKEN_INVALID' };
    }
    if (session.access_allowed !== 1) {
      return { status: 'forbidden', reason: 'ROLE_REQUIRED' };
    }
    return { status: 'allowed', userId: session.discord_user_id };
  }

  const userId = await verifyToken(request);
  if (!userId) {
    return { status: 'unauthorized', reason: 'TOKEN_INVALID' };
  }

  try {
    const memberResponse = await fetch(
      `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (memberResponse.status === 401) {
      return { status: 'unauthorized', reason: 'TOKEN_INVALID' };
    }
    if (memberResponse.status === 404) {
      return { status: 'forbidden', reason: 'GUILD_REQUIRED' };
    }
    if (!memberResponse.ok) {
      return { status: 'unavailable', reason: 'DISCORD_UNAVAILABLE' };
    }

    const member = (await memberResponse.json()) as { roles?: unknown };
    const roles = Array.isArray(member.roles)
      ? member.roles.filter((role): role is string => typeof role === 'string')
      : [];
    const isAllowed = allowedRoleIds.some((roleId) => roles.includes(roleId));
    if (!isAllowed) return { status: 'forbidden', reason: 'ROLE_REQUIRED' };

    return { status: 'allowed', userId };
  } catch {
    return { status: 'unavailable', reason: 'DISCORD_UNAVAILABLE' };
  }
}

async function handleGptAccess(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Not Found' }, 404);

  const result = await verifyGptAccess(request, env);
  if (result.status === 'allowed') {
    return json({ allowed: true, membership: 'premium' });
  }
  return gptAccessErrorResponse(result);
}

const gptAccessErrorResponse = (
  result: Exclude<GptAccessResult, { status: 'allowed' }>,
): Response => {
  if (result.status === 'unauthorized') {
    return json(
      {
        allowed: false,
        error: 'Unauthorized',
        code: 'OAUTH_REQUIRED',
        authStage: result.reason,
        retryable: true,
        nextStep:
          '「Sign in with anyanical.com」からDiscord会員認証を完了してください。ボタンを閉じた場合は「会員認証」と送ると再表示できます。',
      },
      401,
    );
  }
  if (result.status === 'forbidden') {
    const guildRequired = result.reason === 'GUILD_REQUIRED';
    return json(
      {
        allowed: false,
        error: 'Forbidden',
        code: result.reason,
        retryable: true,
        nextStep: guildRequired
          ? '対象Discordサーバーへ参加した後、「再試行」と送ってください。'
          : '対象Discordサーバーで会員ロールの付与状況を確認し、付与後に「再試行」と送ってください。',
        supportUrl: DISCORD_SUPPORT_URL,
      },
      403,
    );
  }
  return json(
    {
      allowed: false,
      error: 'Service Unavailable',
      code: result.reason,
      retryable: result.reason === 'DISCORD_UNAVAILABLE',
      nextStep:
        result.reason === 'DISCORD_UNAVAILABLE'
          ? '一時的に会員資格を確認できません。「再試行」と送るともう一度確認できます。'
          : '認証設定を運営者へ確認してください。',
      supportUrl: DISCORD_SUPPORT_URL,
    },
    503,
  );
};

const normalizeSearchText = (value: string): string =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('ja-JP')
    .replace(/[\s\p{P}\p{S}]+/gu, '');

const SEARCH_ALIAS_GROUPS = [
  ['調整', '押し目', '戻り'],
  ['修正', '修正波', '構造転換'],
  ['損切り', 'sl', 'ストップロス', '無効化'],
  ['利確', 'tp', 'ターゲット'],
  ['資金管理', 'ロット', '許容損失', 'リスク管理'],
  ['環境認識', 'dailybias', '方向性', '上位足'],
  ['フィボナッチ', 'fibonacci', 'フィボ', '半値'],
  ['スイープ', 'sweep', 'ヒゲ抜け', '流動性'],
  ['プレミアムディスカウント', 'premiumdiscount', '半値'],
  ['トレーディングレンジ', 'tradingrange'],
  ['インジケーター', 'toolkit', 'direction', 'サイン'],
  ['初心者', '学習順序', '勉強順', '何から'],
  ['エントリー', 'パターン1', 'パターン2', 'パターン3'],
] as const;

const SEARCH_STOP_TERMS = new Set([
  'について',
  'ください',
  '教えて',
  'とは',
  '違い',
  '具体例',
  'やり方',
  'どうすれば',
]);

const buildSearchTerms = (query: string, rows: readonly GptKnowledgeRow[]): string[] => {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  const terms = new Set<string>([normalized]);

  const explicitParts = query
    .normalize('NFKC')
    .split(/[\s、。・,./／:：!?！？（）()[\]「」『』]+/u)
    .map(normalizeSearchText)
    .filter((term) => term.length >= 2 && !SEARCH_STOP_TERMS.has(term));
  explicitParts.forEach((term) => terms.add(term));

  for (const group of SEARCH_ALIAS_GROUPS) {
    const normalizedGroup = group.map(normalizeSearchText);
    if (normalizedGroup.some((term) => normalized.includes(term))) {
      normalizedGroup.forEach((term) => terms.add(term));
    }
  }

  for (const row of rows) {
    for (const keyword of row.keywords.split(',')) {
      const term = normalizeSearchText(keyword);
      if (term.length >= 2 && normalized.includes(term)) terms.add(term);
    }
  }

  return [...terms].slice(0, 64);
};

const countTermMatches = (value: string, terms: readonly string[]): number =>
  terms.reduce((score, term) => score + (value.includes(term) ? 1 : 0), 0);

const scoreKnowledgeRow = (
  row: GptKnowledgeRow,
  normalizedQuery: string,
  terms: readonly string[],
): number => {
  const title = normalizeSearchText(row.title);
  const keywords = normalizeSearchText(row.keywords);
  const content = normalizeSearchText(row.content);
  const exactScore =
    (title.includes(normalizedQuery) ? 40 : 0) +
    (keywords.includes(normalizedQuery) ? 25 : 0) +
    (content.includes(normalizedQuery) ? 15 : 0);
  const focusedTerms = terms.filter((term) => term !== normalizedQuery);
  return (
    exactScore +
    countTermMatches(title, focusedTerms) * 12 +
    countTermMatches(keywords, focusedTerms) * 8 +
    countTermMatches(content, focusedTerms) * 2
  );
};

async function handleGptKnowledgeSearch(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Not Found' }, 404);

  const access = await verifyGptAccess(request, env);
  if (access.status !== 'allowed') return gptAccessErrorResponse(access);

  let body: { query?: unknown; limit?: unknown };
  try {
    body = (await request.json()) as { query?: unknown; limit?: unknown };
  } catch {
    return json({ error: 'Bad Request', code: 'INVALID_JSON' }, 400);
  }

  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query || query.length > 500) {
    return json({ error: 'Bad Request', code: 'INVALID_QUERY' }, 400);
  }

  const requestedLimit = body.limit === undefined ? 5 : Number(body.limit);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 8) {
    return json({ error: 'Bad Request', code: 'INVALID_LIMIT' }, 400);
  }

  const { results } = await env.DB.prepare(
    `SELECT id, source_id, title, content, keywords, sort_order
     FROM gpt_knowledge_chunks`,
  ).all<GptKnowledgeRow>();
  const normalizedQuery = normalizeSearchText(query);
  const terms = buildSearchTerms(query, results);
  const ranked = results
    .map((row) => ({ row, score: scoreKnowledgeRow(row, normalizedQuery, terms) }))
    .filter(({ score }) => score >= 8)
    .sort(
      (left, right) =>
        right.score - left.score || left.row.sort_order - right.row.sort_order,
    )
    .slice(0, requestedLimit);

  return json({
    results: ranked.map(({ row }) => ({
      sourceId: row.source_id,
      sourceTitle: GPT_SOURCE_TITLES[row.source_id] ?? row.source_id,
      title: row.title,
      content: publicKnowledgeContent(row),
    })),
    query,
    resultCount: ranked.length,
  });
}

const MATOME_LIST_LIMIT = 200;

// GET は公開（認証不要）、POST は Hermes自動投稿用の共有キー（MATOME_WRITE_KEY）で保護する。
// Discord OAuthではなくmarket-digest-bot(Hermes)からのサーバー間呼び出しのため、
// handleApi() の verifyToken() より前段（gpt/*と同様の早期リターン）で処理する。
async function handleMatomeEntries(request: Request, env: Env): Promise<Response> {
  const db = env.DB;

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const yearParam = url.searchParams.get('year');
    const monthParam = url.searchParams.get('month');
    const limitParam = url.searchParams.get('limit');
    if ((yearParam === null) !== (monthParam === null)) {
      return json({ error: 'Bad Request' }, 400);
    }
    let datePrefix = '';
    if (yearParam !== null && monthParam !== null) {
      const year = Number(yearParam);
      const month = Number(monthParam);
      if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        return json({ error: 'Bad Request' }, 400);
      }
      datePrefix = `${year}-${String(month).padStart(2, '0')}`;
    }
    let rowLimit = MATOME_LIST_LIMIT;
    if (limitParam !== null) {
      const parsedLimit = Number(limitParam);
      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > MATOME_LIST_LIMIT
      ) {
        return json({ error: 'Bad Request' }, 400);
      }
      rowLimit = parsedLimit;
    }
    const { results } = await (
      datePrefix
        ? db
            .prepare(
              'SELECT id, entry_date, source_url, source_author, headline, commentary, reaction_count, created_at FROM matome_entries WHERE hidden = 0 AND entry_date LIKE ? ORDER BY entry_date DESC, created_at DESC LIMIT ?',
            )
            .bind(`${datePrefix}%`, rowLimit)
        : db
            .prepare(
              'SELECT id, entry_date, source_url, source_author, headline, commentary, reaction_count, created_at FROM matome_entries WHERE hidden = 0 ORDER BY entry_date DESC, created_at DESC LIMIT ?',
            )
            .bind(rowLimit)
    ).all<{
      id: string;
      entry_date: string;
      source_url: string;
      source_author: string;
      headline: string;
      commentary: string;
      reaction_count: number;
      created_at: string;
    }>();
    return json(
      results.map((r) => ({
        id: r.id,
        entryDate: r.entry_date,
        sourceUrl: r.source_url,
        sourceAuthor: r.source_author,
        headline: r.headline,
        commentary: r.commentary,
        reactionCount: r.reaction_count,
        createdAt: r.created_at,
      })),
    );
  }

  if (request.method === 'POST') {
    const providedKey = request.headers.get('X-Matome-Write-Key') ?? '';
    if (!env.MATOME_WRITE_KEY || providedKey !== env.MATOME_WRITE_KEY) {
      return json({ error: 'Unauthorized' }, 401);
    }
    let body: {
      entryDate?: unknown;
      sourceUrl?: unknown;
      sourceAuthor?: unknown;
      headline?: unknown;
      commentary?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Bad Request', code: 'INVALID_JSON' }, 400);
    }
    const entryDate = typeof body.entryDate === 'string' ? body.entryDate : '';
    const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : '';
    const headline = typeof body.headline === 'string' ? body.headline.trim() : '';
    const commentary = typeof body.commentary === 'string' ? body.commentary.trim() : '';
    const sourceAuthor =
      typeof body.sourceAuthor === 'string' ? body.sourceAuthor.trim() : '';
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(entryDate) ||
      !sourceUrl ||
      !headline ||
      headline.length > 200 ||
      !commentary ||
      commentary.length > 4000
    ) {
      return json({ error: 'Bad Request', code: 'INVALID_FIELDS' }, 400);
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      return json({ error: 'Bad Request', code: 'INVALID_SOURCE_URL' }, 400);
    }
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return json({ error: 'Bad Request', code: 'INVALID_SOURCE_URL' }, 400);
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await db
      .prepare(
        'INSERT INTO matome_entries (id, entry_date, source_url, source_author, headline, commentary, hidden, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
      )
      .bind(id, entryDate, sourceUrl, sourceAuthor, headline, commentary, createdAt)
      .run();
    return json(
      { id, entryDate, sourceUrl, sourceAuthor, headline, commentary, createdAt },
      201,
    );
  }

  return json({ error: 'Not Found' }, 404);
}

interface HtfContextStateRow {
  symbol: string;
  timeframe: string;
  state: number;
  ref_high: number | null;
  ref_low: number | null;
  reversal_warning: number;
  bar_time: number;
  updated_at: string;
}

// 対象範囲。既存のGAS通知(gas/tradingview_discord_alert/Ananical AI.gs のSYMBOL_GROUPS)で
// 実際に運用している銘柄群にそのまま合わせている（為替28 + 貴金属2 + 仮想通貨2 + 指数3 = 35銘柄）。
// 増やす場合はTradingView側のアラート追加（銘柄×時間足の数だけ手動設定が必要）と、
// src/config/htfContextSymbols.ts の表示用カテゴリ分け、HTF_DIGEST_PICK_PRIORITYも合わせて更新する。
// exportは本番Workerの挙動には影響しない（Cloudflare Workersは`export default {...}`のみを
// エントリーポイントとして使い、他のexportは単に無視される）。単体テストでフロント側の
// 定義（src/config/htfContextSymbols.ts）との一致を検証するために付けている（tests/htfContextConsistency.test.ts）。
export const HTF_CONTEXT_ALLOWED_SYMBOLS = [
  // 為替
  'AUDCAD',
  'AUDCHF',
  'AUDJPY',
  'AUDNZD',
  'AUDUSD',
  'CADCHF',
  'CADJPY',
  'CHFJPY',
  'EURAUD',
  'EURCAD',
  'EURCHF',
  'EURGBP',
  'EURJPY',
  'EURNZD',
  'EURUSD',
  'GBPAUD',
  'GBPCAD',
  'GBPCHF',
  'GBPJPY',
  'GBPNZD',
  'GBPUSD',
  'NZDCAD',
  'NZDCHF',
  'NZDJPY',
  'NZDUSD',
  'USDCAD',
  'USDCHF',
  'USDJPY',
  // 貴金属
  'XAUUSD',
  'XAGUSD',
  // 仮想通貨
  'BTCUSDT',
  'ETHUSDT',
  // 指数
  'NAS100USD',
  'SPX500USD',
  'JP225YJPY',
] as const;
// MN1=1M(月足) / W1=1W(週足) / D1=1D(日足) / H4=240(4時間足)。Pine側のtfh入力コードと一致させる。
const HTF_CONTEXT_ALLOWED_TIMEFRAMES = ['1M', '1W', '1D', '240'] as const;
const HTF_CONTEXT_DEFAULT_FAVORITES = ['USDJPY', 'XAUUSD'];

// 検索条件プリセット（/api/htf-context/search-presets）用のマスタ・上限値。
// フロント側 src/config/htfContextSymbols.ts のHtfContextCategoryId/HtfContextTimeframeIdと
// 一致させる（workerは自己完結ファイルにする既存方針のため複製している）。
const HTF_SEARCH_PRESET_VALID_STATES = [1, -1, 2, -2, 0] as const;
const HTF_SEARCH_PRESET_VALID_REVERSAL = ['warning', 'none'] as const;
const HTF_SEARCH_PRESET_VALID_CATEGORIES = [
  'main',
  'usd-straight',
  'jpy-cross',
  'other-fx',
  'metal',
  'crypto',
  'index',
] as const;
const HTF_SEARCH_PRESET_VALID_TIMEFRAMES = ['MN1', 'W1', 'D1', 'H4'] as const;
const HTF_SEARCH_PRESET_SCHEMA_VERSION = 1;
const HTF_SEARCH_PRESET_MAX_COUNT = 20;
const HTF_SEARCH_PRESET_MAX_NAME_LENGTH = 50;
const HTF_SEARCH_PRESET_MAX_FILTERS_JSON_BYTES = 4096;

type HtfSearchFilters = {
  states: number[];
  reversal: string[];
  categories: string[];
  timeframes: string[];
  favoriteOnly: boolean;
};

// クライアントを信用せず、既知の値との突合だけで正規化する。配列が渡された場合は
// （フィルター結果が空でも）そのまま尊重する——「全解除」は正当な検索条件の一つであり、
// 未指定・不正な型のときだけ既定値（全選択）へフォールバックする。
const normalizeHtfSearchFilters = (input: unknown): HtfSearchFilters => {
  const obj = (input && typeof input === 'object' ? input : {}) as Record<
    string,
    unknown
  >;
  const states = Array.isArray(obj.states)
    ? obj.states.filter(
        (v): v is number =>
          typeof v === 'number' &&
          (HTF_SEARCH_PRESET_VALID_STATES as readonly number[]).includes(v),
      )
    : [...HTF_SEARCH_PRESET_VALID_STATES];
  const reversal = Array.isArray(obj.reversal)
    ? obj.reversal.filter(
        (v): v is string =>
          typeof v === 'string' &&
          (HTF_SEARCH_PRESET_VALID_REVERSAL as readonly string[]).includes(v),
      )
    : [...HTF_SEARCH_PRESET_VALID_REVERSAL];
  const categories = Array.isArray(obj.categories)
    ? obj.categories.filter(
        (v): v is string =>
          typeof v === 'string' &&
          (HTF_SEARCH_PRESET_VALID_CATEGORIES as readonly string[]).includes(v),
      )
    : [...HTF_SEARCH_PRESET_VALID_CATEGORIES];
  const timeframes = Array.isArray(obj.timeframes)
    ? obj.timeframes.filter(
        (v): v is string =>
          typeof v === 'string' &&
          (HTF_SEARCH_PRESET_VALID_TIMEFRAMES as readonly string[]).includes(v),
      )
    : [...HTF_SEARCH_PRESET_VALID_TIMEFRAMES];
  const favoriteOnly = obj.favoriteOnly === true;
  return { states, reversal, categories, timeframes, favoriteOnly };
};

const validateHtfPresetName = (input: unknown): string | null => {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > HTF_SEARCH_PRESET_MAX_NAME_LENGTH)
    return null;
  return trimmed;
};

const htfSearchPresetRowToJson = (r: HtfSearchPresetRow) => ({
  id: r.id,
  name: r.name,
  filters: JSON.parse(r.filters_json) as HtfSearchFilters,
  schemaVersion: r.schema_version,
  isDefault: Boolean(r.is_default),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// GET はプレミアムロール限定（既存のGPT_ALLOWED_ROLE_IDS＝プレミアム相当ロールをそのまま流用）、
// POST はTradingViewアラートWebhookからの直接呼び出し用に共有キー（HTF_CONTEXT_WRITE_KEY）で保護する。
// matome/gpt系と同様、handleApi()のverifyToken()より前段（Discord OAuthを経由しないPOSTがあるため）で処理する。
async function handleHtfContext(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const access = await verifyGptAccess(request, env);
    if (access.status !== 'allowed') {
      return gptAccessErrorResponse(access);
    }
    const { results } = await env.DB.prepare(
      'SELECT symbol, timeframe, state, ref_high, ref_low, reversal_warning, bar_time, updated_at FROM htf_context_states ORDER BY symbol, timeframe',
    ).all<HtfContextStateRow>();
    return json(
      results.map((r) => ({
        symbol: r.symbol,
        timeframe: r.timeframe,
        state: r.state,
        refHigh: r.ref_high,
        refLow: r.ref_low,
        reversalWarning: r.reversal_warning === 1,
        barTime: r.bar_time,
        updatedAt: r.updated_at,
      })),
    );
  }

  if (request.method === 'POST') {
    // TradingViewのWebhookアラートはカスタムHTTPヘッダーを指定できないため、
    // Webhook URLのクエリパラメータ(?key=...)でキーを渡す方式を主とする。
    // ヘッダーもcurl等での動作確認用に後方互換として引き続き受け付ける。
    const providedKey =
      new URL(request.url).searchParams.get('key') ??
      request.headers.get('X-Htf-Context-Write-Key') ??
      '';
    if (!env.HTF_CONTEXT_WRITE_KEY || providedKey !== env.HTF_CONTEXT_WRITE_KEY) {
      return json({ error: 'Unauthorized' }, 401);
    }
    let body: {
      symbol?: unknown;
      timeframe?: unknown;
      state?: unknown;
      refHigh?: unknown;
      refLow?: unknown;
      reversalWarning?: unknown;
      barTime?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Bad Request', code: 'INVALID_JSON' }, 400);
    }

    const symbol =
      typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : '';
    const timeframe = typeof body.timeframe === 'string' ? body.timeframe.trim() : '';
    const state =
      typeof body.state === 'number' && Number.isInteger(body.state) ? body.state : null;
    const refHigh =
      typeof body.refHigh === 'number' && Number.isFinite(body.refHigh)
        ? body.refHigh
        : null;
    const refLow =
      typeof body.refLow === 'number' && Number.isFinite(body.refLow)
        ? body.refLow
        : null;
    const reversalWarning = body.reversalWarning === true;
    const barTime =
      typeof body.barTime === 'number' && Number.isInteger(body.barTime)
        ? body.barTime
        : null;

    if (
      !(HTF_CONTEXT_ALLOWED_SYMBOLS as readonly string[]).includes(symbol) ||
      !(HTF_CONTEXT_ALLOWED_TIMEFRAMES as readonly string[]).includes(timeframe) ||
      state === null ||
      state < -2 ||
      state > 2 ||
      barTime === null
    ) {
      return json({ error: 'Bad Request', code: 'INVALID_FIELDS' }, 400);
    }

    const updatedAt = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO htf_context_states (symbol, timeframe, state, ref_high, ref_low, reversal_warning, bar_time, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(symbol, timeframe) DO UPDATE SET
         state = excluded.state,
         ref_high = excluded.ref_high,
         ref_low = excluded.ref_low,
         reversal_warning = excluded.reversal_warning,
         bar_time = excluded.bar_time,
         updated_at = excluded.updated_at`,
    )
      .bind(
        symbol,
        timeframe,
        state,
        refHigh,
        refLow,
        reversalWarning ? 1 : 0,
        barTime,
        updatedAt,
      )
      .run();

    return json({ ok: true });
  }

  return json({ error: 'Method Not Allowed' }, 405);
}

// GET /api/matome/entries/:id (公開・認証不要): Discord通知などから単体表示する。
async function handleMatomeEntry(
  request: Request,
  env: Env,
  apiPath: string,
): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Not Found' }, 404);
  const match = apiPath.match(/^matome\/entries\/([^/]+)$/);
  const id = match?.[1];
  if (!id) return json({ error: 'Not Found' }, 404);

  const row = await env.DB.prepare(
    'SELECT id, entry_date, source_url, source_author, headline, commentary, reaction_count, created_at FROM matome_entries WHERE id = ? AND hidden = 0',
  )
    .bind(id)
    .first<{
      id: string;
      entry_date: string;
      source_url: string;
      source_author: string;
      headline: string;
      commentary: string;
      reaction_count: number;
      created_at: string;
    }>();
  if (!row) return json({ error: 'Not Found' }, 404);

  return json({
    id: row.id,
    entryDate: row.entry_date,
    sourceUrl: row.source_url,
    sourceAuthor: row.source_author,
    headline: row.headline,
    commentary: row.commentary,
    reactionCount: row.reaction_count,
    createdAt: row.created_at,
  });
}

// POST /api/matome/entries/:id/react (公開・認証不要): リアクション数を1増やす。
// 匿名の軽いリアクションのため厳密な多重投票防止はサーバー側では行わない。
// フロント側でlocalStorageに反応済みIDを記録し、同一ブラウザからの連打だけを防ぐ。
async function handleMatomeReaction(
  request: Request,
  env: Env,
  apiPath: string,
): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Not Found' }, 404);
  const match = apiPath.match(/^matome\/entries\/([^/]+)\/react$/);
  const id = match?.[1];
  if (!id) return json({ error: 'Not Found' }, 404);

  const result = await env.DB.prepare(
    'UPDATE matome_entries SET reaction_count = reaction_count + 1 WHERE id = ? AND hidden = 0',
  )
    .bind(id)
    .run();
  if (result.meta.changes === 0) return json({ error: 'Not Found' }, 404);

  const row = await env.DB.prepare(
    'SELECT reaction_count FROM matome_entries WHERE id = ?',
  )
    .bind(id)
    .first<{ reaction_count: number }>();
  return json({ id, reactionCount: row?.reaction_count ?? 0 });
}

// GET /api/matome/months (公開・認証不要): 投稿がある年月の一覧を新しい順で返す。
// #/matome トップページの「過去のまとめ」アーカイブリンク生成に使う。
async function handleMatomeMonths(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Not Found' }, 404);
  const { results } = await env.DB.prepare(
    `SELECT substr(entry_date, 1, 7) as ym, COUNT(*) as count
     FROM matome_entries
     WHERE hidden = 0
     GROUP BY ym
     ORDER BY ym DESC`,
  ).all<{ ym: string; count: number }>();
  return json(results.map((r) => ({ ym: r.ym, count: r.count })));
}

const isAdmin = (userId: string, env: Env): boolean => {
  if (!env.ADMIN_USER_IDS) return false;
  return env.ADMIN_USER_IDS.split(',')
    .map((id) => id.trim())
    .includes(userId);
};

// ── GET /api/pnl/showcase (public, no auth) ─────────────────────────────────
// Exposes only date/pnl (never `notes`) for a fixed set of admin-configured
// accounts, for a single requested month. When ?year=&month= are omitted,
// defaults to the month with the highest combined profit across the showcase
// accounts (within the 12-month lookback window) so first-time visitors land
// on the most impressive track record instead of a possibly-empty
// in-progress current month; callers may still request any month up to 12
// months back via ?year=&month= (0-indexed).
async function handleShowcase(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Not Found' }, 404);

  const accountIds = (env.SHOWCASE_ACCOUNT_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  if (accountIds.length === 0) return json({ error: 'Not Found' }, 404);

  const url = new URL(request.url);
  const yearParam = url.searchParams.get('year');
  const monthParam = url.searchParams.get('month');
  if ((yearParam === null) !== (monthParam === null)) {
    return json({ error: 'Bad Request' }, 400);
  }

  const nowYmd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
  const [nowYearStr, nowMonthStr] = nowYmd.split('-');
  const nowYear = Number(nowYearStr);
  const nowMonth = Number(nowMonthStr) - 1; // 0-indexed, matches CardOpts.month

  const db = env.DB;
  const placeholders = accountIds.map(() => '?').join(',');

  let year: number;
  let month: number;
  if (yearParam !== null && monthParam !== null) {
    year = Number(yearParam);
    month = Number(monthParam);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
      return json({ error: 'Bad Request' }, 400);
    }
  } else {
    const nowYm = nowYear * 12 + nowMonth;
    const cutoffYm = nowYm - 12;
    const cutoffDate = `${Math.floor(cutoffYm / 12)}-${String((cutoffYm % 12) + 1).padStart(2, '0')}-01`;
    const { results: monthRows } = await db
      .prepare(
        `SELECT substr(date, 1, 7) as ym, SUM(pnl) as total
         FROM daily_records
         WHERE account_id IN (${placeholders}) AND date >= ? AND date <= ?
         GROUP BY ym
         ORDER BY total DESC
         LIMIT 1`,
      )
      .bind(...accountIds, cutoffDate, nowYmd)
      .all<{ ym: string; total: number }>();
    const bestYm = monthRows[0]?.ym ?? null;
    if (bestYm) {
      const [bestYearStr, bestMonthStr] = bestYm.split('-');
      year = Number(bestYearStr);
      month = Number(bestMonthStr) - 1;
    } else {
      year = nowYear;
      month = nowMonth;
    }
  }

  // Allow only the current month down to 12 months back — never the future,
  // never further back than a year (this endpoint is unauthenticated).
  const diff = nowYear * 12 + nowMonth - (year * 12 + month);
  if (diff < 0 || diff > 12) return json({ error: 'Out of range' }, 400);

  const { results: accountRows } = await db
    .prepare(`SELECT id, name, unit FROM accounts WHERE id IN (${placeholders})`)
    .bind(...accountIds)
    .all<{ id: string; name: string; unit: string }>();
  if (accountRows.length === 0) return json({ error: 'Not Found' }, 404);

  // Preserve the order configured in SHOWCASE_ACCOUNT_IDS (SQL `IN` doesn't).
  const accountsById = new Map(accountRows.map((a) => [a.id, a]));
  const orderedAccounts = accountIds
    .map((id) => accountsById.get(id))
    .filter((a): a is { id: string; name: string; unit: string } => a !== undefined);

  const monthStr = String(month + 1).padStart(2, '0');
  const { results: recordRows } = await db
    .prepare(
      `SELECT account_id, date, pnl FROM daily_records WHERE account_id IN (${placeholders}) AND date LIKE ?`,
    )
    .bind(...accountIds, `${year}-${monthStr}-%`)
    .all<{ account_id: string; date: string; pnl: number }>();

  return json({
    year,
    month,
    accounts: orderedAccounts.map((acc) => ({
      accountId: acc.id,
      accountName: acc.name,
      unit: acc.unit,
      records: recordRows
        .filter((r) => r.account_id === acc.id)
        .map((r) => ({ date: r.date, pnl: r.pnl })),
    })),
  });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  const apiPath = pathname.replace(/^\/api\//, '');
  const segments = apiPath.split('/');
  const method = request.method;
  const db = env.DB;

  if (apiPath === 'gpt/oauth/authorize' || apiPath === 'gpt/oauth/v1/authorize') {
    return handleGptOAuthAuthorize(request);
  }
  if (apiPath === 'gpt/oauth/token' || apiPath === 'gpt/oauth/v1/token') {
    return handleGptOAuthToken(request, env);
  }
  if (apiPath === 'gpt/access') {
    return handleGptAccess(request, env);
  }
  if (apiPath === 'gpt/knowledge/search') {
    return handleGptKnowledgeSearch(request, env);
  }
  if (apiPath === 'matome/entries') {
    return handleMatomeEntries(request, env);
  }
  if (apiPath.startsWith('matome/entries/') && apiPath.endsWith('/react')) {
    return handleMatomeReaction(request, env, apiPath);
  }
  if (apiPath.startsWith('matome/entries/')) {
    return handleMatomeEntry(request, env, apiPath);
  }
  if (apiPath === 'matome/months') {
    return handleMatomeMonths(request, env);
  }
  if (apiPath === 'htf-context') {
    return handleHtfContext(request, env);
  }

  const userId = await verifyToken(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  // ── GET /api/pnl/accounts ────────────────────────────────────────────────
  if (apiPath === 'pnl/accounts' && method === 'GET') {
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
    return json(
      { id: body.id, name: body.name, unit: body.unit, createdAt: body.createdAt },
      201,
    );
  }

  // ── PATCH /api/pnl/accounts/:id ─────────────────────────────────────────
  if (
    apiPath.startsWith('pnl/accounts/') &&
    method === 'PATCH' &&
    segments.length === 3
  ) {
    const accountId = segments[2];
    const body = (await request.json()) as { unit?: string; name?: string };
    const row = await db
      .prepare('SELECT id FROM accounts WHERE id = ? AND discord_user_id = ?')
      .bind(accountId, userId)
      .first<{ id: string }>();
    if (!row) return json({ error: 'Not Found' }, 404);
    const setParts: string[] = [];
    const binds: string[] = [];
    if (body.name !== undefined) {
      setParts.push('name = ?');
      binds.push(body.name.trim());
    }
    if (body.unit !== undefined) {
      setParts.push('unit = ?');
      binds.push(body.unit.trim());
    }
    if (setParts.length > 0) {
      await db
        .prepare(
          `UPDATE accounts SET ${setParts.join(', ')} WHERE id = ? AND discord_user_id = ?`,
        )
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
    return json({
      id,
      accountId: body.accountId,
      date: body.date,
      pnl: body.pnl,
      notes: notes ?? undefined,
    });
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
    const list = Array.isArray(body.favorites)
      ? (body.favorites as string[]).slice(0, 30)
      : [];
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

  // ── GET /api/htf-context/favorites ───────────────────────────────────────
  // Anyanical Market Dashboardの銘柄お気に入り。ナビ用の/api/favoritesとは別カラムで管理する
  // （ページ favoriteと銘柄favoriteは意味が異なり、同じ30件上限リストに混在させたくないため）。
  if (apiPath === 'htf-context/favorites' && method === 'GET') {
    const row = await db
      .prepare(
        'SELECT htf_context_favorites_json FROM user_settings WHERE discord_user_id = ?',
      )
      .bind(userId)
      .first<{ htf_context_favorites_json: string }>();
    // 行が存在しない(=一度もPUTしたことがない)ユーザーには既定のお気に入りを返す。
    // 明示的に空へ整理したユーザー(行はあるがfavorites=[])とは区別する。
    if (!row) {
      return json({ favorites: HTF_CONTEXT_DEFAULT_FAVORITES, isDefault: true });
    }
    const favorites = JSON.parse(row.htf_context_favorites_json) as string[];
    return json({ favorites, isDefault: false });
  }

  // ── PUT /api/htf-context/favorites ───────────────────────────────────────
  if (apiPath === 'htf-context/favorites' && method === 'PUT') {
    const body = (await request.json()) as { favorites: unknown };
    const list = Array.isArray(body.favorites)
      ? body.favorites.filter((s): s is string => typeof s === 'string').slice(0, 30)
      : [];
    const favJson = JSON.stringify(list);
    await db
      .prepare(
        `INSERT INTO user_settings (discord_user_id, htf_context_favorites_json) VALUES (?, ?)
         ON CONFLICT(discord_user_id) DO UPDATE SET htf_context_favorites_json = excluded.htf_context_favorites_json`,
      )
      .bind(userId, favJson)
      .run();
    return json({ ok: true });
  }

  // ── GET /api/htf-context/search-presets ───────────────────────────────────
  // 検索条件プリセット。htf-context/favoritesと同じ認証方式（プレミアムロール限定の
  // verifyGptAccessではなく、一般Discordログイン=verifyTokenでスコープする）。
  if (apiPath === 'htf-context/search-presets' && method === 'GET') {
    const { results } = await db
      .prepare(
        `SELECT id, name, filters_json, schema_version, is_default, created_at, updated_at
         FROM htf_context_search_presets WHERE discord_user_id = ? ORDER BY created_at ASC`,
      )
      .bind(userId)
      .all<HtfSearchPresetRow>();
    return json({ presets: results.map(htfSearchPresetRowToJson) });
  }

  // ── POST /api/htf-context/search-presets ──────────────────────────────────
  if (apiPath === 'htf-context/search-presets' && method === 'POST') {
    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      filters?: unknown;
    } | null;
    if (!body) return json({ error: 'Invalid JSON body' }, 400);

    const name = validateHtfPresetName(body.name);
    if (!name) return json({ error: 'Invalid preset name' }, 400);

    const filters = normalizeHtfSearchFilters(body.filters);
    const filtersJson = JSON.stringify(filters);
    if (filtersJson.length > HTF_SEARCH_PRESET_MAX_FILTERS_JSON_BYTES) {
      return json({ error: 'Filters too large' }, 400);
    }

    const countRow = await db
      .prepare(
        'SELECT COUNT(*) as c FROM htf_context_search_presets WHERE discord_user_id = ?',
      )
      .bind(userId)
      .first<{ c: number }>();
    if ((countRow?.c ?? 0) >= HTF_SEARCH_PRESET_MAX_COUNT) {
      return json({ error: 'Preset limit reached' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO htf_context_search_presets
          (id, discord_user_id, name, filters_json, schema_version, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      )
      .bind(id, userId, name, filtersJson, HTF_SEARCH_PRESET_SCHEMA_VERSION, now, now)
      .run();
    return json(
      {
        id,
        name,
        filters,
        schemaVersion: HTF_SEARCH_PRESET_SCHEMA_VERSION,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      },
      201,
    );
  }

  // ── PUT /api/htf-context/search-presets/:id ────────────────────────────────
  if (
    apiPath.startsWith('htf-context/search-presets/') &&
    method === 'PUT' &&
    segments.length === 3
  ) {
    const presetId = segments[2];
    const existing = await db
      .prepare(
        'SELECT id FROM htf_context_search_presets WHERE id = ? AND discord_user_id = ?',
      )
      .bind(presetId, userId)
      .first<{ id: string }>();
    if (!existing) return json({ error: 'Not Found' }, 404);

    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      filters?: unknown;
    } | null;
    if (!body) return json({ error: 'Invalid JSON body' }, 400);

    const setParts: string[] = [];
    const binds: (string | number)[] = [];
    if (body.name !== undefined) {
      const name = validateHtfPresetName(body.name);
      if (!name) return json({ error: 'Invalid preset name' }, 400);
      setParts.push('name = ?');
      binds.push(name);
    }
    if (body.filters !== undefined) {
      const filters = normalizeHtfSearchFilters(body.filters);
      const filtersJson = JSON.stringify(filters);
      if (filtersJson.length > HTF_SEARCH_PRESET_MAX_FILTERS_JSON_BYTES) {
        return json({ error: 'Filters too large' }, 400);
      }
      setParts.push('filters_json = ?');
      binds.push(filtersJson);
    }
    if (setParts.length === 0) return json({ error: 'Nothing to update' }, 400);

    const now = new Date().toISOString();
    setParts.push('updated_at = ?');
    binds.push(now);
    await db
      .prepare(
        `UPDATE htf_context_search_presets SET ${setParts.join(', ')} WHERE id = ? AND discord_user_id = ?`,
      )
      .bind(...binds, presetId, userId)
      .run();
    return json({ ok: true, updatedAt: now });
  }

  // ── DELETE /api/htf-context/search-presets/:id ─────────────────────────────
  if (
    apiPath.startsWith('htf-context/search-presets/') &&
    method === 'DELETE' &&
    segments.length === 3
  ) {
    const presetId = segments[2];
    const existing = await db
      .prepare(
        'SELECT id FROM htf_context_search_presets WHERE id = ? AND discord_user_id = ?',
      )
      .bind(presetId, userId)
      .first<{ id: string }>();
    if (!existing) return json({ error: 'Not Found' }, 404);
    await db
      .prepare(
        'DELETE FROM htf_context_search_presets WHERE id = ? AND discord_user_id = ?',
      )
      .bind(presetId, userId)
      .run();
    return json({ ok: true });
  }

  // ── PUT /api/htf-context/search-presets/:id/default ─────────────────────────
  if (
    apiPath.startsWith('htf-context/search-presets/') &&
    method === 'PUT' &&
    segments.length === 4 &&
    segments[3] === 'default'
  ) {
    const presetId = segments[2];
    const existing = await db
      .prepare(
        'SELECT id FROM htf_context_search_presets WHERE id = ? AND discord_user_id = ?',
      )
      .bind(presetId, userId)
      .first<{ id: string }>();
    if (!existing) return json({ error: 'Not Found' }, 404);

    const now = new Date().toISOString();
    // 部分ユニークインデックス（1ユーザーにつき既定は1件まで）に違反しないよう、
    // 先に他行の既定を解除してから対象行を既定にする。db.batch()で1トランザクションとして扱う。
    await db.batch([
      db
        .prepare(
          'UPDATE htf_context_search_presets SET is_default = 0, updated_at = ? WHERE discord_user_id = ? AND is_default = 1',
        )
        .bind(now, userId),
      db
        .prepare(
          'UPDATE htf_context_search_presets SET is_default = 1, updated_at = ? WHERE id = ? AND discord_user_id = ?',
        )
        .bind(now, presetId, userId),
    ]);
    return json({ ok: true });
  }

  // ── DELETE /api/pnl/records/:accountId/:date ─────────────────────────────
  if (
    apiPath.startsWith('pnl/records/') &&
    method === 'DELETE' &&
    segments.length === 4
  ) {
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
        id: r.id,
        weekKey: r.week_key,
        symbol: r.symbol,
        direction: r.direction,
        confidence: r.confidence,
        note: r.note,
        createdAt: r.created_at,
      })),
    );
  }

  // ── PUT /api/gap-predictions ─────────────────────────────────────────────
  if (apiPath === 'gap-predictions' && method === 'PUT') {
    const body = (await request.json()) as { predictions: GapPredictionRow[] };
    const list = Array.isArray(body.predictions) ? body.predictions.slice(0, 200) : [];
    await db
      .prepare('DELETE FROM gap_predictions WHERE discord_user_id = ?')
      .bind(userId)
      .run();
    if (list.length > 0) {
      await db.batch(
        list.map((p) =>
          db
            .prepare(
              'INSERT INTO gap_predictions (id, discord_user_id, week_key, symbol, direction, confidence, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            )
            .bind(
              p.id ?? crypto.randomUUID(),
              userId,
              p.weekKey ?? p.week_key,
              p.symbol,
              p.direction,
              p.confidence,
              p.note ?? '',
              p.createdAt ?? p.created_at,
            ),
        ),
      );
    }
    return json({ ok: true });
  }

  // ── GET /api/daily-missions?date=YYYY-MM-DD ─────────────────────────────
  if (apiPath === 'daily-missions' && method === 'GET') {
    const date = new URL(request.url).searchParams.get('date');
    if (!date) return json({ error: 'Bad Request' }, 400);
    const row = await db
      .prepare(
        'SELECT completed_json FROM daily_missions WHERE discord_user_id = ? AND date = ?',
      )
      .bind(userId, date)
      .first<{ completed_json: string }>();
    const completedIds: string[] = row
      ? (JSON.parse(row.completed_json) as string[])
      : [];
    return json({ completedIds });
  }

  // ── PUT /api/daily-missions ──────────────────────────────────────────────
  if (apiPath === 'daily-missions' && method === 'PUT') {
    const body = (await request.json()) as { date?: string; completedIds?: unknown };
    const date = body.date;
    const completedIds = Array.isArray(body.completedIds)
      ? (body.completedIds as string[])
          .filter((id) => typeof id === 'string')
          .slice(0, 50)
      : [];
    if (!date) return json({ error: 'Bad Request' }, 400);
    await db
      .prepare(
        `INSERT INTO daily_missions (discord_user_id, date, completed_json, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(discord_user_id, date) DO UPDATE SET completed_json = excluded.completed_json, updated_at = excluded.updated_at`,
      )
      .bind(userId, date, JSON.stringify(completedIds), new Date().toISOString())
      .run();
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
        id: r.id,
        typeCode: r.type_code,
        answers: r.answers_json ? (JSON.parse(r.answers_json) as unknown) : {},
        createdAt: r.created_at,
      })),
    );
  }

  // ── POST /api/quiz-results ───────────────────────────────────────────────
  if (apiPath === 'quiz-results' && method === 'POST') {
    const body = (await request.json()) as {
      id: string;
      typeCode: string;
      answers?: Record<string, string>;
      createdAt: string;
    };
    await db
      .prepare(
        'INSERT OR IGNORE INTO quiz_results (id, discord_user_id, type_code, answers_json, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(
        body.id,
        userId,
        body.typeCode,
        body.answers ? JSON.stringify(body.answers) : null,
        body.createdAt,
      )
      .run();
    return json({ ok: true }, 201);
  }

  // ── GET /api/games/scores?game=highlow ───────────────────────────────────
  if (apiPath === 'games/scores' && method === 'GET') {
    const game = new URL(request.url).searchParams.get('game');
    if (!isValidGame(game)) return json({ error: 'Bad Request' }, 400);
    const [bestRes, recentRes] = await db.batch([
      db
        .prepare(
          'SELECT MAX(score) AS best_score, MAX(best_streak) AS best_streak FROM game_scores WHERE discord_user_id = ? AND game = ?',
        )
        .bind(userId, game),
      db
        .prepare(
          'SELECT id, score, best_streak, meta_json, created_at FROM game_scores WHERE discord_user_id = ? AND game = ? ORDER BY created_at DESC LIMIT 10',
        )
        .bind(userId, game),
    ]);
    const best = bestRes.results[0] as {
      best_score: number | null;
      best_streak: number | null;
    };
    return json({
      bestScore: best?.best_score ?? 0,
      bestStreak: best?.best_streak ?? 0,
      recent: (recentRes.results as GameScoreRow[]).map((r) => ({
        id: r.id,
        score: r.score,
        bestStreak: r.best_streak,
        meta: r.meta_json ? (JSON.parse(r.meta_json) as unknown) : undefined,
        createdAt: r.created_at,
      })),
    });
  }

  // ── POST /api/games/scores ───────────────────────────────────────────────
  if (apiPath === 'games/scores' && method === 'POST') {
    const body = (await request.json()) as {
      game: unknown;
      score: unknown;
      bestStreak?: unknown;
      meta?: unknown;
    };
    if (!isValidGame(body.game)) return json({ error: 'Bad Request' }, 400);
    const score = Number(body.score);
    const bestStreak = Number(body.bestStreak ?? 0);
    if (
      !Number.isInteger(score) ||
      score < 0 ||
      score > 1_000_000_000 ||
      !Number.isInteger(bestStreak) ||
      bestStreak < 0 ||
      bestStreak > 1_000_000
    ) {
      return json({ error: 'Bad Request' }, 400);
    }
    const metaJson = body.meta !== undefined ? JSON.stringify(body.meta) : null;
    if (metaJson !== null && metaJson.length > 2000)
      return json({ error: 'Bad Request' }, 400);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    // discord_user_id は必ずトークン由来の userId を使う（ボディからは受け取らない）
    await db
      .prepare(
        'INSERT INTO game_scores (id, discord_user_id, game, score, best_streak, meta_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(id, userId, body.game, score, bestStreak, metaJson, createdAt)
      .run();
    return json({ id, score, bestStreak, createdAt }, 201);
  }

  // ── GET /api/games/leaderboard?game=highlow&limit=10 ─────────────────────
  if (apiPath === 'games/leaderboard' && method === 'GET') {
    const url = new URL(request.url);
    const game = url.searchParams.get('game');
    if (!isValidGame(game)) return json({ error: 'Bad Request' }, 400);
    const limitParam = Number(url.searchParams.get('limit') ?? 10);
    const limit = Number.isInteger(limitParam)
      ? Math.min(Math.max(limitParam, 1), 50)
      : 10;
    const { results } = await db
      .prepare(
        `SELECT discord_user_id, MAX(score) AS best_score, MAX(best_streak) AS best_streak, MAX(created_at) AS last_played
         FROM game_scores WHERE game = ? GROUP BY discord_user_id ORDER BY best_score DESC LIMIT ?`,
      )
      .bind(game, limit)
      .all<{
        discord_user_id: string;
        best_score: number;
        best_streak: number;
        last_played: string;
      }>();
    return json(
      results.map((r, i) => ({
        rank: i + 1,
        // プライバシー配慮: IDは末尾4桁のみ返す（本人判定用にisMeを付与）
        userTag: `****${r.discord_user_id.slice(-4)}`,
        isMe: r.discord_user_id === userId,
        bestScore: r.best_score,
        bestStreak: r.best_streak,
        lastPlayed: r.last_played,
      })),
    );
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
        discordUserId: r.discord_user_id,
        weekKey: r.week_key,
        symbol: r.symbol,
        direction: r.direction,
        confidence: r.confidence,
        note: r.note,
        createdAt: r.created_at,
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
      results.map((r) => ({
        discordUserId: r.discord_user_id,
        typeCode: r.type_code,
        createdAt: r.created_at,
      })),
    );
  }

  // ── GET /api/admin/users/:discordId ──────────────────────────────────────
  if (apiPath.startsWith('admin/users/') && method === 'GET' && segments.length === 3) {
    if (!isAdmin(userId, env)) return json({ error: 'Forbidden' }, 403);
    const targetId = segments[2];
    const [accountsRes, recordsRes] = await db.batch([
      db
        .prepare(
          'SELECT id, name, unit, created_at FROM accounts WHERE discord_user_id = ?',
        )
        .bind(targetId),
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

  // ── PATCH /api/admin/matome-entries/:id ──────────────────────────────────
  if (
    apiPath.startsWith('admin/matome-entries/') &&
    method === 'PATCH' &&
    segments.length === 3
  ) {
    if (!isAdmin(userId, env)) return json({ error: 'Forbidden' }, 403);
    const entryId = segments[2];
    const body = (await request.json()) as { hidden?: unknown };
    if (typeof body.hidden !== 'boolean') return json({ error: 'Bad Request' }, 400);
    const result = await db
      .prepare('UPDATE matome_entries SET hidden = ? WHERE id = ?')
      .bind(body.hidden ? 1 : 0, entryId)
      .run();
    if (result.meta.changes === 0) return json({ error: 'Not Found' }, 404);
    return json({ id: entryId, hidden: body.hidden });
  }

  return json({ error: 'Not Found' }, 404);
}

// ── HTFコンテキスト Discord定期ダイジェスト（Cron Trigger） ───────────────────
// 埋め込みの体裁・Tips文言は既存GAS通知(gas/tradingview_discord_alert/Ananical AI.gs)を踏襲するが、
// 選定ロジックは独自: 全銘柄を並べるのではなく「反転警戒なし・レンジでない・上位足と方向一致」の
// 良条件のみを、メイン→ドルスト残り+クロス円→指数→その他 の優先度順に走査して最大5件だけ拾い、
// 時間足ごとに1本の埋め込みへ集約する（カテゴリ別に分けて複数本送らない）。
// データ源はhtf_context_states(D1)のスナップショット読み取りのみで、GAS側にあった
// 「揃うまで待つ/タイムアウトで確定」という完了判定は不要（D1に既に最新状態がupsertされているため）。
type HtfDigestTimeframe = 'H4' | 'D1' | 'W1' | 'MN1';

const HTF_DIGEST_PINE_CODE: Record<HtfDigestTimeframe, string> = {
  H4: '240',
  D1: '1D',
  W1: '1W',
  MN1: '1M',
};

// D1/W1/MN1のアンカーはUTC 00:00(=JST 09:00)固定。仮想通貨(UTC日足)基準ではなく、対象銘柄の大半を
// 占める為替/貴金属の日足終値（NYクローズ17:00、夏時間UTC21:00=JST06:00、冬時間UTC22:00=JST07:00）から
// 2〜3時間のバッファを確保できる時刻として選定した。日足以上は数時間のズレが実害になりにくいため、
// 夏/冬時間の自動追従はせず固定UTC時刻とし、ズレはこのバッファ幅で吸収する方針のまま。
// H4だけは4時間ごとの実際のローソク境界（NYクローズ起点）に対して数時間ズレると鮮度が大きく落ちるため、
// 下のisH4DigestDue()でNY(米東部)の夏時間/冬時間を判定し動的に境界時刻を切り替える
// （gas/tradingview_discord_alert/Ananical AI.gs のisUSSummerTime()と同じ判定式を移植）。
// Cron式(wrangler.jsoncのtriggers.cronsと一致させる) → 対応する時間足。H4はisH4DigestDue()で別途判定するため含めない。
const HTF_DIGEST_CRON_TIMEFRAME: Record<string, HtfDigestTimeframe> = {
  '0 0 * * *': 'D1',
  '0 0 * * 1': 'W1',
  '0 0 1 * *': 'MN1',
};

const HTF_DIGEST_H4_CRON = '*/10 * * * *';
// NYクローズ(17:00 NY)から30分後を基準時刻とする。夏時間: NY17:00=UTC21:00、冬時間: NY17:00=UTC22:00。
const HTF_H4_BOUNDARY_BUFFER_MIN = 30;
const HTF_H4_ANCHOR_HOURS_UTC_SUMMER = [21, 1, 5, 9, 13, 17];
const HTF_H4_ANCHOR_HOURS_UTC_WINTER = [22, 2, 6, 10, 14, 18];

// 米国夏時間(DST)判定。3月第2日曜2:00開始〜11月第1日曜2:00終了。
// gas/tradingview_discord_alert/Ananical AI.gs の isUSSummerTime() と同じ計算式のTypeScript移植。
const isUsSummerTime = (now: Date): boolean => {
  const y = now.getUTCFullYear();
  const mar14 = new Date(Date.UTC(y, 2, 14));
  const nov7 = new Date(Date.UTC(y, 10, 7));
  const dstStart = new Date(Date.UTC(y, 2, 14 - mar14.getUTCDay(), 2));
  const dstEnd = new Date(Date.UTC(y, 10, 7 - nov7.getUTCDay(), 2));
  return now.getTime() >= dstStart.getTime() && now.getTime() < dstEnd.getTime();
};

// H4ダイジェストの発火判定。10分おきに呼ばれ、直近10分以内に境界+バッファ時刻を通過していればtrue。
// （Cronの実行タイミングの多少のジッタで発火を取りこぼさないよう「直後10分以内」の範囲判定にしている）
const isH4DigestDue = (now: Date): boolean => {
  const anchors = isUsSummerTime(now)
    ? HTF_H4_ANCHOR_HOURS_UTC_SUMMER
    : HTF_H4_ANCHOR_HOURS_UTC_WINTER;
  const nowMinuteOfDay = now.getUTCHours() * 60 + now.getUTCMinutes();
  return anchors.some((h) => {
    const target = (h * 60 + HTF_H4_BOUNDARY_BUFFER_MIN) % 1440;
    const diff = (((nowMinuteOfDay - target) % 1440) + 1440) % 1440;
    return diff < 10;
  });
};

const HTF_DIGEST_TITLE_TIER: Record<HtfDigestTimeframe, string> = {
  H4: '1m-15m-4h',
  D1: '5m-1h-1D',
  W1: '15m-4h-1W',
  MN1: '1h-1D-1M',
};

const HTF_DIGEST_LOOKBACK_NOTE: Record<HtfDigestTimeframe, string> = {
  H4: '🌸 通知は最大4時間前まで遡ってね！',
  D1: '📅 通知は最大1日前まで遡ってね！',
  W1: '🗓 通知は1週間前まで遡ってね！',
  MN1: '🌙 通知は1ヶ月前まで遡ってね！',
};

const getHtfDigestWebhook = (
  env: Env,
  timeframe: HtfDigestTimeframe,
): string | undefined => {
  switch (timeframe) {
    case 'H4':
      return env.HTF_DIGEST_WEBHOOK_H4;
    case 'D1':
      return env.HTF_DIGEST_WEBHOOK_D1;
    case 'W1':
      return env.HTF_DIGEST_WEBHOOK_W1;
    case 'MN1':
      return env.HTF_DIGEST_WEBHOOK_MN1;
  }
};

// 「良い条件」の優先度順（重複なし）。メイン→ドルスト残り+クロス円→指数→その他 の順で走査し、
// 条件を満たしたものを先頭からHTF_DIGEST_PICK_LIMIT件だけ拾う。
// メイン(USDJPY/XAUUSD/EURUSD/GBPUSD)は他カテゴリとの重複銘柄のため、後続グループには含めていない。
export const HTF_DIGEST_PICK_PRIORITY: string[] = [
  // メイン
  'USDJPY',
  'XAUUSD',
  'EURUSD',
  'GBPUSD',
  // ドルストレート残り + クロス円
  'AUDUSD',
  'NZDUSD',
  'USDCAD',
  'USDCHF',
  'EURJPY',
  'GBPJPY',
  'AUDJPY',
  'NZDJPY',
  'CADJPY',
  'CHFJPY',
  // 指数
  'NAS100USD',
  'SPX500USD',
  'JP225YJPY',
  // その他（その他通貨 + 貴金属残り + 仮想通貨）
  'AUDCAD',
  'AUDCHF',
  'AUDNZD',
  'CADCHF',
  'EURAUD',
  'EURCAD',
  'EURCHF',
  'EURGBP',
  'EURNZD',
  'GBPAUD',
  'GBPCAD',
  'GBPCHF',
  'GBPNZD',
  'NZDCAD',
  'NZDCHF',
  'XAGUSD',
  'BTCUSDT',
  'ETHUSDT',
];

const HTF_DIGEST_PICK_LIMIT = 5;

// 「上位足と方向一致」の確認先（H4→D1→W1→MN1の順。MN1はこれ以上の上位足を扱っていないため確認しない）。
export const HTF_DIGEST_HIGHER_TIMEFRAME: Partial<
  Record<HtfDigestTimeframe, HtfDigestTimeframe>
> = {
  H4: 'D1',
  D1: 'W1',
  W1: 'MN1',
};

// gas/tradingview_discord_alert/Ananical AI.gs の TIPS_LIST とそのまま揃える。
const HTF_DIGEST_TIPS = [
  '🌸 上位足の方向には逆らわないのがコツだよ！',
  '✨ 損切りは『次のチャンスへの入場料』、怖くないよ。',
  '🎀 分からない時は『何もしない』のも立派なトレードだよ。',
  '🌙 深夜の無理なエントリーは、お肌にも資金にも優しくないよ。',
  '💎 利益を追うより、リスクを管理する方がずっと大事だよ。',
  '🌸 監視足の確定を見てから執行足でタイミングを測るのが王道だね！',
  '✨ チャートに張り付くより、心に余裕がある時の方が勝てるかも？',
  '🎯 『勝つこと』より『負けないこと』を意識すると結果がついてくるよ。',
  '🧭 自分のトレードスタイルを持ってる人が最終的に一番強いよ。',
  '🪴 トレードは短距離走じゃなくてマラソン。ゆっくり育てていこうね。',
  '🛡 1回のトレードでリスクは資金の2%以内が安心だよ。',
  '📏 ロットは『負けても平気な量』で入るのが長生きのコツだよ。',
  '⚖️ リスクリワード1:2以上を意識するだけで、勝率50%でも利益が残るよ。',
  '🚫 ナンピンは計画的に。感情のナンピンは資金が溶けるよ…。',
  '💰 含み益は利益じゃないよ。確定して初めてお金になるんだよ。',
  '🧮 勝率よりも期待値。10回中3回でも大きく勝てればプラスだよ。',
  '🪤 全額投入は一発退場の入り口だよ。余力は常に残してね。',
  '📉 最大ドローダウンを想定しておくと、暴落でもパニックにならないよ。',
  '🎯 エントリーの根拠を言葉にできないなら、それはギャンブルかも？',
  '⏰ 指標発表の前後はスプレッドが広がるから気をつけてね。',
  '📊 レンジ相場を無理にトレードしなくていいよ。トレンドを待とう！',
  '🔍 押し目・戻りを待てる人が最終的に勝つよ。焦らないでね。',
  '🏁 利確も技術のうち。欲張りすぎると建値で返されるよ。',
  '🚪 エントリーする前に『どこで逃げるか』を決めておくのが鉄則だよ。',
  '🎣 チャンスは待ってれば来る。飛び乗りエントリーは火傷のもとだよ。',
  '⛳ 『ここで入らなきゃ』は幻想だよ。見送ったチャンスは損失じゃないよ。',
  '🔔 アラートを使えば、チャートを見続けなくてもタイミングを逃さないよ。',
  '🧩 複数の根拠が重なるポイントほど、勝率が高くなるよ。',
  '📈 トレンド初動より、トレンドの途中に乗る方が安全だよ。',
  '🎪 髭で狩られたくなければ、損切り位置に少し余裕を持たせてね。',
  '🧘 負けた後すぐリベンジトレードするのは一番やっちゃダメなパターンだよ。',
  '📓 トレード日記をつけると、自分のクセが見えてくるよ。',
  '☕ 連敗したら一回休憩。相場は明日もあるよ。',
  '🌈 勝ちトレードより、ルール通りにできたトレードを褒めてあげてね。',
  '💤 睡眠不足の判断力は酔っ払いと同じって言われてるよ。ちゃんと寝てね。',
  '🪞 他人のトレードと比べないで。自分のペースが一番大事だよ。',
  '🎭 感情でポジションサイズを変えるのは危険サインだよ。',
  '🫧 SNSの爆益報告は生存者バイアスだよ。惑わされないでね。',
  '🧸 大きく負けた日は、チャートを閉じてお気に入りの動画でも見ようね。',
  '🏔 勝てるようになるまでの道のりは長いけど、続けた人だけがたどり着くよ。',
  '🎵 音楽聴きながらのトレードもアリだよ。リラックスが大事。',
  '📵 ポジション持ったまま寝落ちは危険だよ。逆指値は必ず入れてね。',
  '📅 月曜と金曜はダマシが多いから慎重にね。',
  '🌍 ロンドン時間とNY時間の重なる21〜24時はボラが高まるよ。',
  '🔄 トレンドの転換は一瞬じゃなくて、レンジを経由することが多いよ。',
  '📐 水平線は多くの人が見てるから、それだけで強い根拠になるよ。',
  '🐢 コツコツ積み上げた利益を、一発で飛ばさない仕組みが大事だよ。',
  '🏦 中央銀行の発言は相場を大きく動かすよ。要人発言カレンダーは要チェック。',
  '🌊 相場には波があるよ。波に逆らわず、波に乗る意識を持とうね。',
  '📆 月末・四半期末はリバランスの流れで普段と違う動きが出やすいよ。',
  '🔗 通貨の相関を意識すると、ダマシを減らせるよ。',
  '⛽ ゴールドはリスクオフで買われやすいよ。株が下がった時は注目してね。',
  '🗞 噂で買って事実で売る。織り込み済みの材料で逆に動くこともあるよ。',
  '🧊 ボラが低い時は無理に入らなくていいよ。嵐の前の静けさかもしれないけどね。',
  '📉 下落トレンドは上昇より速いよ。ショートは利確タイミングに注意してね。',
  '🌐 ドルインデックスを見ておくと、ドルストレート全体の方向感が掴めるよ。',
  '🔭 大きな足で方向を見て、小さな足でタイミングを取るのが基本だよ。',
  '🗺 日足で迷ったら週足を見てみて。景色が全然違うよ。',
  '⏳ 5分足で振り回されてたら、一度15分足に切り替えてみて。落ち着くよ。',
  '🎶 MTF分析は上位足→下位足の順番が大事。下から見ると迷子になるよ。',
  '🔬 執行足だけ見てると木を見て森を見ずになるよ。環境認識足も忘れずにね。',
];

const pickHtfDigestTip = (): string =>
  HTF_DIGEST_TIPS[Math.floor(Math.random() * HTF_DIGEST_TIPS.length)];

// GASの「Ananical AI.gs」と同じオリジナルキャラクター画像リスト（embedのthumbnailに使う）
const HTF_DIGEST_ICON_LIST = [
  'https://drive.google.com/uc?export=view&id=19IXswqrbE1JOeEef_zxWjSjo_0neUyVH',
  'https://drive.google.com/uc?export=view&id=1wuCVbS7I6fm9onyb-P5w0-Gs4UfBt-lU',
  'https://drive.google.com/uc?export=view&id=1jR6tY_dZS6mN_l0epUybrBnhLhdDxXO3',
  'https://drive.google.com/uc?export=view&id=1cE6PDXseF-LqIzAG4I7Jz1mw6n_GE78X',
  'https://drive.google.com/uc?export=view&id=1ItUbP1QfG2TGBQBTj4ASzCm8wpaOb4-y',
  'https://drive.google.com/uc?export=view&id=12wLRfr1qRto6oM-GHxv4ExluHTV_jF3j',
  'https://drive.google.com/uc?export=view&id=1xD9DQPetkiSSyhe2-dEIvlWYvOmlUe7j',
  'https://drive.google.com/uc?export=view&id=1yJMWpFhhDZBPtOoxdLTCtg3hN1qDCRwk',
  'https://drive.google.com/uc?export=view&id=1xOqaiPh1LiFvfINzlWPKB7MZZ0mu09cB',
  'https://drive.google.com/uc?export=view&id=1xOqaiPh1LiFvfINzlWPKB7MZZ0mu09cB',
  'https://drive.google.com/uc?export=view&id=1Bb_tFopiQrCueB8y43uMZeuILwO4te37',
  'https://drive.google.com/uc?export=view&id=1QEHvYVarRSHsD87D2LQCc2dENHQOyuS2',
  'https://drive.google.com/uc?export=view&id=1_FhWywI4v0IMCKbuChGb0s5jf2mOaWhj',
  'https://drive.google.com/uc?export=view&id=11XOy0bn9j6DKsfGsmxxW6RQ-BmvG0VXo',
  'https://drive.google.com/uc?export=view&id=1Xf70I9jC9W9w-DctMbJF6pZs4OieBecH',
];

const pickHtfDigestIcon = (): string =>
  HTF_DIGEST_ICON_LIST[Math.floor(Math.random() * HTF_DIGEST_ICON_LIST.length)];

async function sendHtfContextDigest(
  env: Env,
  timeframe: HtfDigestTimeframe,
): Promise<void> {
  const webhookUrl = getHtfDigestWebhook(env, timeframe);
  if (!webhookUrl) return;

  const pineCode = HTF_DIGEST_PINE_CODE[timeframe];
  const { results } = await env.DB.prepare(
    'SELECT symbol, state, reversal_warning, bar_time, last_digest_bar_time FROM htf_context_states WHERE timeframe = ?',
  )
    .bind(pineCode)
    .all<{
      symbol: string;
      state: number;
      reversal_warning: number;
      bar_time: number;
      last_digest_bar_time: number | null;
    }>();
  const stateBySymbol = new Map(results.map((r) => [r.symbol, r]));

  const higherTimeframe = HTF_DIGEST_HIGHER_TIMEFRAME[timeframe];
  let higherStateBySymbol: Map<string, { state: number }> | null = null;
  if (higherTimeframe) {
    const higherPineCode = HTF_DIGEST_PINE_CODE[higherTimeframe];
    const { results: higherResults } = await env.DB.prepare(
      'SELECT symbol, state FROM htf_context_states WHERE timeframe = ?',
    )
      .bind(higherPineCode)
      .all<{ symbol: string; state: number }>();
    higherStateBySymbol = new Map(higherResults.map((r) => [r.symbol, r]));
  }

  // 良い条件 = 反転警戒がない・レンジ(中立)でない・（上位足がある場合は）上位足と方向一致。
  // メイン→ドルスト残り+クロス円→指数→その他 の優先度順に走査し、先頭から最大5件だけ拾う。
  const longs: string[] = [];
  const shorts: string[] = [];
  const pickedBarTimeBySymbol = new Map<string, number>();
  for (const symbol of HTF_DIGEST_PICK_PRIORITY) {
    if (longs.length + shorts.length >= HTF_DIGEST_PICK_LIMIT) break;
    const row = stateBySymbol.get(symbol);
    if (!row || row.state === 0 || row.reversal_warning) continue;
    if (higherStateBySymbol) {
      const higherRow = higherStateBySymbol.get(symbol);
      if (!higherRow || higherRow.state === 0) continue;
      if (Math.sign(row.state) !== Math.sign(higherRow.state)) continue;
    }
    if (row.state > 0) longs.push(symbol);
    else shorts.push(symbol);
    pickedBarTimeBySymbol.set(symbol, row.bar_time);
  }

  if (longs.length === 0 && shorts.length === 0) return; // 良条件の銘柄が1つもなければ送らない

  // このタイムフレームで前回送信した時点の最新bar_timeより新しい確定足が1つもなければ、
  // ピック内容が実質同じ再送になるため送らない（土日など新しい確定足が来ていない場合）。
  // 銘柄単位ではなくタイムフレーム単位で判定することで、上限5件から漏れていた別の古い銘柄が
  // 繰り上がって再送されてしまう事態を防ぐ。
  const previousWatermark = Math.max(
    0,
    ...[...stateBySymbol.values()].map((r) => r.last_digest_bar_time ?? 0),
  );
  const candidateMaxBarTime = Math.max(...pickedBarTimeBySymbol.values());
  if (candidateMaxBarTime <= previousWatermark) return;

  const dashboardUrl = `https://anyanical.com/#/tools/htf-context?tf=${timeframe}`;
  const note = `📋 好条件の銘柄だけを厳選してピックアップしたものだよ（全銘柄ではないよ）。他の銘柄も含めた詳細は下のボタンから見てね！\n⚠️ 必ずご自身で「監視足」「環境認識足」の波などを確認してね！\n${HTF_DIGEST_LOOKBACK_NOTE[timeframe]}`;

  const embed = {
    title: `🔔 Anyanical AI：${HTF_DIGEST_TITLE_TIER[timeframe]}分析レポート`,
    url: dashboardUrl, // タイトル自体もリンクにしておく（ボタンに気づかない人向けの保険）
    description: note,
    color: 16624639,
    thumbnail: { url: pickHtfDigestIcon() },
    fields: [
      {
        name: '📈 ロング狙い (LONG)',
        value: longs.length > 0 ? longs.map((s) => `\`${s}\``).join('\n') : 'なし',
        inline: true,
      },
      {
        name: '📉 ショート狙い (SHORT)',
        value: shorts.length > 0 ? shorts.map((s) => `\`${s}\``).join('\n') : 'なし',
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: `💡 Tips: ${pickHtfDigestTip()} 🌸` },
  };

  // Linkボタン（type=2, style=5）はインタラクションを発生させない非インタラクティブコンポーネントなので、
  // Application非所有のIncoming Webhookでも `with_components=true` を付ければ送信できる。
  // 埋め込みタイトルのリンクより視認性が高く「どこを押せばいいか」が明確になるため採用。
  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: '📊 Market Dashboardを開く',
          url: dashboardUrl,
        },
      ],
    },
  ];

  try {
    const res = await fetch(`${webhookUrl}?with_components=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed],
        components,
        allowed_mentions: { parse: [] },
      }),
    });
    if (res.ok) {
      // 送信できた銘柄だけ「最後にダイジェストへ載せたbar_time」を更新する。
      // 拾われなかった（上限漏れ・条件未達の）銘柄は次回以降も引き続き対象になる。
      await env.DB.batch(
        Array.from(pickedBarTimeBySymbol.entries()).map(([symbol, barTime]) =>
          env.DB.prepare(
            'UPDATE htf_context_states SET last_digest_bar_time = ? WHERE symbol = ? AND timeframe = ?',
          ).bind(barTime, symbol, pineCode),
        ),
      );
    }
  } catch {
    // 送信失敗しても他の時間足の処理には影響しない（scheduled()側で各時間足を独立に処理する）
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/pnl/showcase') {
      return handleShowcase(request, env);
    }
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env);
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    if (controller.cron === HTF_DIGEST_H4_CRON) {
      if (isH4DigestDue(new Date(controller.scheduledTime))) {
        ctx.waitUntil(sendHtfContextDigest(env, 'H4'));
      }
      return;
    }
    const timeframe = HTF_DIGEST_CRON_TIMEFRAME[controller.cron];
    if (!timeframe) return;
    ctx.waitUntil(sendHtfContextDigest(env, timeframe));
  },
} satisfies ExportedHandler<Env>;
