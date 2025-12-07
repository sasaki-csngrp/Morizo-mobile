# Phase1 動作確認ガイド

## 実施内容の確認

Phase1では、RevenueCat SDK管理を`lib/subscription/revenue-cat-client.ts`に分離しました。

## 確認可能な項目

### 1. 静的チェック（✅ 完了）

#### 1.1 リンターエラーの確認
```bash
# リンターエラーなし
✅ screens/SubscriptionScreen.tsx - No linter errors
✅ lib/subscription/revenue-cat-client.ts - No linter errors
```

#### 1.2 インポートパスの確認
```bash
# SubscriptionScreen.tsxから正しくインポートされている
✅ import { RevenueCatClient } from '../lib/subscription/revenue-cat-client';
```

#### 1.3 ファイル構造の確認
```
✅ lib/subscription/revenue-cat-client.ts が作成されている
✅ SubscriptionScreen.tsx が更新されている
```

### 2. コード構造の確認

#### 2.1 RevenueCatクライアントの使用確認
- [x] `RevenueCatClient.getInstance()` でシングルトンインスタンスを取得
- [x] `revenueCatClient.initialize()` で初期化
- [x] `revenueCatClient.isAvailable()` で利用可能性を確認
- [x] `revenueCatClient.getIsExpoGo()` でExpo Go環境を確認
- [x] `revenueCatClient.getCurrentOffering()` でオファリングを取得
- [x] `revenueCatClient.findPackage()` でパッケージを検索
- [x] `revenueCatClient.purchasePackage()` で購入処理

### 3. 実行時確認（実際のアプリで確認）

#### 3.1 アプリ起動確認
```bash
# Expo Go環境で起動
npx expo start

# または EASビルドで起動
eas build --profile development --platform android
```

#### 3.2 SubscriptionScreen表示確認
1. アプリを起動
2. ChatScreenからユーザープロフィールを開く
3. 「サブスクリプション」をタップ
4. SubscriptionScreenが正常に表示されることを確認

#### 3.3 RevenueCat初期化確認
- [ ] SubscriptionScreenが開かれたときに、RevenueCatクライアントが初期化される
- [ ] Expo Go環境の場合、適切な警告メッセージが表示される
- [ ] EASビルド環境の場合、RevenueCat SDKが正常に初期化される

#### 3.4 ログ確認
以下のログが出力されることを確認：

**Expo Go環境の場合:**
```
[RevenueCatClient] react-native-purchasesが見つかりません。Expo Go環境の可能性があります。
[API] RevenueCatはExpo Go環境では使用できません。バックエンドAPI連携のみ動作します。
```

**EASビルド環境の場合:**
```
[API] RevenueCat初期化成功 { isExpoGo: false }
[API] オファリング取得成功 { ... }
```

### 4. 機能確認

#### 4.1 プラン情報表示
- [ ] 現在のプランが正しく表示される
- [ ] 利用回数情報が正しく表示される
- [ ] プラン選択UIが正常に動作する

#### 4.2 購入処理（EASビルド環境のみ）
- [ ] プランを選択できる
- [ ] 購入ボタンが表示される
- [ ] 購入処理が正常に動作する（実際の購入は行わない）

#### 4.3 モック購入処理（Expo Go環境）
- [ ] Expo Go環境でモック購入処理が動作する
- [ ] バックエンドAPI連携が正常に動作する

### 5. エラーハンドリング確認

#### 5.1 RevenueCat SDK未利用時の動作
- [ ] RevenueCat SDKが利用できない場合、適切なエラーメッセージが表示される
- [ ] モック購入処理にフォールバックされる

#### 5.2 オファリング取得エラー時の動作
- [ ] オファリングが取得できない場合、適切な警告がログに出力される
- [ ] アプリがクラッシュしない

## 確認手順

### 手順1: 静的チェック（✅ 完了）
```bash
# リンターエラーの確認
npm run lint

# TypeScriptコンパイルエラーの確認
npx tsc --noEmit
```

### 手順2: 開発環境での確認
```bash
# Expo Go環境で起動
npx expo start

# アプリを開き、SubscriptionScreenを表示
# ログを確認して、RevenueCatクライアントが正常に初期化されることを確認
```

### 手順3: EASビルドでの確認（✅ 完了 - 2025年12月7日）
```bash
# 開発ビルドを作成
eas build --profile development --platform android

# ビルドをインストールして動作確認
# RevenueCat SDKが正常に動作することを確認
```

## 動作確認結果（2025年12月7日）

### ✅ RevenueCat初期化
```
INFO  2025-12-07T11:35:59.447Z - API   - INFO  - ℹ️ RevenueCat初期化成功 | Data: {"isExpoGo":false}
```
- RevenueCatクライアントが正常に初期化されている
- Expo Go環境ではないことが正しく検出されている

### ✅ オファリング取得
```
INFO  2025-12-07T11:36:00.317Z - API   - INFO  - ℹ️ オファリング取得成功 | Data: {
  "isExpoGo":false,
  "offeringIdentifier":"default",
  "packageCount":2,
  "packages":[
    {"packageId":"ultimate_monthly","productId":"morizo_ultimate_monthly:morizo-ultimate-monthly","productTitle":"Morizo ULTIMATE (Morizo AI)"},
    {"packageId":"pro_monthly","productId":"morizo_pro_monthly:morizo-pro-monthly","productTitle":"Morizo PRO (Morizo AI)"}
  ]
}
```
- オファリングが正常に取得できている
- 2つのパッケージ（ultimate_monthly, pro_monthly）が正しく取得されている

### ✅ パッケージ検索
```
INFO  2025-12-07T11:36:38.406Z - API   - INFO  - ℹ️ パッケージ検索開始 | Data: {
  "searchedProductId":"morizo_pro_monthly",
  "availablePackages":[...],
  "isExpoGo":false
}

INFO  2025-12-07T11:36:38.407Z - API   - INFO  - ℹ️ 商品が見つかりました | Data: {
  "packageId":"pro_monthly",
  "productId":"morizo_pro_monthly:morizo-pro-monthly",
  "productTitle":"Morizo PRO (Morizo AI)",
  "selectedProductId":"morizo_pro_monthly",
  "isExpoGo":false
}
```
- パッケージ検索機能が正常に動作している
- 商品IDから正しくパッケージを見つけられている

### ✅ 購入処理
```
INFO  2025-12-07T11:36:47.688Z - API   - INFO  - ℹ️ RevenueCat購入処理成功 | Data: {"isExpoGo":false}

INFO  2025-12-07T11:36:47.689Z - API   - INFO  - ℹ️ 購入結果の構造確認 | Data: {
  "hasCustomerInfo":true,
  "purchaseResultKeys":["customerInfo","transaction","productIdentifier"],
  "customerInfoKeys":[...]
}
```
- 購入処理が正常に完了している
- CustomerInfoが正しく取得されている

### ✅ バックエンド同期
```
INFO  2025-12-07T11:36:47.693Z - API   - INFO  - ℹ️ Android購入トークン取得 | Data: {
  "purchaseToken":"$RCAnonymousID:9f011...",
  "entitlementId":"pro"
}

INFO  2025-12-07T11:36:47.697Z - API   - INFO  - ℹ️ サブスクリプション更新API呼び出し開始 | Data: {
  "url":"https://morizo.csngrp.co.jp/api/subscription/update",
  "method":"POST",
  "product_id":"morizo_pro_monthly",
  "platform":"android"
}

INFO  2025-12-07T11:36:48.461Z - API   - INFO  - ℹ️ サブスクリプション更新API呼び出し成功 | Data: {
  "url":"https://morizo.csngrp.co.jp/api/subscription/update",
  "method":"POST",
  "status":200
}
```
- 購入トークンが正しく取得されている
- バックエンドAPIへの同期が正常に完了している
- プランがultimateからproに正常に更新されている

### ✅ データ再読み込み
```
INFO  2025-12-07T11:36:49.434Z - API   - INFO  - ℹ️ プラン情報取得API呼び出し成功 | Data: {
  "url":"https://morizo.csngrp.co.jp/api/subscription/plan",
  "method":"GET",
  "status":200,
  "plan":"pro"
}

INFO  2025-12-07T11:36:49.438Z - API   - INFO  - ℹ️ 利用回数取得API呼び出し成功 | Data: {
  "url":"https://morizo.csngrp.co.jp/api/subscription/usage",
  "method":"GET",
  "status":200,
  "usage":{
    "plan_type":"pro",
    "limits":{"menu_bulk":10,"menu_step":30,"ocr":10}
  }
}
```
- 購入後のデータ再読み込みが正常に動作している
- プラン情報と利用回数情報が正しく更新されている

## 確認結果まとめ

### ✅ Phase1リファクタリング成功

すべての機能が正常に動作していることが確認されました：

1. ✅ RevenueCatクライアントの初期化
2. ✅ オファリング取得
3. ✅ パッケージ検索
4. ✅ 購入処理
5. ✅ バックエンド同期
6. ✅ データ再読み込み

**結論**: Phase1のリファクタリングは成功し、RevenueCat SDK管理の分離が正常に機能しています。

## 期待される動作

### Expo Go環境
- RevenueCat SDKは使用できないが、エラーなく動作する
- バックエンドAPI連携（プラン情報・利用回数の表示）は正常に動作する
- モック購入処理でバックエンドAPIをテストできる

### EASビルド環境
- RevenueCat SDKが正常に初期化される
- オファリングが取得できる
- 実際の購入処理が動作する（テスト購入は行わない）

## 問題が発生した場合

### 問題1: インポートエラー
```
Module not found: Can't resolve '../lib/subscription/revenue-cat-client'
```
→ ファイルパスを確認

### 問題2: 型エラー
```
Property 'getInstance' does not exist on type 'RevenueCatClient'
```
→ エクスポートを確認

### 問題3: 初期化エラー
```
RevenueCat初期化エラー
```
→ 環境変数の設定を確認（EXPO_PUBLIC_REVENUECAT_*_API_KEY）

## 次のステップ

Phase1の動作確認が完了したら、Phase2（ユーティリティ関数の分離）に進みます。

---

**作成日**: 2025年1月23日  
**Phase**: Phase1 - RevenueCat SDK管理の分離

