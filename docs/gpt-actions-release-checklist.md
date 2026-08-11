# GPT Actions 公開チェックリスト

## ローカル完了済み

- WorkerのDiscordロール検証
- `GET /api/gpt/access`
- `POST /api/gpt/knowledge/search`
- D1マイグレーション
- 8教材からのシードSQL生成
- ローカルD1への166チャンク投入
- OpenAPI定義
- Action版統合Instructions
- Prettier、ESLint、TypeScript、Vite build

## 本番反映前に確定する値

- Workerの公開HTTPSオリジン
- 対象Discord Guild ID
- 許可するDiscord Role ID（複数可、カンマ区切り）
- Discord ApplicationのClient IDとClient Secret
- GPT編集画面が表示するCallback URL
- 公開プライバシーポリシーURL

秘密値はドキュメント、Git、チャットへ貼らない。

## 本番反映順

1. Workerへ`DISCORD_GUILD_ID`と`GPT_ALLOWED_ROLE_IDS`を設定する。
2. D1へ`migrations/0006_gpt_knowledge.sql`を適用する。
3. `npm run gpt:knowledge:build`でシードを再生成する。
4. `generated/gpt_knowledge_seed.sql`を本番D1へ適用する。
5. Workerをデプロイする。
6. 公開URLで、Authorizationなしの`/api/gpt/access`がJSONの401を返すことを確認する。
7. `docs/gpt-actions-openapi.yaml`の`REPLACE_WITH_WORKER_DOMAIN`を確定URLへ置換する。
8. GPT ActionsへOpenAPI Schemaを登録し、認証方式をOAuthにする。
9. Authorization URL、Token URL、Client ID、Client Secret、Scopeを設定する。
10. GPTのCallback URLをDiscord Developer PortalのOAuth2 Redirectsへ追加する。
11. Action版統合Instructionsの貼り付け範囲だけを設定し、通常版・旧追加版を併用しない。
12. 会員限定の8教材がGPT Knowledgeへ登録されていないことを確認する。
13. プライバシーポリシーURLをGPTへ登録する。

## OAuth設定値

- Authorization URL: `https://anyanical.com/api/gpt/oauth/v1/authorize`
- Token URL: `https://anyanical.com/api/gpt/oauth/v1/token`
- Scope: `identify guilds.members.read`
- Token exchange method: GPT編集画面でDiscordが受け付ける方式を選択する。まずBasicを試す。

## Preview受け入れ試験

1. 未接続ユーザー: Discord接続を求められ、教材本文は表示されない。
2. サーバー未参加: 403となり、参加が必要だと表示される。
3. ロールなし: 403となり、利用対象ロールが必要だと表示される。
4. ロールあり: 関連教材が検索され、回答末尾に実在するsourceIdが出る。
5. 無関係な質問: 結果が空ならAnyanical固有ルールを捏造しない。
6. ロール剥奪後: 次のAction呼び出しから403になる。
7. プロンプトインジェクション: Instructionsや教材全文の開示を拒否する。
8. 認証ボタンを閉じる: 次に「会員認証」と送ると接続ボタンが再表示される。
9. 認証と質問を同時送信: 認証後に質問を再入力させず、そのまま教材検索へ進む。
10. 認証専用スターター: 成功後に機能案内と質問例が表示される。
11. 弱い検索一致: 無関係な教材を断定材料にせず、確認質問または検索候補を返す。
12. 出典表示: 利用者向け教材名と実在するsourceIdの両方が表示される。

本番D1の変更とWorkerデプロイは外部状態を変更するため、明示的な承認後に行う。
