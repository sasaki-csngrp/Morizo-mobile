# Phase3 実装とストア設定の依存関係分析

## 概要

Phase3の実装とストア設定（Google Play Console / App Store Connect）の優先関係・依存関係を明確化します。

**作成日**: 2025年1月29日  
**バージョン**: 1.0

---

## 依存関係の分析

### 1. 並行実装の可能性

#### ✅ **並行して進められる作業**

**実装側（モバイルアプリ）**:
- IAPライブラリの導入（`react-native-purchases`のインストール）
- APIクライアントの実装（`api/subscription-api.ts`）
- UI実装（`screens/SubscriptionScreen.tsx`, `components/PlanCard.tsx`）
- 商品IDの設定ファイル作成（`config/subscription.ts`）

**ストア設定側**:
- Google Play Consoleでの商品登録
- App Store Connectでの商品登録
- テストアカウントの設定
- サンドボックス環境の設定

**理由**: 
- 実装コードは商品IDを設定ファイルに記述できるため、ストア設定の完了を待つ必要がない
- ストア設定は実装コードに依存しない

#### ⚠️ **注意が必要な点**

**商品IDの決定**:
- ストア設定で決定した商品IDを実装コードに反映する必要がある
- 商品IDは変更が困難なため、慎重に決定する必要がある

**推奨アプローチ**:
1. **事前に商品IDを決定**: 実装開始前に商品IDの命名規則を決定
2. **設定ファイルに記述**: 商品IDを`config/subscription.ts`に記述
3. **ストア設定時に反映**: ストア設定で同じ商品IDを使用

---

### 2. テスト時の依存関係

#### ✅ **テストには両方が必要**

**サンドボックス環境でのテスト**:
- ✅ ストア設定（商品登録、テストアカウント設定）が必要
- ✅ 実装（IAPライブラリ、API連携、UI）が必要

**理由**: 
- 実際の購入フローをテストするには、ストア側の設定と実装の両方が必要
- サンドボックス環境では、実際の課金は発生しないが、ストア側の設定が必要

#### 🔄 **部分的なテストは可能**

**実装のみでテスト可能な項目**:
- UIの表示・動作確認
- APIクライアントの実装確認（モックデータを使用）
- エラーハンドリングの確認

**ストア設定のみでテスト可能な項目**:
- 商品登録の確認
- テストアカウントの動作確認

---

### 3. ストア設定の結果が実装に与える影響

#### ✅ **影響がある項目**

**1. 商品IDの設定**

**影響範囲**:
- `config/subscription.ts` - 商品IDの定義
- `api/subscription-api.ts` - 商品IDの使用
- バックエンド - 商品IDからプランタイプへのマッピング

**実装例**:
```typescript
// config/subscription.ts
export const SUBSCRIPTION_PRODUCTS = {
  PRO_MONTHLY: 'morizo_pro_monthly',  // ← ストア設定で決定した商品ID
  PRO_YEARLY: 'morizo_pro_yearly',
  ULTIMATE_MONTHLY: 'morizo_ultimate_monthly',
  ULTIMATE_YEARLY: 'morizo_ultimate_yearly',
} as const;
```

**対応方法**:
- 商品IDを設定ファイルに外部化（推奨）
- ストア設定完了後、設定ファイルを更新

**2. RevenueCat APIキー（RevenueCatを使用する場合）**

**影響範囲**:
- 環境変数（`.env`ファイル）
- RevenueCat SDKの初期化

**実装例**:
```typescript
// RevenueCat SDKの初期化
Purchases.configure({
  apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,  // ← RevenueCatで取得
  appUserID: userId,
});
```

**対応方法**:
- RevenueCatのAPIキーを環境変数に設定
- ストア設定とは別に、RevenueCatの設定が必要

**3. バックエンドの商品IDマッピング**

**影響範囲**:
- `api/utils/subscription_service.py` - 商品IDからプランタイプへのマッピング

**実装例**:
```python
# 商品IDからプランタイプへのマッピング
PRODUCT_ID_TO_PLAN = {
    'morizo_pro_monthly': 'pro',  # ← ストア設定で決定した商品ID
    'morizo_pro_yearly': 'pro',
    'morizo_ultimate_monthly': 'ultimate',
    'morizo_ultimate_yearly': 'ultimate'
}
```

**対応方法**:
- バックエンドの設定ファイルを更新（Phase2で実装済みの可能性）

#### ❌ **影響がない項目**

**環境変数（一般的なAPI URLなど）**:
- `EXPO_PUBLIC_API_URL` - ストア設定とは無関係
- `EXPO_PUBLIC_SUPABASE_URL` - ストア設定とは無関係

**理由**: 
- これらは既存の環境変数で、ストア設定とは独立している

---

## 推奨される実装順序

### オプション1: 並行実装（推奨）

**メリット**:
- 開発時間の短縮
- ストア設定の完了を待たずに実装を進められる

**手順**:
1. **事前準備**: 商品IDの命名規則を決定
2. **実装開始**: 商品IDを設定ファイルに記述して実装を開始
3. **ストア設定**: 並行してストア設定を進める
4. **統合**: ストア設定完了後、商品IDを確認・調整
5. **テスト**: サンドボックス環境でテスト

### オプション2: ストア設定優先

**メリット**:
- 商品IDが確定してから実装を開始できる
- 実装コードの修正が少ない

**デメリット**:
- ストア設定の完了を待つ必要がある
- 開発時間が長くなる可能性

**手順**:
1. **ストア設定**: 商品登録を完了
2. **商品ID確定**: ストア設定で決定した商品IDを確認
3. **実装開始**: 確定した商品IDで実装を開始
4. **テスト**: サンドボックス環境でテスト

---

## 実装時の注意事項

### 1. 商品IDの命名規則

**推奨命名規則**:
- 小文字とアンダースコアのみ使用
- プランタイプ（pro, ultimate）を含める
- 期間（monthly, yearly）を含める
- 例: `morizo_pro_monthly`, `morizo_ultimate_yearly`

**重要**: 
- 商品IDは変更が困難なため、慎重に決定する
- プラットフォーム間（iOS/Android）で同じ商品IDを使用することを推奨

### 2. 設定ファイルの外部化

**推奨アプローチ**:
- 商品IDを`config/subscription.ts`に外部化
- ストア設定完了後、設定ファイルを更新するだけで対応可能

**実装例**:
```typescript
// config/subscription.ts
export const SUBSCRIPTION_PRODUCTS = {
  PRO_MONTHLY: 'morizo_pro_monthly',
  PRO_YEARLY: 'morizo_pro_yearly',
  ULTIMATE_MONTHLY: 'morizo_ultimate_monthly',
  ULTIMATE_YEARLY: 'morizo_ultimate_yearly',
} as const;
```

### 3. 環境変数の管理

**RevenueCatを使用する場合**:
- RevenueCatのAPIキーを環境変数に設定
- `.env`ファイルに追加（`.gitignore`に含まれていることを確認）

**実装例**:
```bash
# .env
EXPO_PUBLIC_REVENUECAT_API_KEY=your-revenuecat-api-key
```

---

## まとめ

### ✅ **並行実装は可能**

- 実装とストア設定は並行して進められる
- 商品IDを設定ファイルに外部化することで、ストア設定の完了を待たずに実装を開始できる

### ✅ **テストには両方が必要**

- サンドボックス環境でのテストには、ストア設定と実装の両方が必要
- ただし、部分的なテスト（UI、APIクライアントなど）は実装のみで可能

### ✅ **ストア設定の結果が実装に影響を与える**

**影響がある項目**:
- 商品IDの設定（`config/subscription.ts`）
- RevenueCat APIキー（RevenueCatを使用する場合）
- バックエンドの商品IDマッピング（Phase2で実装済みの可能性）

**影響がない項目**:
- 一般的な環境変数（`EXPO_PUBLIC_API_URL`など）

### 📋 **推奨アプローチ**

1. **事前準備**: 商品IDの命名規則を決定
2. **並行実装**: 商品IDを設定ファイルに記述して実装を開始、ストア設定も並行して進める
3. **統合**: ストア設定完了後、商品IDを確認・調整
4. **テスト**: サンドボックス環境でテスト

---

**最終更新日**: 2025年1月29日

