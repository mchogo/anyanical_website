import { useEffect, useState } from 'react';

// AnnouncementBar.tsxが優先順位付けに使う、各告知バナーの表示可否ロジック。
// react-refresh/only-export-componentsを避けるため、プレゼンテーション用の
// コンポーネント(SpaceXBanner.tsx等)とは別ファイルに分離している。

// JST 2026-06-12 00:00:00
const SPACEX_CUTOFF_MS = new Date('2026-06-12T00:00:00+09:00').getTime();

export const useSpaceXBannerState = () => {
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('spacex-banner-dismissed') === '1',
  );
  const isPastCutoff = now >= SPACEX_CUTOFF_MS;

  useEffect(() => {
    const handler = () => {
      sessionStorage.removeItem('spacex-banner-dismissed');
      setDismissed(false);
    };
    window.addEventListener('banner:reset', handler);
    return () => window.removeEventListener('banner:reset', handler);
  }, []);

  useEffect(() => {
    if (isPastCutoff) return;
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, [isPastCutoff]);

  const dismiss = () => {
    sessionStorage.setItem('spacex-banner-dismissed', '1');
    setDismissed(true);
    window.dispatchEvent(new Event('banner:dismissed'));
  };

  return { visible: !dismissed && !isPastCutoff, now, dismiss };
};

// ANNOUNCEMENTSは固定配列で常に非空のため、表示可否は「閉じたかどうか」だけで決まる。
export const useNewFeaturesTickerState = () => {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('announce-banner-dismissed') === '1',
  );

  useEffect(() => {
    const handler = () => {
      sessionStorage.removeItem('announce-banner-dismissed');
      setDismissed(false);
    };
    window.addEventListener('banner:reset', handler);
    return () => window.removeEventListener('banner:reset', handler);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('announce-banner-dismissed', '1');
    setDismissed(true);
    window.dispatchEvent(new Event('banner:dismissed'));
  };

  return { visible: !dismissed, dismiss };
};

type LatestMatomeEntry = { id: string; headline: string } | null;

export const useMatomeHeadlineBarState = () => {
  const [entry, setEntry] = useState<LatestMatomeEntry>(null);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('matome-headline-dismissed') === '1',
  );

  useEffect(() => {
    const handler = () => {
      sessionStorage.removeItem('matome-headline-dismissed');
      setDismissed(false);
    };
    window.addEventListener('banner:reset', handler);
    return () => window.removeEventListener('banner:reset', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/matome/entries')
      .then((res) => (res.ok ? res.json() : []))
      .then((entries: Array<{ id: string; headline: string }>) => {
        if (!cancelled && Array.isArray(entries) && entries.length > 0) {
          setEntry({ id: entries[0].id, headline: entries[0].headline });
        }
      })
      .catch(() => {
        // 取得できなくてもバーを非表示にするだけで、他の表示には影響させない
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('matome-headline-dismissed', '1');
    setDismissed(true);
    window.dispatchEvent(new Event('banner:dismissed'));
  };

  return { visible: !dismissed && entry !== null, entry, dismiss };
};
