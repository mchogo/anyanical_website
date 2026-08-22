import { describe, expect, it } from 'vitest';

import {
  HTF_DIGEST_HIGHER_TIMEFRAME,
  HTF_DIGEST_PICK_PRIORITY,
  HTF_CONTEXT_ALLOWED_SYMBOLS,
} from '../worker/index';
import {
  HTF_CONTEXT_ALL_SYMBOLS,
  HTF_CONTEXT_DIGEST_PRIORITY,
  HTF_CONTEXT_HIGHER_TIMEFRAME,
} from '../src/config/htfContextSymbols';

// worker/index.ts はCloudflare Workers用に自己完結したファイルにする設計方針のため、
// 許可銘柄・優先順位・上位足マッピングをフロント側（src/config/htfContextSymbols.ts）に
// 複製している。共有import化はせず、この一致テストで検知する（AGENTS.mdの方針どおり
// 「共有化より一致テストの方が安全なら一致テストを優先」を採用）。
// このテストが落ちたら、Discordダイジェストとダッシュボード検索の「おすすめ」の基準が
// ズレているということなので、片方だけを更新して終わらせない。
describe('worker/frontend HTFコンテキスト定義の一致', () => {
  it('優先順位配列(HTF_DIGEST_PICK_PRIORITY / HTF_CONTEXT_DIGEST_PRIORITY)が完全一致する', () => {
    expect(HTF_DIGEST_PICK_PRIORITY).toEqual(HTF_CONTEXT_DIGEST_PRIORITY);
  });

  it('上位足マッピング(HTF_DIGEST_HIGHER_TIMEFRAME / HTF_CONTEXT_HIGHER_TIMEFRAME)が一致する', () => {
    expect(HTF_DIGEST_HIGHER_TIMEFRAME).toEqual(HTF_CONTEXT_HIGHER_TIMEFRAME);
  });

  it('許可銘柄一覧(HTF_CONTEXT_ALLOWED_SYMBOLS / HTF_CONTEXT_ALL_SYMBOLS)が一致する（順序は問わない）', () => {
    expect([...HTF_CONTEXT_ALLOWED_SYMBOLS].sort()).toEqual(
      [...HTF_CONTEXT_ALL_SYMBOLS].sort(),
    );
  });

  it('優先順位配列に含まれる銘柄はすべて許可銘柄一覧に含まれる', () => {
    for (const symbol of HTF_DIGEST_PICK_PRIORITY) {
      expect(HTF_CONTEXT_ALLOWED_SYMBOLS).toContain(symbol);
    }
  });
});
