# RevenueCat CustomerInfo比較ガイド

## 概要

このドキュメントは、`getCustomerInfo()`が返すデータとRevenueCatダッシュボードのcustomer profileを比較する方法を説明します。

## 比較の目的

1. **エンタイトルメント更新タイミングの確認**
   - SDKが返すデータとダッシュボードの実際の状態の違い
   - 更新の遅延や不整合の有無

2. **データの整合性確認**
   - `activeSubscriptions`の一致
   - `activeEntitlements`の一致
   - 有効期限の一致

3. **問題の原因特定**
   - RevenueCat側の問題か、SDK側の問題か
   - キャッシュの問題か、実際のデータの問題か

## 重要なタイミング

### 確認すべきタイミング

**`PurchaseResult`を受け取った後、`getCustomerInfo()`を呼び出す前**にRevenueCatダッシュボードを確認する必要があります。

#### コードの流れ

```typescript
// 1. 購入処理
const purchaseResult = await revenueCatClient.purchasePackage(packageToPurchase, upgradeInfo);
// ⬇️ この時点でRevenueCatダッシュボードを確認！

// 2. 顧客情報を取得
const customerInfo = await revenueCatClient.getCustomerInfo() || purchaseResult;
```

#### なぜこのタイミングが重要か

1. **`PurchaseResult`を受け取った時点**:
   - RevenueCat側で購入処理が完了している
   - ダッシュボードには最新の状態が反映されている可能性が高い
   - この時点でのダッシュボードの状態が「真実の状態」

2. **`getCustomerInfo()`を呼び出す前**:
   - SDKが返すデータと比較するため
   - SDKのキャッシュが更新されていない可能性がある
   - ダッシュボードとSDKのデータの不整合を確認できる

3. **比較の目的**:
   - ダッシュボードが正しい状態を示しているか確認
   - SDKが古いデータを返しているか確認
   - エンタイトルメント更新のタイミングを確認

### 実際の確認手順

#### 方法1: 開発環境での自動一時停止（推奨）

開発環境（`__DEV__ === true`）では、`PurchaseResult`を受け取った時点で自動的にアラートが表示され、処理が一時停止します。

**動作環境**:
- ✅ 開発ビルド（Development Build）で実機テスト時
- ✅ Expo Go環境
- ✅ ローカル開発環境
- ❌ プロダクションビルド（`__DEV__ === false`）

**無効化する場合**:
環境変数 `EXPO_PUBLIC_ENABLE_DASHBOARD_CHECK=false` を設定すると、アラートを無効化できます。

1. **購入処理を実行**
   - アプリで購入ボタンをクリック
   - 購入処理が完了するまで待つ

2. **アラートが表示される**
   - 「RevenueCatダッシュボード確認」というアラートが表示される
   - Customer ID、Product ID、時刻が表示される
   - **この時点で処理が一時停止している**

3. **RevenueCatダッシュボードを確認**
   - ダッシュボードを開く（事前に開いておくのがベスト）
   - アラートに表示されたCustomer IDで検索
   - Customer Profile（Sandbox Data）を確認
   - **この時点での状態を記録**:
     - Active Subscriptions
     - Active Entitlements
     - Transaction History（最新の購入イベント）

4. **アラートで「続行」を押す**
   - 確認が完了したら、「続行」ボタンを押す
   - 処理が再開され、`getCustomerInfo()`が呼び出される

5. **`getCustomerInfo()`の結果を確認**
   - ログに「購入後の詳細状態（RevenueCat比較用）」が表示される
   - SDKが返すデータを記録

6. **比較**
   - ダッシュボードの状態とSDKのデータを比較
   - 不整合があれば、原因を特定

#### 方法2: 本番環境での確認（ログベース）

本番環境では自動一時停止は行われません。ログのタイムスタンプを基に確認します。

1. **購入処理を実行**
   - アプリで購入ボタンをクリック
   - 購入処理が完了するまで待つ

2. **ログを確認**
   - ログに「購入処理完了（PurchaseResult受け取り）」のメッセージが表示される
   - この時点のタイムスタンプを記録

3. **RevenueCatダッシュボードを確認**
   - ダッシュボードを開く
   - ログに記録されたCustomer IDで検索
   - Customer Profile（Sandbox Data）を確認
   - Transaction Historyで、ログのタイムスタンプ前後の購入イベントを確認
   - **この時点での状態を記録**

4. **`getCustomerInfo()`の結果を確認**
   - ログに「購入後の詳細状態（RevenueCat比較用）」が表示される
   - SDKが返すデータを記録

5. **比較**
   - ダッシュボードの状態とSDKのデータを比較
   - 不整合があれば、原因を特定

## 比較方法

### 1. モバイル側で取得できる情報

#### `getCustomerInfo()`が返すデータ構造

```typescript
interface RevenueCatCustomerInfo {
  originalAppUserId?: string;
  entitlements?: {
    active?: Record<string, {
      identifier: string;
      productIdentifier: string;
      expirationDate: string;
      // ... その他のフィールド
    }>;
  };
  activeSubscriptions?: string[];
}
```

#### 実際のログ出力例

購入後のログから確認できる情報：
```json
{
  "activeSubscriptions": ["morizo_ultimate_monthly"],
  "activeEntitlements": ["morizo_ultimate"],
  "productId": "morizo_pro_yearly",
  "expectedEntitlement": "morizo_pro"
}
```

### 2. RevenueCatダッシュボードで確認できる情報

#### Customer Profile（Sandbox Data）

RevenueCatダッシュボード > Customers > [Customer ID] で確認できる情報：

1. **Active Subscriptions**
   - アクティブなサブスクリプションの一覧
   - Product ID
   - 有効期限（Expires At）
   - 購入日（Purchased At）

2. **Active Entitlements**
   - アクティブなエンタイトルメントの一覧
   - Entitlement ID（`morizo_pro`, `morizo_ultimate`）
   - 有効期限（Expires At）
   - 関連するProduct ID

3. **Transaction History**
   - 購入履歴
   - タイムスタンプ
   - Product ID
   - イベントタイプ（PURCHASE, RENEWAL, PRODUCT_CHANGE等）

4. **Raw Customer Info**
   - JSON形式の生データ
   - SDKが返すデータと同等の情報

### 3. 比較チェックリスト

#### 購入直後（Pro yearly購入時）の比較

| 項目 | SDK (`getCustomerInfo()`) | RevenueCatダッシュボード | 一致？ |
|------|-------------------------|------------------------|--------|
| **Active Subscriptions** | `["morizo_ultimate_monthly"]` | `["morizo_pro_yearly"]` | ❌ 不一致 |
| **Active Entitlements** | `["morizo_ultimate"]` | `["morizo_pro"]` | ❌ 不一致 |
| **Product ID (購入した商品)** | `"morizo_pro_yearly"` | `"morizo_pro_yearly"` | ✅ 一致 |
| **Entitlement ID (期待値)** | `"morizo_pro"` | `"morizo_pro"` | ✅ 一致 |

#### 購入後数秒〜数分後の比較

| 項目 | SDK (`getCustomerInfo()`) | RevenueCatダッシュボード | 一致？ |
|------|-------------------------|------------------------|--------|
| **Active Subscriptions** | `["morizo_pro_yearly"]` | `["morizo_pro_yearly"]` | ✅ 一致 |
| **Active Entitlements** | `["morizo_pro"]` | `["morizo_pro"]` | ✅ 一致 |

## 比較手順

### ステップ1: 購入処理の準備

1. **RevenueCatダッシュボードを事前に開く**
   - ブラウザでRevenueCatダッシュボードを開く
   - Customersページを開いておく
   - Customer IDを確認（`originalAppUserId`から取得可能）

2. **購入処理を実行**
   - アプリで購入ボタンをクリック
   - 購入処理が完了するまで待つ

### ステップ2: PurchaseResult受け取り後の確認（重要！）

**`PurchaseResult`を受け取った直後、`getCustomerInfo()`を呼び出す前にダッシュボードを確認**

1. **ログを確認**
   ```bash
   # 購入処理完了のログを確認
   grep "購入処理完了" zzz.log
   # または
   grep "RevenueCat購入処理成功" zzz.log
   ```

2. **タイムスタンプを記録**
   - ログに表示されるタイムスタンプを記録
   - 例: `2026-01-20T16:49:52.123Z`

3. **すぐにRevenueCatダッシュボードを確認**
   - ダッシュボードをリフレッシュ（F5）
   - Customer IDで検索
   - Customer Profile（Sandbox Data）を開く
   - **この時点での状態を記録**:
     - Active Subscriptions
     - Active Entitlements
     - Transaction History（最新の購入イベント）

### ステップ3: getCustomerInfo()後の確認

1. **モバイル側のログを確認**

   ```bash
   # 購入後の状態ログを抽出
   grep "購入後の状態" zzz.log
   
   # 詳細状態ログを抽出（比較用）
   grep "購入後の詳細状態（RevenueCat比較用）" zzz.log
   
   # 顧客情報取得ログを抽出
   grep "顧客情報取得成功" zzz.log
   ```

2. **SDKが返すデータを記録**
   - ログから以下の情報を抽出:
     - `activeSubscriptions`
     - `activeEntitlements`
     - `rawCustomerInfo`

### ステップ4: RevenueCatダッシュボードで再確認（オプション）

`getCustomerInfo()`を呼び出した後、再度ダッシュボードを確認：

1. ダッシュボードをリフレッシュ（F5）
2. Customer Profile（Sandbox Data）を確認
3. 状態が変化しているか確認
   - ステップ2で確認した時点と比較
   - エンタイトルメントが更新されているか確認

### ステップ5: 比較と分析

**ステップ2（PurchaseResult後）とステップ3（getCustomerInfo()後）のデータを比較**

#### ケース1: SDKとダッシュボードが一致しない（購入直後）

**意味**: RevenueCat SDKのキャッシュが更新されていない、または更新に遅延がある

**確認事項**:
- ダッシュボードでは正しいエンタイトルメントが表示されているか？
- ダッシュボードのTransaction Historyに購入イベントが記録されているか？

**対処法**:
- SDKのキャッシュをクリアして再取得
- 購入後に数秒待ってから`getCustomerInfo()`を再呼び出し

#### ケース2: SDKとダッシュボードが一致しているが、期待値と異なる

**意味**: RevenueCat側の設定に問題がある可能性

**確認事項**:
- ダッシュボードのProduct設定で、`morizo_pro_yearly`が`morizo_pro`エンタイトルメントに紐付いているか？
- ダッシュボードのOffering設定で、パッケージが正しく設定されているか？

**対処法**:
- RevenueCatダッシュボードの設定を確認
- 必要に応じてRevenueCatサポートに問い合わせ

#### ケース3: SDKとダッシュボードが一致し、期待値とも一致

**意味**: 正常な動作

**確認事項**:
- バックエンド側の処理を確認
- Webhookの処理を確認

## 詳細な比較項目

### 1. Active Subscriptions

#### SDK側
```typescript
customerInfo.activeSubscriptions
// 例: ["morizo_pro_yearly"]
```

#### ダッシュボード側
- **Customers** > **Customer Profile** > **Active Subscriptions**
- Product IDの一覧が表示される

#### 比較ポイント
- Product IDの一致
- 配列の順序（通常は問題ないが、念のため）
- タイムスタンプ（購入時刻）

### 2. Active Entitlements

#### SDK側
```typescript
Object.keys(customerInfo.entitlements?.active || {})
// 例: ["morizo_ultimate"]
```

#### ダッシュボード側
- **Customers** > **Customer Profile** > **Active Entitlements**
- Entitlement IDの一覧が表示される

#### 比較ポイント
- Entitlement IDの一致
- 有効期限（Expires At）の一致
- 関連するProduct IDの一致

### 3. Transaction History

#### SDK側
```typescript
// SDKでは直接取得できないが、購入処理のログから確認可能
// purchaseResult.transaction など
```

#### ダッシュボード側
- **Customers** > **Customer Profile** > **Transaction History**
- 購入イベントの一覧が表示される

#### 比較ポイント
- 最新の購入イベントのProduct ID
- イベントタイプ（PURCHASE, PRODUCT_CHANGE等）
- タイムスタンプ

### 4. Raw Customer Info

#### SDK側
```typescript
// getCustomerInfoDiagnostics()で取得可能
const diagnostics = await revenueCatClient.getCustomerInfoDiagnostics();
console.log(diagnostics.rawCustomerInfo);
```

#### ダッシュボード側
- **Customers** > **Customer Profile** > **Raw Customer Info**
- JSON形式の生データが表示される

#### 比較ポイント
- データ構造の一致
- フィールドの値の一致
- タイムスタンプの一致

## トラブルシューティング

### 問題: SDKが古いデータを返す

**症状**: 購入後、SDKの`getCustomerInfo()`が古いエンタイトルメントを返す

**確認**:
1. ダッシュボードで最新の状態を確認
2. SDKのキャッシュをクリア
3. 数秒待ってから再取得

**対処**:
```typescript
// キャッシュをクリアして再取得
await Purchases.syncPurchases();
const customerInfo = await revenueCatClient.getCustomerInfo();
```

### 問題: ダッシュボードとSDKが一致しない

**症状**: ダッシュボードでは正しいエンタイトルメントが表示されているが、SDKが古いデータを返す

**確認**:
1. ダッシュボードのTransaction Historyを確認
2. 購入イベントが正しく記録されているか確認
3. SDKのバージョンを確認

**対処**:
- RevenueCat SDKのバージョンを更新
- 購入後に`syncPurchases()`を呼び出す

### 問題: エンタイトルメントが更新されない

**症状**: 購入後、エンタイトルメントが更新されない（SDKとダッシュボードの両方）

**確認**:
1. RevenueCatダッシュボードのProduct設定を確認
2. Offering設定を確認
3. Entitlement設定を確認

**対処**:
- RevenueCatダッシュボードで設定を確認・修正
- RevenueCatサポートに問い合わせ

## ログ出力の改善

### 詳細なCustomerInfoをログ出力

購入処理時に、より詳細な情報をログ出力する：

```typescript
// usePurchase.ts の購入処理後
const customerInfo = await revenueCatClient.getCustomerInfo();
const diagnostics = await revenueCatClient.getCustomerInfoDiagnostics();

safeLog.info(LogCategory.API, '購入後の詳細状態（RevenueCat比較用）', {
  // SDK側の情報
  sdk: {
    activeSubscriptions: customerInfo.activeSubscriptions,
    activeEntitlements: Object.keys(customerInfo.entitlements?.active || {}),
    rawCustomerInfo: diagnostics.rawCustomerInfo,
  },
  // 期待値
  expected: {
    productId,
    entitlementId: ENTITLEMENT_ID_MAP[selectedPlan],
    planType: selectedPlan,
  },
  // 比較用のタイムスタンプ
  timestamp: new Date().toISOString(),
  note: 'RevenueCatダッシュボードと比較してください'
});
```

## 比較結果の記録

比較結果を記録するテンプレート：

```markdown
## 比較結果（YYYY-MM-DD HH:MM:SS）

### 購入情報
- Product ID: `morizo_pro_yearly`
- 購入時刻: 2026-01-20 16:49:52.123Z
- Customer ID: `318de393-1d53-402e-8038-641617ac0d38`

### タイミング1: PurchaseResult受け取り後（ダッシュボード確認）

**確認時刻**: 2026-01-20 16:49:52.500Z（PurchaseResult後、getCustomerInfo()前）

#### RevenueCatダッシュボード側の情報
- Active Subscriptions: `["morizo_pro_yearly"]` ✅
- Active Entitlements: `["morizo_pro"]` ✅
- Transaction History: 最新の購入イベントが記録されている ✅

### タイミング2: getCustomerInfo()呼び出し後（SDK確認）

**取得時刻**: 2026-01-20 16:49:53.000Z

#### SDK側の情報
- Active Subscriptions: `["morizo_ultimate_monthly"]` ❌
- Active Entitlements: `["morizo_ultimate"]` ❌
- 取得時刻: 2026-01-20 16:49:53

### 比較結果

| 項目 | ダッシュボード（PurchaseResult後） | SDK（getCustomerInfo()後） | 一致？ |
|------|--------------------------------|---------------------------|--------|
| Active Subscriptions | `["morizo_pro_yearly"]` | `["morizo_ultimate_monthly"]` | ❌ 不一致 |
| Active Entitlements | `["morizo_pro"]` | `["morizo_ultimate"]` | ❌ 不一致 |

### 分析

1. **ダッシュボード側**: PurchaseResult受け取り時点で既に正しいエンタイトルメントが表示されている
   - RevenueCat側の設定は正しい
   - 購入処理は正常に完了している

2. **SDK側**: `getCustomerInfo()`が古いデータを返している
   - SDKのキャッシュが更新されていない可能性が高い
   - タイミングの問題（更新が完了する前に取得している）

3. **結論**: 
   - RevenueCat側の設定や処理は正常
   - SDKのキャッシュ更新に遅延がある
   - `product_id`から正しく`plan_type`を導出できるため、機能的には問題ない

### 対処

- 購入後に数秒待ってから`getCustomerInfo()`を再取得
- `syncPurchases()`を呼び出してキャッシュを更新
- または、`product_id`から直接`plan_type`を導出する（現在の実装）
```

---

**作成日**: 2026年1月20日  
**目的**: RevenueCat CustomerInfoとダッシュボードの比較による問題特定
