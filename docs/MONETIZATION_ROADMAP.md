# 収益化機能実装ロードマップ

## 概要

このドキュメントは、Morizo Mobileアプリの収益化機能実装における全体の進捗を追跡するための統合ロードマップです。

**最終更新**: 2025年12月7日  
**バージョン**: 1.2  
**対象**: Morizo-mobile（モバイルアプリ）、Morizo-aiv2（バックエンド）

---

## 進捗サマリー

| フェーズ | ステータス | 進捗率 |
|---------|----------|--------|
| フェーズ0: 基盤実装 | ✅ 完了 | 100% |
| フェーズ1: データベーススキーマ拡張 | ✅ 完了 | 100% |
| フェーズ2: バックエンドAPI実装 | ✅ 完了 | 90% |
| フェーズ3: モバイルアプリIAP連携 | ✅ 完了 | 100% |
| フェーズ4: RevenueCat設定 | ✅ 完了 | 100% |
| フェーズ5: ストア設定 | ⏳ 未着手 | 0% |
| フェーズ6: サンドボックステスト | 🔄 進行中 | 60% |
| フェーズ7: 日次リセット機能 | ⏳ 未着手 | 0% |
| フェーズ8: 本番環境リリース | ⏳ 未着手 | 0% |

**全体進捗**: 約 65% 完了

---

## フェーズ0: 基盤実装（完了）

### 0.1 モバイルアプリ実装

- [x] IAPライブラリの導入（`react-native-purchases`）
- [x] 商品ID設定ファイルの作成（`config/subscription.ts`）
- [x] バックエンドAPIクライアントの実装（`api/subscription-api.ts`）
- [x] UIコンポーネントの実装
  - [x] `PlanCard.tsx` - プラン表示カード
  - [x] `SubscriptionScreen.tsx` - サブスクリプション管理画面
- [x] RevenueCat初期化処理の実装
- [x] 購入フローとバックエンド同期の実装
- [x] 購入復元機能の実装

**完了日**: 2025年1月29日

---

## フェーズ1: データベーススキーマ拡張（完了）

### 1.1 Supabaseデータベースの拡張

- [x] `user_subscriptions`テーブルの作成
  - [x] テーブル定義
  - [x] インデックス作成
  - [x] RLS（Row Level Security）設定
  - [x] サービスロール用ポリシー設定

- [x] `usage_limits`テーブルの作成
  - [x] テーブル定義
  - [x] インデックス作成
  - [x] RLS設定
  - [x] サービスロール用ポリシー設定

- [x] マイグレーションスクリプトの作成（`docs/archive/DDL.md`に記載）

**参考ドキュメント**: `docs/archive/monetization/MONETIZATION_IMPLEMENTATION_PLAN.md` セクション3.1

**完了日**: 2025年1月29日（確認済み）

**実装場所**: `/app/Morizo-aiv2/docs/archive/DDL.md`

---

## フェーズ2: バックエンドAPI実装（完了 - 90%）

### 2.1 プラン管理API

- [x] `api/routes/subscription.py` の作成
  - [x] `GET /api/subscription/plan` - 現在のプラン情報取得
  - [x] `POST /api/subscription/update` - プラン更新
  - [x] `GET /api/subscription/usage` - 本日の利用回数取得

**実装場所**: `/app/Morizo-aiv2/api/routes/subscription.py`

### 2.2 利用回数制限サービス

- [x] `api/utils/subscription_service.py` の作成
  - [x] プラン情報の取得機能（`get_user_plan`）
  - [x] 利用回数制限のチェック機能（`check_usage_limit`）
  - [x] 利用回数のインクリメント機能（`increment_usage`）
  - [x] 利用回数取得機能（`get_usage_limits`）
  - [x] 日次リセット処理の準備（JST日付取得関数）

**実装場所**: `/app/Morizo-aiv2/api/utils/subscription_service.py`

### 2.3 利用回数制限ミドルウェア

- [ ] `api/middleware/usage_limit.py` の作成
  - [ ] 機能タイプ判定（menu_bulk, menu_step, ocr）
  - [ ] プランと利用回数のチェック
  - [ ] 制限超過時のエラーレスポンス

**注意**: 現時点では、各エンドポイントで直接`subscription_service`を呼び出しているため、ミドルウェアは必須ではない。将来的に統一化する場合は実装を検討。

### 2.4 既存エンドポイントへの制限チェック追加

- [x] OCRエンドポイント（`POST /api/inventory/ocr-receipt`）
  - [x] 呼び出し前の利用回数チェック
  - [x] 成功時の利用回数インクリメント

**実装場所**: `/app/Morizo-aiv2/api/routes/inventory.py` (252行目、301行目)

- [x] 献立一括提案（チャットエンドポイント内）
  - [x] `generate_menu_plan`呼び出し前のチェック
  - [x] 成功時の利用回数インクリメント

**実装場所**: `/app/Morizo-aiv2/core/executor.py` (219行目、226行目)

- [x] 段階的提案（チャットエンドポイント内）
  - [x] `generate_proposals`呼び出し前のチェック
  - [x] 成功時の利用回数インクリメント

**実装場所**: `/app/Morizo-aiv2/core/executor.py` (238行目、245行目)

### 2.5 レシート検証機能

- [ ] `api/utils/receipt_verification.py` の作成
  - [ ] Google Play レシート検証
  - [ ] App Store レシート検証
  - [ ] エラーハンドリング

**注意**: 現時点では未実装。RevenueCatがレシート検証を代行する可能性があるため、本番環境リリース前に実装の必要性を検討する。

**参考ドキュメント**: 
- `docs/archive/monetization/MONETIZATION_IMPLEMENTATION_PLAN.md` セクション3.2
- `docs/archive/monetization/MONETIZATION_IMPLEMENTATION_DETAILS.md` セクション2.2, 3.1

**完了日**: 2025年1月29日（確認済み）

**残タスク**: 
- レシート検証機能（本番環境リリース前に実装の必要性を検討）
- 利用回数制限ミドルウェア（オプション、統一化が必要な場合のみ）

---

## フェーズ3: モバイルアプリIAP連携（完了）

### 3.1 実装完了項目

- [x] IAPライブラリの導入（`react-native-purchases`）
- [x] 商品ID設定ファイル（`config/subscription.ts`）
- [x] バックエンドAPIクライアント（`api/subscription-api.ts`）
- [x] UIコンポーネント
  - [x] `PlanCard.tsx`
  - [x] `SubscriptionScreen.tsx`
- [x] RevenueCat初期化処理
- [x] 購入フロー実装
- [x] バックエンド同期処理
- [x] 購入復元機能

**完了日**: 2025年1月29日

**注意事項**:
- Expo Go環境では動作しない（Expo Development Buildが必要）
- ストア設定が完了するまで、実際の購入テストは不可

---

## フェーズ4: RevenueCat設定（完了 - 100%）

### 4.1 RevenueCatプロジェクト設定

- [x] RevenueCatアカウントの作成
- [x] プロジェクトの作成
- [x] テストストアの確認

### 4.2 RevenueCat APIキーの取得

- [x] テストストア用APIキーの取得
- [x] 環境変数への設定（`.env`）
- [x] iOS用APIキーの取得（プラットフォーム追加後）
- [x] Android用APIキーの取得（プラットフォーム追加後）

**完了日**: 2025年1月29日（確認済み）

**現在の状況**: 
- ✅ テストストア用APIキーは取得済み（`.env`に記載済み）
- ✅ iOS用APIキーは取得済み（`.env`に記載済み）
- ✅ Android用APIキーは取得済み（`.env`に記載済み）

### 4.3 RevenueCatダッシュボードでの商品設定

- [x] Product Catalogでの商品作成（テストストア）
  - [x] `morizo_pro_monthly` の作成
  - [x] `morizo_ultimate_monthly` の作成
- [x] Entitlementsでのエンタイトルメント作成
  - [x] `pro` エンタイトルメント
  - [x] `ultimate` エンタイトルメント
- [x] Offeringsでのオファリング作成
  - [x] `default` オファリングの作成
  - [x] パッケージの追加（`pro_monthly`, `ultimate_monthly`）
  - [x] オファリングを「Current」に設定

**完了日**: 2025年1月29日（確認済み）

**現在の状況**: 
- ✅ テストストアでの商品設定は完了（初期テスト用）
- ⚠️ 本番環境では、プラットフォーム固有のストア（Play Store / App Store）での商品登録と連携が必要

**注意事項**:
- **テストストアでの設定**: 初期開発・テスト段階では問題ありません。ストア側での商品登録なしでテスト可能です。
- **プラットフォーム固有のAPIキーを使用する場合**: 開発ビルドでプラットフォーム固有のAPIキー（Android用/iOS用）を使用する場合、以下の対応が必要です：
  1. RevenueCatダッシュボードで、プラットフォーム（Android/iOS）に商品を連携
  2. オファリングにプラットフォーム固有の商品を追加
  3. 詳細手順は「4.5 プラットフォーム固有APIキー使用時の商品連携」を参照
- **本番環境への移行**: 本番環境に移行する際は、以下の対応が必要です：
  1. Google Play Console / App Store Connectで実際の商品を登録（フェーズ5）
  2. RevenueCatでプラットフォーム（iOS/Android）を追加済み（4.4で完了）
  3. テストストアの商品をプラットフォーム固有のストア商品に連携
  4. オファリングにプラットフォーム固有の商品を追加

**参考ドキュメント**: `docs/archive/monetization/REVENUECAT_INITIAL_TEST_PLAN.md`

### 4.5 プラットフォーム固有APIキー使用時の商品連携（重要）

**問題**: 開発ビルドでプラットフォーム固有のAPIキー（Android用/iOS用）を使用する場合、オファリングに商品が登録されていないと`ConfigurationError`が発生します。

**エラーメッセージ例**:
```
Error fetching offerings - PurchasesError(code=ConfigurationError, underlyingErrorMessage=There are no products registered in the RevenueCat dashboard for your offerings.)
```

**解決方法**: RevenueCatダッシュボードで、プラットフォーム（Android/iOS）に商品を連携する必要があります。

#### 4.5.1 手順（Androidプラットフォームの場合）

**方法1: ImportボタンでPlay Storeの商品をインポート（最も簡単・推奨）**

Google Play Consoleで商品を登録済みの場合、この方法が最も簡単です：

1. **RevenueCatダッシュボードにログイン**
   - [RevenueCatダッシュボード](https://app.revenuecat.com/)にアクセス

2. **Product CatalogでImportを実行**
   - 左メニュー → 「**Product catalog**」→ 「**Products**」を選択
   - 「**Morizo Mobile (Play Store)**」セクションの「**Import**」ボタンをクリック
   - Play Storeに登録済みの商品が一覧表示されます
   - 必要な商品（`morizo_pro_monthly`, `morizo_ultimate_monthly`など）を選択してインポート
   - インポート後、商品が「Morizo Mobile (Play Store)」セクションに表示されます

3. **オファリングに商品を追加（重要！）**
   - 左メニュー → 「**Product catalog**」→ 「**Offerings**」を選択
   - `default`オファリングをクリック
   - パッケージ一覧で、`pro_monthly`パッケージをクリック（または編集ボタンをクリック）
   - 「**Product**」ドロップダウンで、**Play Storeの商品**を選択
     - 例: `morizo_pro_monthly:morizo-pro-monthly`（Play Store）
     - **注意**: Test Storeの商品ではなく、**Play Storeの商品**を選択してください
   - 「**Save**」をクリック
   - 同様に、`ultimate_monthly`パッケージも編集して、Play Storeの商品（`morizo_ultimate_monthly:morizo-ultimate-monthly`）を選択

4. **オファリングを「Current」に設定**
   - オファリング一覧で、`default`オファリングの「**Set as current**」をクリック

**重要**: Product Catalogに商品を追加しただけでは不十分です。**必ずオファリングのパッケージにPlay Storeの商品を選択**してください。現在、パッケージにはTest Storeの商品が選択されている可能性があります。

**方法2: 商品を編集してプラットフォームに連携**

1. **RevenueCatダッシュボードにログイン**
   - [RevenueCatダッシュボード](https://app.revenuecat.com/)にアクセス

2. **Product Catalogで商品を編集**
   - 左メニュー → 「**Product catalog**」→ 「**Products**」を選択
   - 既存の商品（`morizo_pro_monthly`など）をクリック
   - 右上の「**Edit**」ボタンをクリック

3. **プラットフォームに商品を連携**
   - 編集画面で、「**Stores**」または「**Store products**」セクションを探す
   - プラットフォーム（Android / Google Play）を選択
   - 商品IDを入力（例: `morizo_pro_monthly`）
     - **注意**: Google Play Consoleで商品を登録していない場合でも、商品IDを直接入力することでテスト可能です
   - 「**Save**」をクリック

4. **オファリングに商品を追加**
   - 左メニュー → 「**Offerings**」を選択
   - `default`オファリングを選択
   - パッケージ（`pro_monthly`, `ultimate_monthly`）を編集
   - 「**Product**」ドロップダウンで、プラットフォーム（Android）に連携した商品を選択
   - 「**Save**」をクリック

5. **オファリングを「Current」に設定**
   - オファリング一覧で、`default`オファリングの「**Set as current**」をクリック

**方法3: + Newボタンで新規商品を作成**

Google Play Consoleで商品を登録していない場合、RevenueCatで直接作成できます：

1. **Product Catalogで新規商品を作成**
   - 左メニュー → 「**Product catalog**」→ 「**Products**」を選択
   - 「**Morizo Mobile (Play Store)**」セクションの「**+ New**」ボタンをクリック
   - 商品情報を入力：
     - **Product ID**: `morizo_pro_monthly`（`config/subscription.ts`と一致させる）
     - **Name**: Morizo PRO
     - **Type**: Subscription
     - **Duration**: 1 month
     - **Price**: テスト用の価格（例: $0.99）
   - 「**Save**」をクリック

2. **オファリングに商品を追加**
   - 左メニュー → 「**Offerings**」を選択
   - `default`オファリングを選択
   - パッケージ（`pro_monthly`, `ultimate_monthly`）を編集
   - 「**Product**」ドロップダウンで、作成した商品（Play Store）を選択
   - 「**Save**」をクリック

3. **オファリングを「Current」に設定**
   - オファリング一覧で、`default`オファリングの「**Set as current**」をクリック

**注意**: この方法で作成した商品は、RevenueCat内でのみ有効です。実際の購入テストには、Google Play Consoleで商品を登録してからImportする方法（方法1）を推奨します。

**方法4: Entitlementsから商品をAttach（補助的な方法）**

Entitlementsから商品を「Attach」することで、エンタイトルメントと商品を関連付けることができますが、これはプラットフォーム固有のストアへの連携とは直接関係ありません。主にエンタイトルメントと商品の関連付けに使用します：

1. **Entitlementsで商品をAttach**
   - 左メニュー → 「**Product catalog**」→ 「**Entitlements**」を選択
   - エンタイトルメント（`pro`など）を選択
   - 「**Associated products**」セクションで「**Attach**」をクリック
   - 商品を選択して関連付ける

**推奨手順のまとめ**:

1. **Google Play Consoleで商品を登録済みの場合**: **方法1（Import）**を推奨
   - 最も簡単で確実
   - ストア側の商品情報が自動的に同期される

2. **Google Play Consoleで商品を登録していない場合**: **方法3（+ New）**を使用
   - 開発ビルドでのテスト段階では、この方法でもテスト可能
   - ただし、実際の購入テストには、Google Play Consoleで商品を登録してからImportすることを推奨

**注意事項**:
- 商品の「Store」欄は表示のみで編集できません
- プラットフォーム固有のAPIキー（Android用）を使用する場合、Product Catalogでプラットフォーム（Play Store）用の商品を登録する必要があります
- 「Morizo Mobile (Play Store)」セクションが空の場合、Importまたは+ Newボタンで商品を追加してください

#### 4.5.1.1 トラブルシューティング: オファリングエラーが解消されない場合

**エラーメッセージ**: `There are no products registered in the RevenueCat dashboard for your offerings.`

**原因**: Product Catalogに商品を追加しただけでは不十分です。**オファリングのパッケージにPlay Storeの商品を選択する必要があります**。

**解決手順**:

1. **オファリングのパッケージを確認**
   - 左メニュー → 「**Product catalog**」→ 「**Offerings**」を選択
   - `default`オファリングをクリック
   - パッケージ一覧（`pro_monthly`, `ultimate_monthly`）を確認

2. **パッケージのProductを確認**
   - 各パッケージの「**Product**」欄を確認
   - **Test Storeの商品**が選択されている場合は、**Play Storeの商品**に変更する必要があります

3. **Play Storeの商品を選択**
   - パッケージをクリック（または編集ボタンをクリック）
   - 「**Product**」ドロップダウンで、**Play Storeの商品**を選択
     - `pro_monthly`パッケージ → `morizo_pro_monthly:morizo-pro-monthly`（Play Store）
     - `ultimate_monthly`パッケージ → `morizo_ultimate_monthly:morizo-ultimate-monthly`（Play Store）
   - 「**Save**」をクリック

4. **オファリングを「Current」に設定**
   - オファリング一覧で、`default`オファリングの「**Set as current**」をクリック

5. **アプリを再起動**
   - 設定変更後、アプリを再起動して再度テストしてください

**確認ポイント**:
- ✅ Product CatalogにPlay Storeの商品が表示されているか
- ✅ オファリングのパッケージにPlay Storeの商品が選択されているか
- ✅ オファリングが「Current」に設定されているか

#### 4.5.2 手順（iOSプラットフォームの場合）

iOSプラットフォームの場合も、同様の手順で商品を連携します。

1. **Product Catalogで商品を確認**
2. **プラットフォーム（iOS）に商品を連携**
3. **オファリングに商品を追加**
4. **オファリングを「Current」に設定**

#### 4.5.3 注意事項

- **ストア側での商品登録が不要な場合**: 開発ビルドでのテスト段階では、ストア側（Google Play Console / App Store Connect）での商品登録は不要です。RevenueCatダッシュボードで商品IDを直接入力することで、テスト可能です。
- **テストストアとの違い**: テストストア用APIキーを使用する場合は、プラットフォーム固有の商品連携は不要です。プラットフォーム固有のAPIキーを使用する場合のみ、この手順が必要です。

**参考**: 
- RevenueCat公式ドキュメント: https://rev.cat/how-to-configure-offerings
- RevenueCat公式ドキュメント（オファリングが空の場合）: https://rev.cat/why-are-offerings-empty

### 4.4 プラットフォーム追加と認証情報設定

#### 4.4.1 iOS（App Store Connect）設定

- [x] RevenueCatでiOSプラットフォームを追加
- [x] App Store Connect API Keyの作成
  - [x] Issuer ID、Key ID、.p8ファイルの取得
  - [x] Vendor番号の確認
  - [x] RevenueCatへのアップロード
- [x] In-App Purchase Keyの作成（推奨）
  - [x] Issuer ID、Key ID、.p8ファイルの取得
  - [x] RevenueCatへのアップロード
- [ ] App-Specific Shared Secretの作成（オプション）
  - [ ] 共有シークレットの生成
  - [ ] RevenueCatへの設定

**完了日**: 2025年1月29日（確認済み）

**参考ドキュメント**: `docs/archive/monetization/IOS_APP_STORE_CREDENTIALS_SETUP.md`

#### 4.4.2 Android（Google Play Console）設定

- [x] RevenueCatでAndroidプラットフォームを追加
- [x] Google Play Service Accountの作成
  - [x] Google Cloud Consoleでサービスアカウント作成
  - [x] 必要なロールの付与（Pub/Sub Editor、Monitoring Viewer）
  - [x] JSONキーのダウンロード
- [x] Google Play Consoleでのアクセス権付与
  - [x] サービスアカウントの招待
  - [x] 必要な権限の付与
- [x] RevenueCatへの認証情報アップロード
  - [x] JSONファイルのアップロード
  - [x] 認証情報の検証

**完了日**: 2025年1月29日（確認済み）

**参考ドキュメント**: `docs/archive/monetization/ANDROID_PLAY_SERVICE_CREDENTIALS_SETUP.md`

**現在の状況**: 
- ✅ iOSプラットフォーム追加済み（「Morizo Mobile (App Store)」）
- ✅ Androidプラットフォーム追加済み（「Morizo Mobile (Play Store)」）
- ✅ プラットフォーム追加により、プラットフォーム固有のAPIキーが自動生成され、取得可能

**重要なポイント**:
- プラットフォームを追加すると、RevenueCatが自動的にプラットフォーム固有のAPIキーを生成します
- 「API keys」セクション（左メニュー）から、iOS用（`appl_...`）とAndroid用（`goog_...`）のAPIキーを取得できます
- これらのAPIキーは既に`.env`に設定済み（4.2で完了）

**次のステップ**: 
1. ✅ RevenueCatダッシュボードでの商品設定を完了（4.3）
2. ✅ iOS/Androidプラットフォームの追加（4.4）
3. ✅ プラットフォーム固有のAPIキー取得（4.2）
4. ⏳ ストア設定（フェーズ5）

---

## フェーズ5: ストア設定（未着手）

### 5.1 Google Play Console設定

- [ ] サブスクリプション商品の登録
  - [ ] `morizo_pro_monthly` の登録
  - [ ] `morizo_pro_yearly` の登録（オプション）
  - [ ] `morizo_ultimate_monthly` の登録
  - [ ] `morizo_ultimate_yearly` の登録（オプション）
- [ ] テストアカウントの設定
  - [ ] ライセンステスト用アカウントの追加
  - [ ] テストデバイスの設定

**参考ドキュメント**: `docs/archive/monetization/STORE_SETUP_GUIDE.md` セクション1

### 5.2 App Store Connect設定

- [ ] サブスクリプショングループの作成
  - [ ] 「Morizo Plans」グループの作成
- [ ] サブスクリプション商品の登録
  - [ ] `morizo_pro_monthly` の登録
  - [ ] `morizo_pro_yearly` の登録（オプション）
  - [ ] `morizo_ultimate_monthly` の登録
  - [ ] `morizo_ultimate_yearly` の登録（オプション）
- [ ] サンドボックステスターの設定
  - [ ] サンドボックステスターアカウントの作成
  - [ ] テストデバイスの設定

**参考ドキュメント**: `docs/archive/monetization/STORE_SETUP_GUIDE.md` セクション2

**注意事項**: 
- 商品登録後、承認まで数時間〜数日かかる場合がある
- iOSの商品登録は、App Store Connectでアプリが「準備完了」状態になっている必要がある

---

## フェーズ6: サンドボックステスト（進行中 - 60%）

**開発ビルドの作成方法**: 開発ビルドの作成・使用方法の詳細は、`docs/DEVELOPMENT_BUILD_GUIDE.md`を参照してください。

### 6.1 RevenueCatテストストアでのテスト（開発ビルドでテスト完了）

**現在の進捗状況**: 開発ビルドでのRevenueCatでのサブスク購入まで実装完了。

**準備完了項目**:
- ✅ RevenueCatダッシュボードでの商品設定完了（テストストア）
- ✅ テストストア用APIキー取得済み（`.env`に設定済み）
- ✅ Entitlements設定済み（`pro`, `ultimate`）
- ✅ Offerings設定済み（`default`オファリング、`pro_monthly`, `ultimate_monthly`パッケージ）
- ✅ プラットフォーム固有のAPIキー取得済み（Android用/iOS用）
- ✅ Play Storeの商品をRevenueCatにインポート済み
- ✅ オファリングのパッケージにPlay Storeの商品を設定済み

**テスト完了項目**:
- ✅ 開発ビルドの作成
- ✅ RevenueCat SDKの初期化確認
- ✅ オファリング取得のテスト
- ✅ 購入フローのテスト（PROプランの購入成功を確認）
- ✅ エンタイトルメントの確認
- ✅ バックエンドAPIとの同期確認
- ✅ ログにAPIパス（URL）を追加（デバッグ改善）

**完了日**: 2025年12月7日

**テスト可能な内容**:

#### Expo Go環境でのテスト（制限あり）

- [x] UIのプレビュー
- [x] 統合フローのテスト（エラーハンドリングなど）
- [x] バックエンドAPIとの疎通確認
- [ ] オファリング取得のモック動作（`react-native-purchases`がインポートできない場合は不可）
- [ ] 実際の購入処理（Expo Goでは不可）

**注意**: Expo Go環境では、`react-native-purchases`がネイティブモジュールのため、通常は動作しません。その場合、`isRevenueCatAvailable`が`false`になり、バックエンドAPI連携のみ動作します。

#### 開発ビルド環境でのテスト（完了）

**開発ビルドの詳細ガイド**: 開発ビルドの作成・使用方法の詳細は、`docs/DEVELOPMENT_BUILD_GUIDE.md`の「クイックスタート」セクションを参照してください。

**完了したテスト**:
- [x] 開発ビルドの作成（`eas build --profile development --platform android`）
- [x] テストストア用APIキーが`.env`に設定されていることを確認
- [x] RevenueCat SDKの初期化確認
- [x] オファリング取得のテスト
- [x] 購入フローのテスト（PROプランの購入成功を確認）
- [x] エンタイトルメントの確認
- [x] バックエンドAPIとの同期確認
- [x] エラーハンドリングのテスト

**テスト手順**:

1. **開発ビルドの作成**
   ```bash
   # Android用
   eas build --profile development --platform android
   
   # iOS用
   eas build --profile development --platform ios
   ```

2. **アプリの起動と初期化確認**
   - 開発ビルドをインストールしてアプリを起動
   - `SubscriptionScreen`を開く
   - ログでRevenueCatの初期化が成功していることを確認
   - `isRevenueCatAvailable`が`true`になっていることを確認

3. **オファリング取得のテスト**
   - `SubscriptionScreen`で「プランを選択」セクションを確認
   - PROとULTIMATEのプランカードが表示されていることを確認
   - ログで、オファリングデータが正常に取得できていることを確認

4. **購入フローのテスト**
   - PROまたはULTIMATEプランを選択
   - 「購入」ボタンをクリック
   - RevenueCatの購入ダイアログが表示されることを確認
   - 購入処理が正常に完了することを確認
   - バックエンドへの同期が正常に動作することを確認

5. **RevenueCatダッシュボードでの確認**
   - 左メニューから「Customers」を選択
   - テスト購入を行ったユーザーを検索
   - 購入履歴、エンタイトルメント、サブスクリプションステータスを確認

**参考ドキュメント**: `docs/archive/monetization/REVENUECAT_INITIAL_TEST_PLAN.md`

**注意事項**:
- テストストアでは、実際の課金は発生しません
- テストストアでの購入は、RevenueCatダッシュボードで確認できます
- 本番環境に移行する前に、ストア側での商品登録とプラットフォーム固有のAPIキーでのテストが必要です

### 6.2 プラットフォーム固有APIキーでのテスト

- [ ] iOS用APIキーでの初期化確認
- [ ] Android用APIキーでの初期化確認
- [ ] RevenueCatダッシュボードでの接続確認

**参考ドキュメント**: `docs/archive/monetization/REVENUECAT_NEXT_STEPS.md` セクション1

### 6.3 ストアサンドボックス環境でのテスト

#### 6.3.1 Androidサンドボックステスト

- [ ] 開発ビルドの作成（Android）
- [ ] テストアカウントでのログイン
- [ ] サンドボックス環境での購入テスト
- [ ] レシート検証の確認
- [ ] バックエンドAPI同期の確認

#### 6.3.2 iOSサンドボックステスト

- [ ] 開発ビルドの作成（iOS）
- [ ] 実機（iPhone/iPad）へのインストール
- [ ] サンドボックステスターでのログイン
- [ ] サンドボックス環境での購入テスト
- [ ] レシート検証の確認
- [ ] バックエンドAPI同期の確認

**注意事項**: 
- iOSのサンドボックステストは実機が必要（シミュレータでは動作しない）
- Androidはエミュレータでもテスト可能

**参考ドキュメント**: `docs/archive/monetization/REVENUECAT_NEXT_STEPS.md` セクション3

---

## フェーズ7: 日次リセット機能（未着手）

### 7.1 日次リセットスクリプト

- [ ] `scripts/daily_reset.py` の作成
  - [ ] 日本時間（JST）の日付取得
  - [ ] 利用回数レコードのリセット処理
  - [ ] ログ出力機能

### 7.2 スケジューラー設定

- [ ] cronジョブまたはsystemd timerの設定
- [ ] 日本時間（JST）0:00での実行設定
- [ ] タイムゾーン設定の確認

### 7.3 リカバリ処理

- [ ] 手動リセットスクリプトの作成
- [ ] エラーハンドリングとログ記録
- [ ] 監視設定

**参考ドキュメント**: `docs/archive/monetization/MONETIZATION_IMPLEMENTATION_PLAN.md` セクション3.4

---

## フェーズ8: 本番環境リリース（未着手）

### 8.1 リリース前チェックリスト

- [ ] サンドボックステストの完了確認
- [ ] バックエンドAPIのレシート検証確認
- [ ] エラーハンドリングの確認
- [ ] ログ出力設定の確認
- [ ] セキュリティ設定の確認

### 8.2 本番環境への移行

- [ ] プラットフォーム固有のAPIキーへの切り替え確認
- [ ] ストアで設定した実際の製品をオファリングに追加
- [ ] 本番環境のビルド作成
- [ ] ストアへの提出
- [ ] 審査待ち
- [ ] リリース

---

## 現在の課題と次のアクション

### 現在の課題

1. **Apple ID作成の問題**
   - サンドボックステスト用のApple ID作成で悩んでいた
   - 解決方法: App Store Connectの「ユーザーとアクセス」→「サンドボックステスター」から作成可能
   - または、Googleメールの「+」機能を使用して新しいApple IDを作成

2. **セキュリティ問題対応**
   - セキュリティ問題対応に追われていた
   - 対応完了後、収益化作業を再開

3. **RevenueCat test_storeエラー（解決済み）**
   - **問題**: 開発ビルドでサブスクリプション画面を開いた際に、`test_store`エラーが発生
   - **エラーメッセージ**: `kotlinx.serialization.SerializationException: com.revenuecat.purchases.Store does not contain element with name 'test_store' at path $.store`
   - **原因**: 開発ビルドでは、テストストア用APIキーではなく、プラットフォーム固有のAPIキー（Android用/iOS用）を使用する必要がある
   - **解決方法**: `SubscriptionScreen.tsx`のAPIキー優先順位を変更し、プラットフォーム固有のAPIキーを優先的に使用するように修正
   - **対応日**: 2025年1月29日

4. **RevenueCat ConfigurationError（解決済み）**
   - **問題**: 開発ビルドでプラットフォーム固有のAPIキー（Android用）を使用した際に、オファリング取得エラーが発生
   - **エラーメッセージ**: `PurchasesError(code=ConfigurationError, underlyingErrorMessage=There are no products registered in the RevenueCat dashboard for your offerings.)`
   - **解決方法**: 
     - ✅ Product CatalogでPlay Storeの商品をインポート
     - ✅ オファリングのパッケージにPlay Storeの商品を設定
     - ✅ プラットフォーム固有のAPIキーを使用するように修正
   - **対応完了日**: 2025年12月7日
   - **結果**: 開発ビルドでのRevenueCatでのサブスク購入が成功

5. **二重課金の問題（未解決）**
   - **問題**: PROプランからULTIMATEプランにアップグレードした場合、両方のサブスクリプションが有効なままになる
   - **確認済み**: Google Playストアの「定期購入」画面で、PROとULTIMATEの両方が表示されていることを確認
   - **原因**: `pro`と`ultimate`は別々のエンタイトルメントとして設定されているため、RevenueCatでは異なるエンタイトルメント間のアップグレード時に既存のサブスクリプションが自動的にキャンセルされない
   - **調査結果**: 
     - RevenueCatのCustomerInfoから`purchase_token`を取得することはできない
     - バックエンド側でも`purchase_token`を取得できない
     - 実装不可能と判断し、cancel関連の実装を削除
   - **現在の状況**: 未解決。将来的な対応方法を検討する必要がある
   - **調査ドキュメント**: `docs/MONETIZATION_DOUBLE_BILLING_INVESTIGATION.md`を参照
   - **対応開始日**: 2025年12月7日

6. **ストア解約時の同期問題（未解決）**
   - **問題**: ストア（Google Play / App Store）でサブスクリプションを解約した場合、`user_subscriptions`テーブルの`subscription_status`が更新されず、`'active'`のまま残る
   - **想定される動作**: ストアで解約した場合、`user_subscriptions`テーブルの`subscription_status`を`'cancelled'`または`'expired'`に更新する必要がある
   - **原因**: 
     - RevenueCatのWebhookが未設定、または未実装
     - バックエンドでの定期的な同期処理が未実装
     - アプリ起動時の状態確認処理が未実装
   - **対応が必要**:
     - RevenueCatのWebhookを設定し、解約イベントを受信して`user_subscriptions`を更新する
     - または、アプリ起動時や定期的にRevenueCatからサブスクリプション状態を取得して同期する
     - または、バックエンドで定期的にRevenueCat APIを呼び出して状態を同期する
   - **現在の状況**: 未解決。本番環境リリース前に実装が必要
   - **対応開始日**: 2025年12月7日

### 次のアクション（優先順位順）

1. **ストア設定**（優先度: 高）
   - Google Play Consoleでの商品登録
   - App Store Connectでの商品登録
   - 参考: `docs/archive/monetization/STORE_SETUP_GUIDE.md`

2. **ストアサンドボックス環境でのテスト**（優先度: 高）
   - Androidサンドボックステスト
   - iOSサンドボックステスト
   - レシート検証の確認

3. **ストア解約時の同期処理の実装**（優先度: 高）
   - RevenueCat Webhookの設定と実装
   - または、アプリ起動時の状態確認処理の実装
   - または、バックエンドでの定期的な同期処理の実装
   - `user_subscriptions`テーブルの`subscription_status`を適切に更新する処理
   - 参考: `docs/archive/monetization/REVENUECAT_WEBHOOK_IMPLEMENTATION.md`

4. **二重課金問題の対応検討**（優先度: 中）
   - 将来的な対応方法の検討
   - ユーザーへの案内方法の検討
   - 参考: `docs/MONETIZATION_DOUBLE_BILLING_INVESTIGATION.md`

5. **レシート検証機能の実装検討**（優先度: 低）
   - 本番環境リリース前に実装の必要性を検討
   - RevenueCatがレシート検証を代行する可能性を確認
   - 参考: `docs/archive/monetization/MONETIZATION_IMPLEMENTATION_DETAILS.md` セクション2.2, 3.1

**完了済み**:
- ✅ データベーススキーマ拡張（フェーズ1）
- ✅ バックエンドAPI実装（フェーズ2 - 90%完了）
- ✅ モバイルアプリIAP連携（フェーズ3）
- ✅ RevenueCat設定（フェーズ4）
- ✅ 開発ビルドでのRevenueCatでのサブスク購入テスト（フェーズ6 - 一部完了）

---

## 参考ドキュメント一覧

**注意**: 以下のドキュメントは `docs/archive/monetization/` にアーカイブされています。詳細な実装手順や設定方法については、アーカイブされたドキュメントを参照してください。

### 実装プラン
- `docs/archive/monetization/MONETIZATION_IMPLEMENTATION_PLAN.md` - 収益化機能実装プラン（全体像）
- `docs/archive/monetization/MONETIZATION_IMPLEMENTATION_DETAILS.md` - 実装詳細注意事項

### RevenueCat設定
- `docs/archive/monetization/REVENUECAT_INITIAL_TEST_PLAN.md` - RevenueCat初期テスト実施プラン
- `docs/archive/monetization/REVENUECAT_NEXT_STEPS.md` - RevenueCat次のステップ
- `docs/archive/monetization/PHASE3_AI_RESPONSE.md` - Phase3実装完了報告とAPIキー取得方法
- `docs/archive/monetization/REVENUECAT_WEBHOOK_IMPLEMENTATION.md` - RevenueCat Webhook実装ガイド（解約時の同期処理）

### ストア設定
- `docs/archive/monetization/STORE_SETUP_GUIDE.md` - Google Play Console / App Store Connect設定ガイド
- `docs/archive/monetization/IOS_APP_STORE_CREDENTIALS_SETUP.md` - iOS App Store認証情報設定手順
- `docs/archive/monetization/ANDROID_PLAY_SERVICE_CREDENTIALS_SETUP.md` - Android Play Service認証情報設定手順

---

## 進捗更新方法

このロードマップを更新する際は、以下の点に注意してください：

1. **チェックボックスの更新**: タスク完了時に `[ ]` を `[x]` に変更
2. **ステータスの更新**: 各フェーズのステータスを更新
  - ✅ 完了
  - 🔄 進行中
  - ⏳ 未着手
  - ⚠️ 問題発生
3. **進捗率の更新**: 各フェーズの進捗率を計算して更新
4. **現在の課題セクションの更新**: 新しい課題や解決した課題を記録
5. **次のアクションの更新**: 優先順位を再評価して更新

---

**最終更新**: 2025年12月7日  
**作成者**: AIエージェント協働チーム

