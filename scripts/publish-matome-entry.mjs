// Hermesが research_matome.md の指示で生成したJSON(標準出力、entries配列)を検証し、
// 1件ずつ POST /api/matome/entries へ送信する。既定はdry-run。実送信は --send を明示する。
//
// 使い方:
//   hermes --oneshot scripts/prompts/research_matome.md | node scripts/publish-matome-entry.mjs --dry-run
//   hermes --oneshot scripts/prompts/research_matome.md | MATOME_WRITE_KEY=*** node scripts/publish-matome-entry.mjs --send
//
// 必須環境変数（--send時のみ）:
//   MATOME_WRITE_KEY   worker側 MATOME_WRITE_KEY と同じ共有シークレット
// 任意環境変数:
//   MATOME_API_BASE    既定は https://anyanical.com

import process from 'node:process';

const HEADLINE_LIMIT = 200;
const COMMENTARY_LIMIT = 4000;

const parseArgs = (argv) => {
  const options = { send: false, input: null };
  for (const arg of argv) {
    if (arg === '--send') options.send = true;
    else if (arg === '--dry-run') options.send = false;
    else if (arg.startsWith('--input=')) options.input = arg.slice('--input='.length);
    else {
      console.error(`不明な引数です: ${arg}`);
      process.exit(2);
    }
  }
  return options;
};

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
};

const fail = (message) => {
  console.error(`エラー: ${message}`);
  process.exit(2);
};

const isValidHttpUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const validateEntry = (data, index) => {
  const label = `entries[${index}]`;
  if (typeof data !== 'object' || data === null) {
    fail(`${label} はオブジェクトが必要です`);
  }
  if (
    typeof data.entry_date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data.entry_date)
  ) {
    fail(`${label}.entry_date は YYYY-MM-DD 形式の文字列が必要です`);
  }
  if (!isValidHttpUrl(data.source_url)) {
    fail(`${label}.source_url が有効なHTTP(S) URLではありません`);
  }
  if (
    typeof data.headline !== 'string' ||
    !data.headline.trim() ||
    data.headline.length > HEADLINE_LIMIT
  ) {
    fail(`${label}.headline は1〜${HEADLINE_LIMIT}文字の文字列が必要です`);
  }
  if (
    typeof data.commentary !== 'string' ||
    !data.commentary.trim() ||
    data.commentary.length > COMMENTARY_LIMIT
  ) {
    fail(`${label}.commentary は1〜${COMMENTARY_LIMIT}文字の文字列が必要です`);
  }
  return {
    entryDate: data.entry_date,
    sourceUrl: data.source_url,
    sourceAuthor: typeof data.source_author === 'string' ? data.source_author.trim() : '',
    headline: data.headline.trim(),
    commentary: data.commentary.trim(),
  };
};

const validate = (data) => {
  if (typeof data !== 'object' || data === null) {
    fail('Hermesの応答ルートはJSONオブジェクトが必要です');
  }
  if (data.status !== 'complete') {
    const detail = Array.isArray(data.errors)
      ? data.errors.join('; ')
      : String(data.errors ?? '');
    fail(`Hermesの調査が未完了です: ${detail || '理由なし'}`);
  }
  if (!Array.isArray(data.entries) || data.entries.length === 0) {
    fail('entries は空でない配列が必要です');
  }
  const seenUrls = new Set();
  const entries = data.entries.map((item, index) => {
    const entry = validateEntry(item, index);
    if (seenUrls.has(entry.sourceUrl)) {
      fail(
        `entries[${index}].source_url が他のエントリと重複しています: ${entry.sourceUrl}`,
      );
    }
    seenUrls.add(entry.sourceUrl);
    return entry;
  });
  return entries;
};

const postEntry = async (entry, apiBase, writeKey) => {
  const response = await fetch(`${apiBase}/api/matome/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Matome-Write-Key': writeKey,
    },
    body: JSON.stringify(entry),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${detail.slice(0, 300)}`);
  }
  return response.json();
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const raw = options.input
    ? await (await import('node:fs/promises')).readFile(options.input, 'utf-8')
    : await readStdin();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail('Hermesの応答が有効なJSONではありません');
  }

  const entries = validate(parsed);

  if (!options.send) {
    console.log(JSON.stringify(entries, null, 2));
    console.error(
      `dry-runのため送信していません（${entries.length}件）。送信するには --send を指定してください。`,
    );
    return;
  }

  const writeKey = process.env.MATOME_WRITE_KEY ?? '';
  if (!writeKey) fail('環境変数 MATOME_WRITE_KEY が未設定です');
  const apiBase = process.env.MATOME_API_BASE ?? 'https://anyanical.com';

  const posted = [];
  for (const entry of entries) {
    try {
      const created = await postEntry(entry, apiBase, writeKey);
      posted.push(created.id);
      console.error(`投稿しました (${posted.length}/${entries.length}): ${created.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      fail(
        `まとめの投稿に失敗しました（${posted.length}/${entries.length}件成功済み）: ${message}`,
      );
    }
  }

  console.log(`まとめを${posted.length}件投稿しました: ${posted.join(', ')}`);
};

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
