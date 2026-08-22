import {
  useMatomeHeadlineBarState,
  useNewFeaturesTickerState,
  useSpaceXBannerState,
} from '../hooks/useAnnouncementBanners';
import { MatomeHeadlineBar } from './MatomeHeadlineBar';
import { NewFeaturesTicker } from './NewFeaturesTicker';
import { SpaceXBanner } from './SpaceXBanner';

// ページ最上部の告知バナーは、以前はSpaceXBanner/NewFeaturesTicker/MatomeHeadlineBarが
// 常に縦に3つ並んでいた(すべて表示条件を満たすと最大3段、本文が大きく下に押し出される上、
// スクリーンリーダーにも3つ分読み上げられる)。ここで優先度順に最大1つだけを選んで表示する。
//
// 優先順位: SpaceX(期間限定の告知) > まとめ(旬のSNS話題) > 新機能ティッカー(常設の一般告知)。
// 各バナー自身の閉じる/再表示(FloatingNavのベル)の仕組みは個別のsessionStorageキーの
// ままなので、他のバナーを閉じても他のキーには影響しない。
export const AnnouncementBar = () => {
  const spacex = useSpaceXBannerState();
  const matome = useMatomeHeadlineBarState();
  const ticker = useNewFeaturesTickerState();

  if (spacex.visible) {
    return <SpaceXBanner now={spacex.now} dismiss={spacex.dismiss} />;
  }
  if (matome.visible && matome.entry) {
    return <MatomeHeadlineBar entry={matome.entry} dismiss={matome.dismiss} />;
  }
  if (ticker.visible) {
    return <NewFeaturesTicker dismiss={ticker.dismiss} />;
  }
  return null;
};
