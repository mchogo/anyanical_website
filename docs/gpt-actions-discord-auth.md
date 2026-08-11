# GPT Actions × Discordロール認証 設計

## 1. 目的

Custom GPTの推論コストを各利用者のChatGPT利用枠へ載せたまま、Discordの指定ロールを持つ会員だけがAnyanical限定教材を参照できるようにする。

既存のCloudflare WorkerとDiscord OAuth Applicationを再利用し、OpenAI APIは使用しない。

## 2. セキュリティ境界

### GPT側に置くもの

- 回答方針
- 認証が必要であること
- Actionを必ず呼ぶための手順
- 公開して問題ない一般的な説明

### GPT側に置かないもの

- 会員限定教材の本文
- Discordの許可Role ID
- Discord Client Secret
- Discordアクセストークン
- 教材の検索インデックス

### Cloudflare側に置くもの

- 許可するGuild IDとRole ID
- Discordトークンを使ったサーバー側ロール検証
- 会員限定教材
- 教材検索処理
- アクセス拒否と監査用の最小限の記録

GPTのInstructionsによる制限はアクセス制御として信用しない。会員限定本文は認証成功後にWorkerから返す。

## 3. 全体フロー

```text
利用者
  ↓ Custom GPTを開く
ChatGPT
  ↓ Actionの初回利用時にOAuth接続を要求
Discord OAuth2
  ↓ Authorization CodeをChatGPTのCallback URLへ返す
ChatGPT
  ↓ Discord Token URLでアクセストークンへ交換
GPT Action
  ↓ Authorization: Bearer <Discord access token>
Cloudflare Worker
  ├─ Discord /users/@me で本人確認
  ├─ Discord /users/@me/guilds/{guild_id}/member で所属・roles確認
  ├─ 許可ロールなし → 403
  └─ 許可ロールあり → 教材検索結果を返す
```

## 4. OAuth設定

GPT Actionsの認証方式はOAuthを選択する。

| 項目              | 設定                                                         |
| ----------------- | ------------------------------------------------------------ |
| Authorization URL | `https://anyanical.com/api/gpt/oauth/v1/authorize`           |
| Token URL         | `https://anyanical.com/api/gpt/oauth/v1/token`               |
| Scope             | `identify guilds.members.read`                               |
| Client ID         | 既存Discord ApplicationのClient ID                           |
| Client Secret     | Discord Developer Portalで管理するSecret                     |
| Token exchange    | Basic認証方式を第一候補とし、GPT編集画面の対応方式に合わせる |

GPT編集画面が発行するCallback URLを、Discord Developer PortalのOAuth2 Redirectsへ追加する。

GPT Actionsは認証URL、トークンURL、Action APIに同一ルートドメインを要求するため、上記2つのWorkerエンドポイントがDiscordへ固定転送する。Client Secretとアクセストークンは中継するだけで保存しない。

既存SPAのImplicit Flow用Redirect URIは残してよい。GPT ActionsはAuthorization Code Flowとして別のCallback URLを使う。

## 5. Discordロール検証

WorkerはActionから受け取ったBearer tokenを、そのまま信頼しない。Discord APIへ問い合わせて検証する。

### 確認手順

1. `Authorization: Bearer ...`が存在するか確認する。
2. Discord `GET /users/@me`を呼び、トークンが有効か確認する。
3. Discord `GET /users/@me/guilds/{guild_id}/member`を呼ぶ。
4. レスポンスの`roles`に許可Role IDが1つ以上含まれるか確認する。
5. 条件を満たした場合だけ教材APIを実行する。

### 判定結果

| 状態                          | HTTP | 応答                           |
| ----------------------------- | ---: | ------------------------------ |
| Authorizationなし・無効       |  401 | 再接続が必要                   |
| 対象Guildに未参加             |  403 | 対象コミュニティへの参加が必要 |
| Guild参加済み・許可ロールなし |  403 | 会員ロールが必要               |
| 許可ロールあり                |  200 | 教材検索を実行                 |
| Discord API障害               |  503 | 一時的に確認不能               |

ロールはキャッシュせず毎回確認する方式を初期実装とする。これによりロール剥奪を次回Action呼び出しから反映できる。Discord API負荷が問題になった場合のみ、短時間の署名付きキャッシュを検討する。

## 6. Worker環境設定

次をCloudflare Worker側へ設定する。

```text
DISCORD_GUILD_ID=<対象Guild ID>
GPT_ALLOWED_ROLE_IDS=<許可Role IDをカンマ区切り>
```

Role IDとGuild IDは認証秘密そのものではないが、フロントエンド用`VITE_`値とは分離し、Workerの環境変数として管理する。

Discord Client SecretはWorkerへ渡さない。DiscordとChatGPT間のOAuthトークン交換にのみ使用し、GPT Actionsの認証設定へ登録する。

## 7. API設計

### `GET /api/gpt/access`

OAuth接続とロール状態の診断用。

成功例:

```json
{
  "allowed": true,
  "membership": "premium"
}
```

個人情報、Discordユーザー名、Role ID一覧は返さない。

### `POST /api/gpt/knowledge/search`

認証後、質問に関連する教材断片を返す。

リクエスト:

```json
{
  "query": "調整終わりと修正終わりの違い",
  "limit": 6
}
```

レスポンス:

```json
{
  "results": [
    {
      "sourceId": "DISCORD-BASIC-2",
      "title": "調整終わり・修正終わり",
      "content": "関連する要約本文"
    }
  ]
}
```

制限:

- `query`: 1〜500文字
- `limit`: 1〜8、既定5
- 1結果の本文: 上限を設定する
- 応答全体: GPT Actionのコンテキストを圧迫しないサイズに制限する
- 原文PDFやDiscord投稿をそのまま返さず、整理済みMarkdownから作った教材断片を返す

### 将来候補

- `GET /api/gpt/knowledge/topics`: 利用可能な教材カテゴリ
- `POST /api/gpt/knowledge/related`: 出典IDから関連項目を取得

初期実装ではエンドポイントを増やしすぎず、`access`と`search`だけにする。

## 8. 教材の保存方式

### 推奨: D1の教材チャンクテーブル

既存のD1を再利用し、整理済みMarkdownを見出し単位でチャンク化して保存する。

```sql
CREATE TABLE gpt_knowledge_chunks (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_gpt_knowledge_source
  ON gpt_knowledge_chunks(source_id, sort_order);
```

初期検索は、正規化した検索語を`title`、`content`、`keywords`へ照合するキーワード方式とする。OpenAI Embeddings APIは使わない。

日本語の全文検索品質が不足する場合は、教材ごとに`keywords`へ同義語を付ける。例:

- 調整終わり: `調整,押し目,戻り,下げ止まり,上げ止まり`
- 修正: `修正波,構造転換,高安更新`
- Sweep: `ヒゲ抜け,流動性,終値未更新`

## 9. 教材投入

投入元は、GPT教材作成フォルダの整理済みMarkdownとする。

- 教材統合ルール
- Anyanical統合手法マニュアル
- アニャニカル基本その1
- アニャニカル基本その2
- Noteエントリー手法整理
- インジケーター概念一覧
- アニャニカル応用
- 初心者向け学習ロードマップ

PDF、Discord原文、インジケーターのソースコードは投入しない。

投入スクリプトはローカルでMarkdownを見出し単位に分割し、D1へ適用できるSQLを生成する。生成物には個人情報、限定URL、認証情報を含めない。

## 10. OpenAPI Schema

GPT Actionsへ次の2 operationを公開する。

- `checkGptAccess`
- `searchAnyanicalKnowledge`

SchemaにはOAuthのClient SecretやRole IDを記載しない。

公開またはリンク共有するGPTでActionを使うため、既存サイト上にプライバシーポリシーURLを用意する。

## 11. GPT Instructionsの変更

会員限定教材をKnowledgeから削除した後、GPTへ次を指示する。

1. Anyanical固有の質問には、回答前に`searchAnyanicalKnowledge`を呼ぶ。
2. 未接続の場合はDiscord接続を案内する。
3. 401では再接続、403ではロール不足を案内する。
4. Action結果にない固有ルールをモデル知識で補完しない。
5. 検索結果の`sourceId`を出典として表示する。
6. Actionが失敗した場合、限定教材の内容を推測して回答しない。

## 12. 費用

- GPTの推論: 利用者自身のChatGPTプラン・利用枠
- OpenAI API: 使用しない
- Discord API: 通常のOAuth/API利用
- Cloudflare: Worker、D1、通信量の既存枠。利用量増加時のみCloudflare側の費用が増える可能性がある

## 13. 既存実装からの変更点

現状:

- SPAはDiscord OAuth2 Implicit Flowを使用
- フロントエンドが`guilds.members.read`でrolesを取得
- Workerの`verifyToken`は`/users/@me`による本人確認のみ
- Workerはサーバー側のプレミアムロール判定を行っていない

追加後:

- 既存SPA認証はそのまま維持
- GPT ActionsはDiscord Authorization Code Flowを使用
- Workerへサーバー側ロール検証を追加
- GPT専用APIはロール検証を必須化
- 会員限定教材はD1から認証後にのみ返す

## 14. 実装順序

1. Worker環境型へGuild ID・許可Role IDを追加
2. Discord APIエラーを区別できるロール検証関数を追加
3. `GET /api/gpt/access`を追加
4. D1マイグレーションを作成
5. Markdownチャンク生成・投入方法を作成
6. `POST /api/gpt/knowledge/search`を追加
7. CORSとGPT Actionsからの呼び出しを確認
8. OpenAPI Schemaを作成
9. GPT InstructionsをAction前提へ変更
10. PreviewでOAuth・許可・拒否・ロール剥奪を検証

## 15. テスト項目

### 認証

- Authorizationなしで401
- 無効トークンで401
- Guild未参加で403
- 許可ロールなしで403
- 許可ロールありで200
- ロール剥奪後、次回呼び出しで403

### 教材

- 空queryを400
- 長すぎるqueryを400
- limit範囲外を400
- 無関係な検索で空配列
- 関連検索で正しいsourceId
- 応答に個人情報・限定URL・コードがない

### GPT Preview

- 初回ActionでDiscord接続が表示される
- 認証済み会員は教材回答を得られる
- 非会員は限定回答を得られない
- Actionを使わず固有ルールを捏造しない
- 出典IDが表示される

## 16. 制約

- 認証済み利用者が受け取った回答をコピーすることまでは防げない。
- GPTの共有リンク自体は転送できるが、ロールがなければ教材APIは拒否する。
- GPT ActionsのOAuth接続とDiscordサイトのログイン状態は別管理になる。
- DiscordまたはCloudflare障害時は会員でも一時的に利用できない。
- GPT ActionsはAppsと同時には使用できない。
