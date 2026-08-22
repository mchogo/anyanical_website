# Data Sources

## 方針

本アプリの価格・チャート・カレンダーはすべて参考情報です。公式市場価格、各ブローカーのCFD価格、OTC FX価格、約定可能価格とは差が生じる場合があります。

## Hyperliquid

用途:

- 週末モードの24時間取引価格
- 金曜クローズ付近を基準にした週末変動
- 窓開け監視の参考値

接続先:

- WebSocket: `wss://api.hyperliquid.xyz/ws`
- REST: `https://api.hyperliquid.xyz/info`

使用データ:

- `allMids`: 現在のmid price
- `candleSnapshot`: 金曜クローズ付近の参考価格と過去6時間チャート
- `dex: "xyz"`: 金属・原油・指数・為替の24時間取引価格取得

実装場所:

- `src/hooks/useHyperliquidMids.ts`
- `src/config/markets.ts`

注意:

- 24時間取引市場の参考価格であり、CME/NYSE/東証/店頭FXの公式価格ではありません
- 祝日や週末は公式市場側が止まるため、差分表示の意味を画面上で説明する必要があります
- 銘柄名は変更・追加される可能性があるため、`symbolCandidates` には候補を複数持たせます

## TradingView

用途:

- 実チャート表示
- 通貨強弱
- クロスレート
- 経済指標カレンダー

使用Widget:

- Advanced Chart
- Forex Heat Map
- Forex Cross Rates
- Events Calendar

実装場所:

- `src/components/ChartSection.tsx`
- `src/components/RelatedTools.tsx`

代表シンボル:

- `OANDA:XAUUSD`
- `OANDA:XAGUSD`
- `TVC:USOIL`
- `OANDA:SPX500USD`
- `OANDA:JP225USD`
- `OANDA:USDJPY`
- `BINANCE:BTCUSDT`

注意:

- TradingView上のみ利用可能なシンボルは外部サイト埋め込みで表示できないことがあります
- 先物シンボルより、表示互換性の高いCFD/FX/cryptoシンボルを優先します

## Investing.com

用途:

- 経済指標カレンダーの代替確認先

実装場所:

- `src/components/RelatedTools.tsx`

注意:

- TradingView側に表示制限が発生した場合の確認リンクとして扱います
- 表示言語・タイムゾーンは外部側の仕様変更の影響を受けます

## SNS話題まとめ（matome_entries）

用途:

- `#/matome` ページに表示するXの話題投稿＋あにゃのコメント
- market-digest-bot（Discord日次ダイジェスト）の「🔥 昨日のSNS話題」セクションが同じAPIを参照

データの出所:

- 投稿・生成はHermes Agentが担当（`scripts/prompts/research_matome.md`）。本アプリはHermesが生成したJSONを検証・保存・表示するだけで、SNS検索やコメント文生成のロジックは持たない
- 選定・コメントは全自動（人間の事前レビューなし）。誤情報・不適切投稿の掲載リスクを許容した上での運用方針（2026-08-13、ユーザー承認済み）。問題があれば管理者が`hidden`フラグで非表示にする

実装場所:

- `migrations/0008_matome_entries.sql`（D1テーブル）
- `worker/index.ts` の `handleMatomeEntries`（`GET /api/matome/entries` 公開、`POST /api/matome/entries` は `MATOME_WRITE_KEY` 共有シークレットで保護）、および `PATCH /api/admin/matome-entries/:id`（管理者のみ、非表示切替）
- `scripts/publish-matome-entry.mjs`（HermesのJSON標準出力を検証してAPIへPOSTする一次スクリプト）
- `src/hooks/useMatomeEntries.ts` / `src/components/MatomePage.tsx`

注意:

- `POST`/`PATCH`はDiscord OAuthを経由しない（HermesはDiscordトークンを持たない）ため、`MATOME_WRITE_KEY`のみで保護している。この鍵はWebhook URLやAPIキーと同様、回答・ログ・新規ファイルへ転記しない
- 掲載は投稿者本人の許諾を得たものではない。運営窓口への削除依頼があれば`hidden=1`で即座に非表示にする運用を前提とする

## HTFコンテキスト（Anyanical Market Dashboard）

用途:

- `#/tools/htf-context`（プレミアム限定、「Anyanical Market Dashboard」）に表示する、カテゴリ別（メイン/ドルストレート/クロス円/その他通貨/貴金属/仮想通貨/指数）・時間足別（MN1/W1/D1/H4）のAI環境認識状態（上目線/下目線/レンジ、上ターゲット/下ターゲット）
- 対象銘柄は`src/config/htfContextSymbols.ts`で一元管理。既存のGAS通知（`gas/tradingview_discord_alert/Ananical AI.gs`の`SYMBOL_GROUPS`）で実際に運用している銘柄群と一致させている: 為替28種（ドルストレート7+クロス円6+その他通貨15）、貴金属2種（XAUUSD/XAGUSD）、仮想通貨2種（BTCUSDT/ETHUSDT）、指数3種（NAS100USD/SPX500USD/JP225YJPY）。「メイン」はドルストレート・貴金属から抜粋した参照用ハイライトタブ（USDJPY/XAUUSD/EURUSD/GBPUSD）で、他カテゴリと表示が重複する
- `BTCUSDT`は週末・祝日でFXが動かない時間帯でも表示・アラート疎通のテストができる銘柄でもある（Hyperliquidの週末モードとは別系統、Binance等のTradingViewチャートに直接アラートを設定する）
- お気に入り機能（一覧表の☆で登録、上部にカード表示）はDiscordユーザーIDに紐づけてサーバー側（D1の`user_settings.htf_context_favorites_json`）に保存する。同じDiscordアカウントでログインしたどの端末でも共有される。未設定の新規ユーザーには既定値`USDJPY`/`XAUUSD`が返る
- URLクエリで表示状態を復元できる（`src/hooks/useHtfContextUrlState.ts`）: `tf`（時間足）/`symbol`（選択銘柄）/`category`（カテゴリ）/`search`（検索パネル開閉、`1`で開く）/`preset`（適用中プリセットID）。無効な値は既定値へ安全にフォールバックし、`symbol`と`category`が矛盾する場合は銘柄が実際に属するカテゴリへ補正する（`getCategoryForSymbol`、カテゴリ切替時の整合ロジックと共通化）。更新は`history.replaceState()`のみを使い（`location.hash`への直接代入と違いhashchangeを発火させないため）、`App.tsx`側のルート解析による不要な再マウントや履歴の過剰な積み上がりを避けている。フィルター条件（目線・反転警戒・時間足・カテゴリ・お気に入りのみ）自体はURLへは載せていない（プリセットIDで代表させれば十分実用的なため、URLが長大化する非対称な複雑さを避けた）
- ダッシュボード上部の「🔍 全時間足から検索」ボタン（トグル式、別ページには遷移しない）を開くと`HtfContextSearchSection`が展開され、全時間足横断のフィルター検索ができる。このボタンは「更新」ボタンと同じ操作行（ページ上部）に置き、展開されるパネル自体も**時間足タブ（「表示する時間足」）より前**に描画する——ボタンだけを離しても、パネルが時間足タブの直下に開くと「時間足タブを押すと検索フィルターが切り替わる」ように誤解されるとの指摘を受け、パネルの描画位置自体を時間足タブより上に移動した。開閉には`showSearch`（開いている意思）と`isSearchMounted`（実際にDOM上にあるか）を分けたアニメーション制御を使い、開くときは`animate-slide-down`、閉じるときは`animate-slide-up-out`を再生してから`onAnimationEnd`でアンマウントする（閉じる瞬間に単純にDOMから消えるのではなく、退場アニメーションを見せるため）。目線（上目線/下目線/レンジ(上)/レンジ(下)/レンジ(中立)）・反転警戒の有無・時間足・カテゴリのチェックボックスで絞り込み、結果は時間足列付きの一覧表で表示する（親の`HtfContextBoard`が`useHtfContext`で取得済みの全銘柄×全時間足データ・お気に入り状態をpropsで渡すだけで、追加のAPI呼び出しはしない）。「✨ 条件良さそうなペア」欄はDiscordダイジェスト（`sendHtfContextDigest`）と同じ「良い条件」判定（反転警戒なし・レンジでない・上位足と方向一致）に選択中のフィルターも重ねてクライアント側に複製（`HTF_CONTEXT_HIGHER_TIMEFRAME`/`HTF_CONTEXT_DIGEST_PRIORITY`、いずれも`src/config/htfContextSymbols.ts`）し、基本はD1（日足）基準・D1だけで枠が埋まらない場合のみ他の時間足で補いながら最大8件を表示する。おすすめカード・結果一覧表の行はどちらもクリックするとページ遷移せずダッシュボード側の`timeframe`/`selectedSymbol`/`categoryId`状態を直接更新し、検索セクションを閉じてその銘柄を上部の詳細バーへ表示する（初期実装では別ページ`#/tools/htf-context-search`だったが、遷移が分かりにくいとの指摘でダッシュボードへ統合した）
- **検索条件プリセットはDiscordアカウントに紐づけてD1へサーバー保存する（正本）**。同じDiscordアカウントでログインしたどの端末からも同じプリセットが見える。プリセットは複数保存でき、名前変更・上書き保存・削除・既定指定ができる。「🔄 条件をリセット」は現在編集中の条件を全選択（絞り込みなし）へ戻すだけで、保存済みプリセットは削除しない（両者を明確に分離。誤操作防止のため削除には確認ダイアログを挟む）
  - API: `GET/POST /api/htf-context/search-presets`、`PUT/DELETE /api/htf-context/search-presets/:id`、`PUT /api/htf-context/search-presets/:id/default`。認証は`htf-context/favorites`と同じ`verifyToken()`（一般Discordログイン、プレミアムロール限定の`verifyGptAccess()`ではない）。全クエリを`discord_user_id`でスコープし、他ユーザーのプリセットは404を返す（403にすると存在有無が漏れるため404で統一）。プリセット名1〜50文字、ユーザーあたり最大20件、`filters_json`は4KB上限、状態・カテゴリ・時間足の値はサーバー側でも既知のマスタと突合して正規化する（クライアントを信用しない）
  - D1: `migrations/0013_htf_context_search_presets.sql`で`htf_context_search_presets`テーブルを新設（`id`/`discord_user_id`/`name`/`filters_json`/`schema_version`/`is_default`/`created_at`/`updated_at`）。既定プリセットが1ユーザーにつき最大1件であることは、部分ユニークインデックス（`WHERE is_default = 1`）でDB層でも強制する
  - 保存操作は楽観的更新（即座に画面へ反映してからPUT/POST）にしつつ、`saveId`方式で「最後に発火した保存」だけを正とし、失敗時は直前の状態へロールバックしてaria-live経由で通知する（`useHtfContextFavorites`/`useHtfContextSearchPresets`共通のパターン）
  - **旧`localStorage`（キー`htf-context-search-filters`）からの移行**: ログイン後、初回のプリセット取得完了時に1回だけ実行。既存の内容を正規化し、サーバー側に同等のプリセットが無ければ「以前の端末保存条件」として自動でサーバーへ取り込む。**サーバー保存に成功した場合のみ**旧`localStorage`を削除し、別キー`htf-context-search-filters-imported`で二重インポートを防止する。保存に失敗した場合は旧データを残し、次回ログイン時に再試行する
  - フィルター状態（目線・反転警戒・時間足・カテゴリ・お気に入りのみ）が保存済みプリセットと一致するかは、配列の順序差を無視して比較する（`normalizeFiltersForCompare`でSet相当に正規化してから比較）
- フィルター各軸に「すべて選択」「すべて解除」ボタンと、目線（上方向だけ/下方向だけ/レンジだけ/トレンドだけ）・時間足（上位足のみ=MN1/W1/D1/短期確認=D1/H4）のショートカットを用意している。全解除（絞り込み対象0件）も正常な状態として扱い、勝手に1項目を残す実装にはしていない
- 空の検索結果は原因別に文言・復旧操作を出し分ける（`getEmptyReason`/`HtfContextEmptyState`）: 時間足/目線/カテゴリ/反転警戒のいずれかが全解除→該当軸を全選択するボタン、お気に入りのみで0件→お気に入り条件解除ボタン、データ未受信→その旨のみ表示、それ以外の不一致→条件リセットボタン
- 検索結果は`sm`未満（375px等のモバイル幅）でカード表示（`HtfContextResultsMobile`）、`sm`以上でテーブル表示（`HtfContextResultsDesktop`）に自動切替する。同じ2コンポーネントをダッシュボード本体のカテゴリ別一覧（`HtfContextBoard.tsx`）でも再利用しており、テーブル/カード両方に「データ待ち」（`row`が`null`）の表示を持たせている
- カテゴリタブに銘柄数バッジを表示する。フィルターが既定（全選択）から変わっている場合は、現在の時間足でその条件に一致する件数へ切り替わる。ダッシュボード本体・検索パネルの両方に「★お気に入りのみ」トグルがある（本体側は現在の時間足のカテゴリ一覧を絞り込むだけ、検索パネル側は`filters.favoriteOnly`として全時間足横断検索の条件になる——別々の状態として持つ）
- データ鮮度表示（`src/utils/htfContextFreshness.ts`の`getFreshnessInfo`、純粋関数）は`updatedAt`から経過時間を計算し、時間足ごとに異なる閾値（H4=8時間/D1=2日/W1=9日/MN1=35日）で「更新済み」「経過あり」を判定する。仮想通貨（`USDT`終わり）以外かつUTC土日には「市場休場中の可能性があります」という中立表現に倒し、閾値超過を即座に異常表示しない。アイコン+テキストを併用し、色だけに依存しない
- 詳細バー（`HtfContextDetailBar`）は現在の状態に応じて注目側ターゲットを強調表示し、反対側は「基準側(上)」「基準側(下)」という小さな補助表示にする（中立レンジのみ上下を同格表示）。`refHigh`/`refLow`の値自体は変えず、表示上の強調だけを切り替える。モバイルでは2列グリッド、`sm`以上で横並びにレイアウトを切り替える
- 検索パネルの「条件良さそうなペア」の各カードには選定根拠（例: 「D1 ↗ W1方向一致」「反転警戒なし」）を表示し、📈上方向候補／📉下方向候補の2列に分けて表示する（`splitRecommendationsByDirection`）
- おすすめ・検索結果を選択すると、検索パネルを退場アニメーション付きで閉じたあとに詳細バーへスムーズスクロールする（`prefers-reduced-motion`時は即時移動）。パネルが閉じる前にスクロールしないため、レイアウト変化で位置がずれない。キーボードフォーカスは意図せず読み上げ位置を奪わないよう移動しない（スクロールのみ）
- アクセシビリティ: 検索トグルに`aria-expanded`/`aria-controls`、時間足・カテゴリの選択ボタンに`aria-pressed`、テーブル行・モバイルカードはEnter/Spaceでも選択でき`focus-visible`リングを表示、保存・削除・エラー通知には`aria-live`、主要な操作対象は40px前後のタップ領域を確保、`text-slate-600`のような低コントラスト色を重要情報には使わない
- `prefers-reduced-motion: reduce`環境では、既存の`NewFeaturesTicker`（`motion-reduce:animate-none`）と同じ個別要素へのTailwind `motion-reduce:`バリアント付与という設計方針を踏襲し、検索パネル・詳細バーのアニメーション、矢印回転トランジションを無効化する。検索パネルの退場アニメーションが発火しない環境でもパネルが消えなくならないよう、`onAnimationEnd`に加えて220msのフォールバックタイマーでアンマウントする

データの出所:

- `anyanical-toolkit-repo/Anyanical_Toolkit_3_0.pine`（ユーザ版）/`Anyanical_Toolkit_3_1.pine`（管理者版）共通のAI環境認識ロジック（`aiEnvState`/`aiEnvRefHigh`/`aiEnvRefLow`/`aiRangeIsWickOnly`）を、JSON形式の`alert()`として出力する（「環境認識足 AI環境認識コンテキストアラート(JSON)」トグル）。送信頻度は「AI環境認識コンテキストアラートの送信頻度」設定（既定: 表示足の確定足ごと。tfh確定時のみに絞る選択肢もあり）に従う
- 対象の銘柄×時間足の組み合わせごとに、TradingView側でチャートを開いて`tfh`入力を目的の時間足（MN1なら`1M`、W1なら`1W`、D1なら`1D`、H4なら`240`）に設定し、個別にアラートを作成する必要がある（銘柄数×時間足数の分だけ手動設定が必要）
- TradingViewのアラート設定でWebhook URLを`https://anyanical.com/api/htf-context?key=<HTF_CONTEXT_WRITE_KEYの値>`に設定する。TradingViewのWebhookアラートはカスタムHTTPヘッダーを指定できないため、共有シークレットはヘッダーではなくURLのクエリパラメータで渡す（`X-Htf-Context-Write-Key`ヘッダーもcurl等の手動確認用に後方互換として引き続き受け付ける）。中継サーバー（GAS等）は経由しない
- `refHigh`(上ターゲット)/`refLow`(下ターゲット)は常にこの2値のみで、どちらが「今狙っている側」かは状態（上目線/レンジ(上)なら上、下目線/レンジ(下)なら下、中立のレンジなら両方参考値）によって表示側が強調を切り替える
- サーバー側は銘柄・時間足をキーに最新状態のみを1行upsert保存する（履歴は保持しない）

Discordダイジェスト通知（新規）:

- `worker/index.ts`の`scheduled()`（Cloudflare Cron Trigger）が、時間足ごと（H4=NYクローズ30分後を起点に4時間おき・夏冬時間を動的判定、D1=毎日、W1=毎週月曜、MN1=毎月1日、いずれもJST09:00基準。詳細は`docs/operations/deployment.md`「Cron Trigger」参照）に`htf_context_states`のスナップショットを読み、時間足につき**1本の埋め込みへ集約**して送信する（カテゴリ別に複数本へ分けない）
- 掲載する銘柄は全銘柄ではなく、以下をすべて満たす「良い条件」のものだけを`HTF_DIGEST_PICK_PRIORITY`の優先度順（メイン→ドルストレート残り+クロス円→指数→その他）に走査し、先頭から最大`HTF_DIGEST_PICK_LIMIT`(5)件だけ拾う: (1) `reversalWarning`が立っていない、(2) レンジ(state=0)でない、(3) 1つ上位の時間足（H4→D1→W1→MN1の順、MN1はこれ以上の上位足がないため確認しない）が存在し、方向（LONG/SHORT）が一致する
- 埋め込みの体裁・Tips文言・「⚠️ 必ずご自身で確認してね」等の注意書きは、既存のGAS通知`gas/tradingview_discord_alert/Ananical AI.gs`（`sendDiscordEmbed`・`TIPS_LIST`）のスタイルを踏襲している。選定ロジック自体は独自（GAS側は全銘柄をそのまま列挙、こちらは条件で絞り込む）。データ源はD1スナップショット読み取りのみで、揃うまで待つ/タイムアウトで確定という完了判定は不要（D1に既に最新状態がupsertされているため）
- 埋め込みタイトル自体をAnyanical Market Dashboardへのリンクにしている（`embed.url`、`?tf=`付きで該当時間足が初期選択された状態で開く）。フィールド内にテキストリンクを埋め込むより分かりやすいため、フィールドの外＝タイトルをリンクにする形にした。ピックアップに漏れた銘柄はこちらで確認する導線
- Webhook送信先は時間足ごとに分離（`HTF_DIGEST_WEBHOOK_H4`/`_D1`/`_W1`/`_MN1`）。未設定の時間足はスキップされる

実装場所:

- Pine: `anyanical-toolkit-repo/Anyanical_Toolkit_3_0.pine` / `Anyanical_Toolkit_3_1.pine`（`f_htf_context_alert_message`、`aiEnvContextAlert`）
- `migrations/0010_htf_context.sql`（D1テーブル`htf_context_states`、symbol+timeframeで最新1行upsert）、`migrations/0011_htf_context_favorites.sql`（`user_settings.htf_context_favorites_json`列追加）、`migrations/0012_htf_digest_last_sent.sql`（Discordダイジェストの重複送信防止）、`migrations/0013_htf_context_search_presets.sql`（検索条件プリセットテーブル、新規）
- `worker/index.ts`の`handleHtfContext()`（`GET /api/htf-context`はDiscordプレミアムロール限定=既存の`GPT_ALLOWED_ROLE_IDS`と同じロールで判定、`POST /api/htf-context`は`HTF_CONTEXT_WRITE_KEY`で保護）、`GET`/`PUT /api/htf-context/favorites`・`GET`/`POST /api/htf-context/search-presets`・`PUT`/`DELETE /api/htf-context/search-presets/:id`・`PUT /api/htf-context/search-presets/:id/default`（いずれもDiscord認証必須=`verifyToken()`）、`scheduled()`+`sendHtfContextDigest()`（Discordダイジェスト送信）。許可銘柄・時間足は`HTF_CONTEXT_ALLOWED_SYMBOLS`/`HTF_CONTEXT_ALLOWED_TIMEFRAMES`でホワイトリスト検証
- `src/config/htfContextSymbols.ts`（カテゴリ・時間足の表示用マスタ+`getCategoryForSymbol`。「良い条件」判定用の`HTF_CONTEXT_HIGHER_TIMEFRAME`/`HTF_CONTEXT_DIGEST_PRIORITY`は`worker/index.ts`側と同じ内容をここにも複製しており、`tests/htfContextConsistency.test.ts`（vitest）で一致を検証する）
- `src/hooks/useHtfContext.ts` / `useHtfContextFavorites.ts`（保存中/失敗/ロールバック対応） / `useHtfContextSearchPresets.ts`（プリセットCRUD+旧localStorage移行） / `useHtfContextUrlState.ts`（URL⇄状態同期）
- `src/utils/htfContextFormat.ts`（整形）/ `htfContextFilters.ts`（フィルターの型・正規化・比較・要約・判定・検索結果計算の純粋関数）/ `htfContextFreshness.ts`（鮮度判定の純粋関数）/ `htfContextRecommendations.ts`（おすすめの選定・根拠生成）
- `src/components/HtfContextBoard.tsx`（オーケストレーター。状態・URL同期・データ取得を集約） / `HtfContextSearchSection.tsx`（検索パネルのレイアウト、propsだけで動く） / `src/components/htf-context/`配下（`HtfContextFilters.tsx` `HtfContextFilterSummary.tsx` `HtfContextPresetManager.tsx` `HtfContextRecommendations.tsx` `HtfContextResultsDesktop.tsx` `HtfContextResultsMobile.tsx` `HtfContextDetailBar.tsx` `HtfContextFreshnessBadge.tsx` `HtfContextEmptyState.tsx`、責務ごとに分割した表示コンポーネント群）
- `wrangler.jsonc`の`triggers.crons`（Cron Trigger定義）
- `tests/htfContextConsistency.test.ts`（`npm run test`=`vitest run`で実行。worker/フロント間の定義一致を検証する唯一のテストで、このために`package.json`へ`vitest`をdevDependencyとして追加した）

注意:

- 対象を増やす場合はPine側のアラート追加（TradingView側で対象チャートごとに手動設定）と、`worker/index.ts`の`HTF_CONTEXT_ALLOWED_SYMBOLS`/`HTF_DIGEST_GROUPS`、`src/config/htfContextSymbols.ts`の3箇所を合わせて更新する
- TradingViewアラートを設定していない銘柄×時間足の組み合わせは「データ待ち」表示になる（エラーではない、正常な未設定状態）。Discordダイジェストでもその銘柄はLONG/SHORTどちらにも計上されない
- 表示は裁量判断の参考情報であり、方向感・価格到達を保証しない旨をUI上に明記する
- ページ上部と非プレミアム時のロック画面に、Anyanical Toolkit本体のTradingViewページ（`https://jp.tradingview.com/script/BV4TkZHZ/`）へのリンクを常設している（プレミアム有無に関わらず表示。ユーザー自身のチャートでもAI環境認識を確認できることを案内する導線）
- 非プレミアム時のロック画面には`public/htf-context-sample.png`（表示イメージのサンプル画像）を表示する
- 一覧表の行またはお気に入りカードをクリックすると、その銘柄が上部の強調バー（`HtfContextDetailBar`）に表示される。強調バーには「TradingViewで開く」リンクがあり、`getTradingViewChartUrl()`でOANDA(FX/貴金属/指数)・BINANCE(仮想通貨)の代表シンボルへのTradingViewチャートURLを組み立てる（表示互換性優先の代表シンボルであり、全銘柄の完全一致を保証するものではない）

## HFM / Exness / lit.link

用途:

- 口座開設、コピートレード、サブスク、Discordなどの外部リンク

リンク管理:

- `src/config/navigation.ts`
- `src/components/ExplainerSections.tsx`
- [operations/external-links.md](operations/external-links.md)

注意:

- 紹介リンクや短縮URLは変更時にドキュメントも更新します
- 投資助言・利益保証に見える文言は避けます
