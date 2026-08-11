import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const defaultMaterialRoot = resolve(projectRoot, '../../Note/GPT教材作成');
const defaultOutput = resolve(projectRoot, 'generated/gpt_knowledge_seed.sql');
const maxChunkLength = 4_500;

const materials = [
  ['00_教材統合ルール.md', 'INTEGRATION-RULES'],
  ['01_Anyanical統合手法マニュアル.md', 'ANYANICAL-MASTER'],
  ['01_アニャニカル基本その1.md', 'DISCORD-BASIC-1'],
  ['02_アニャニカル基本その2.md', 'DISCORD-BASIC-2'],
  ['01_note_エントリー手法整理.md', 'NOTE-COMBINED'],
  ['00_インジケーター概念一覧.md', 'INDICATOR-SPECS'],
  ['03_アニャニカル応用.md', 'DISCORD-ADVANCED'],
  ['04_初心者向け学習ロードマップ.md', 'DISCORD-BEGINNER'],
];

const keywordAliases = new Map([
  ['調整', ['押し目', '戻り', '下げ止まり', '上げ止まり']],
  ['修正', ['修正波', '構造転換', '高安更新']],
  ['Sweep', ['スイープ', 'ヒゲ抜け', '終値未更新', '流動性']],
  ['Fibonacci', ['フィボナッチ', 'フィボ', '半値']],
  ['Premium / Discount', ['プレミアム', 'ディスカウント', '半値']],
  ['Trading Range', ['トレーディングレンジ', 'TR', '上層', '中層', '下層']],
  ['資金管理', ['損失許容', 'ロット', 'リスク管理']],
  ['損切り', ['SL', '無効化', 'ストップロス']],
  ['利確', ['TP', 'ターゲット', 'リスクリワード', 'RR']],
  ['環境認識', ['上位足', 'Daily Bias', '方向性']],
  ['ローソク足', ['実体', '終値', 'ヒゲ', 'OHLC']],
  ['インジケーター', ['Toolkit', 'サイン', 'Direction']],
]);

const parseArgs = (argv) => {
  const options = { sourceDir: null, output: defaultOutput };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--source-dir') options.sourceDir = argv[++index];
    else if (arg === '--output') options.output = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (options.sourceDir) {
    options.sourceDir = isAbsolute(options.sourceDir)
      ? options.sourceDir
      : resolve(process.cwd(), options.sourceDir);
  }
  options.output = isAbsolute(options.output)
    ? options.output
    : resolve(process.cwd(), options.output);
  return options;
};

const findUploadDirectory = async () => {
  const entries = await readdir(defaultMaterialRoot, { withFileTypes: true });
  const uploadDirectory = entries.find(
    (entry) =>
      entry.isDirectory() &&
      entry.name.normalize('NFKC').startsWith('05_GPTアップロード'),
  );
  if (!uploadDirectory) {
    throw new Error(`GPT upload directory was not found under ${defaultMaterialRoot}`);
  }
  return join(defaultMaterialRoot, uploadDirectory.name);
};

const splitMarkdownByH2 = (markdown, fallbackTitle) => {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const documentTitle =
    lines
      .find((line) => /^#\s+/.test(line))
      ?.replace(/^#\s+/, '')
      .trim() || fallbackTitle;
  const sections = [];
  let title = documentTitle;
  let buffer = [];

  const flush = () => {
    const content = buffer.join('\n').trim();
    if (content) sections.push({ title, content });
    buffer = [];
  };

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      flush();
      title = heading[1].trim();
      buffer.push(line);
      continue;
    }
    if (/^#\s+/.test(line)) continue;
    buffer.push(line);
  }
  flush();
  return sections;
};

const splitLongSection = ({ title, content }) => {
  if (content.length <= maxChunkLength) return [{ title, content }];

  const paragraphs = content.split(/\n{2,}/);
  const chunks = [];
  let buffer = '';
  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChunkLength) {
      throw new Error(
        `A single paragraph exceeds ${maxChunkLength} characters: ${title}`,
      );
    }
    const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    if (candidate.length > maxChunkLength) {
      chunks.push(buffer);
      buffer = paragraph;
    } else {
      buffer = candidate;
    }
  }
  if (buffer) chunks.push(buffer);

  return chunks.map((chunk, index) => ({
    title: `${title} (${index + 1}/${chunks.length})`,
    content: chunk,
  }));
};

const buildKeywords = (title, content) => {
  const keywords = new Set(
    title
      .replace(/[（）()／/・:：,、]/g, ' ')
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2),
  );
  for (const [term, aliases] of keywordAliases) {
    if (title.includes(term) || content.includes(term)) {
      keywords.add(term);
      aliases.forEach((alias) => keywords.add(alias));
    }
  }
  return [...keywords].join(',');
};

const assertSafe = (fileName, content) => {
  const blockedPatterns = [
    [/https:\/\/discord\.com\/channels\//i, 'Discord channel URL'],
    [/[?&](?:key|access_key|token)=[^\s)&]+/i, 'credential-bearing URL'],
    [/\b(?:sessionid|client_secret)\s*[:=]\s*[^\s]+/i, 'credential value'],
    [/\b(?:sk|sess)-[A-Za-z0-9_-]{20,}\b/, 'secret-like token'],
    [/https:\/\/discord(?:app)?\.com\/api\/webhooks\//i, 'Discord webhook URL'],
    [/複数期間の高安から算出/u, 'private Fund Mode construction rule'],
    [
      /ファンドモード[^\n]*(?:高安|高値|安値)[^\n]*(?:算出|基準|参照)/u,
      'private Fund Mode construction detail',
    ],
  ];
  for (const [pattern, label] of blockedPatterns) {
    if (pattern.test(content)) throw new Error(`${label} detected in ${fileName}`);
  }
};

const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;

const stableId = (sourceId, title, index) =>
  createHash('sha256')
    .update(`${sourceId}\0${title}\0${index}`)
    .digest('hex')
    .slice(0, 24);

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const sourceDir = options.sourceDir ?? (await findUploadDirectory());
  const chunks = [];

  for (const [fileName, sourceId] of materials) {
    const filePath = join(sourceDir, fileName);
    const markdown = await readFile(filePath, 'utf8');
    assertSafe(fileName, markdown);
    const sections = splitMarkdownByH2(markdown, fileName.replace(/\.md$/, ''));
    for (const section of sections.flatMap(splitLongSection)) {
      chunks.push({
        id: stableId(sourceId, section.title, chunks.length),
        sourceId,
        title: section.title,
        content: section.content,
        keywords: buildKeywords(section.title, section.content),
        sortOrder: chunks.length,
      });
    }
  }

  const updatedAt = new Date().toISOString();
  const statements = chunks.map(
    (chunk) =>
      `INSERT INTO gpt_knowledge_chunks ` +
      `(id, source_id, title, content, keywords, sort_order, updated_at) VALUES (` +
      [
        chunk.id,
        chunk.sourceId,
        chunk.title,
        chunk.content,
        chunk.keywords,
        String(chunk.sortOrder),
        updatedAt,
      ]
        .map((value, index) => (index === 5 ? value : sqlString(value)))
        .join(', ') +
      ');',
  );

  const sql = [
    '-- Generated by scripts/build-gpt-knowledge-seed.mjs',
    '-- Contains member-only summarized teaching material. Do not commit this file.',
    'DELETE FROM gpt_knowledge_chunks;',
    ...statements,
    '',
  ].join('\n');

  await mkdir(dirname(options.output), { recursive: true });
  await writeFile(options.output, sql, { encoding: 'utf8', mode: 0o600 });
  process.stdout.write(
    `${JSON.stringify({ sourceDir, output: options.output, files: materials.length, chunks: chunks.length })}\n`,
  );
};

await main();
