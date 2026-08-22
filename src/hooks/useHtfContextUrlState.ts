import { useCallback, useEffect, useState } from 'react';

import {
  HTF_CONTEXT_ALL_SYMBOLS,
  HTF_CONTEXT_CATEGORIES,
  HTF_CONTEXT_DEFAULT_TIMEFRAME,
  HTF_CONTEXT_TIMEFRAMES,
  getCategoryForSymbol,
  type HtfContextCategoryId,
  type HtfContextTimeframeId,
} from '../config/htfContextSymbols';

export type HtfContextUrlState = {
  tf: HtfContextTimeframeId;
  symbol: string | null;
  category: HtfContextCategoryId;
  search: boolean;
  preset: string | null;
};

const HTF_CONTEXT_ROUTE = 'tools/htf-context';

const getHashQueryParams = (): URLSearchParams => {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  return new URLSearchParams(queryIndex === -1 ? '' : hash.slice(queryIndex + 1));
};

// 無効な値は安全に既定値へフォールバックし、カテゴリと銘柄が矛盾する場合は
// 銘柄が実際に属するカテゴリへ補正する（カテゴリ切替時の整合ルールとURL復元で同じロジックを使う）。
export const parseHtfContextUrlState = (): HtfContextUrlState => {
  const params = getHashQueryParams();

  const tfRaw = params.get('tf');
  const tf =
    HTF_CONTEXT_TIMEFRAMES.find((t) => t.id === tfRaw)?.id ??
    HTF_CONTEXT_DEFAULT_TIMEFRAME;

  const symbolRaw = params.get('symbol');
  const symbol =
    symbolRaw && HTF_CONTEXT_ALL_SYMBOLS.includes(symbolRaw) ? symbolRaw : null;

  const categoryRaw = params.get('category') as HtfContextCategoryId | null;
  const categoryIsKnown =
    categoryRaw !== null && HTF_CONTEXT_CATEGORIES.some((c) => c.id === categoryRaw);
  const category = symbol
    ? getCategoryForSymbol(symbol, categoryIsKnown ? categoryRaw : null)
    : ((categoryIsKnown ? categoryRaw : null) ?? HTF_CONTEXT_CATEGORIES[0].id);

  const search = params.get('search') === '1';
  const preset = params.get('preset');

  return { tf, symbol, category, search, preset };
};

const buildHash = (state: HtfContextUrlState): string => {
  const params = new URLSearchParams();
  params.set('tf', state.tf);
  if (state.symbol) params.set('symbol', state.symbol);
  if (state.category) params.set('category', state.category);
  if (state.search) params.set('search', '1');
  if (state.preset) params.set('preset', state.preset);
  const query = params.toString();
  return `#/${HTF_CONTEXT_ROUTE}${query ? `?${query}` : ''}`;
};

// ダッシュボードの表示状態（時間足・選択銘柄・カテゴリ・検索パネル開閉・適用中プリセット）をURLへ
// 反映するhook。history.replaceState()のみを使う（location.hashへの直接代入と違いhashchangeを
// 発火させないため、App.tsx側のルート解析による不要な再マウントを避けられる）。ここで管理するのは
// すべて「同じツールページ内の細かな表示状態」であり、ページ遷移ではないためreplaceStateで一貫させる。
export const useHtfContextUrlState = () => {
  const [state, setState] = useState<HtfContextUrlState>(() => parseHtfContextUrlState());

  useEffect(() => {
    // ブラウザの戻る/進む操作はhashchangeを発火するため、その場合だけ再解析する。
    const onHashChange = () => setState(parseHtfContextUrlState());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const updateUrlState = useCallback((patch: Partial<HtfContextUrlState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      const hash = buildHash(next);
      if (window.location.hash !== hash) {
        window.history.replaceState(null, '', hash);
      }
      return next;
    });
  }, []);

  return { state, updateUrlState };
};
