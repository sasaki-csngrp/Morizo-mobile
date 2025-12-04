# RevenueCat初期テスト実施プラン

## 概要

RevenueCatを利用した初期テストの実施プランです。特に、RevenueCatダッシュボードでの商品設定に焦点を当てています。

**作成日**: 2025年1月29日  
**バージョン**: 1.0  
**対象**: Morizo-mobile（モバイルアプリ）

---

## 前提条件

✅ **完了済み**:
- RevenueCatテスト環境のAPIキーが環境変数に登録済み
- Phase3の実装が完了（IAPライブラリ、UIコンポーネント、API連携）
- 商品IDの定義が完了（`config/subscription.ts`）

---

## RevenueCatダッシュボードでの商品設定 - クイックリファレンス

### 設定の流れ

1. **Product Catalog** → 商品を作成（Product ID: `morizo_pro_monthly`, `morizo_ultimate_monthly`）
2. **Entitlements** → エンタイトルメントを作成（Entitlement ID: `pro`, `ultimate`）
3. **Offerings** → オファリングを作成（Offering ID: `default`）
4. **Offerings** → パッケージを追加（Package ID: `pro_monthly`, `ultimate_monthly`）
5. **Offerings** → オファリングを「Current」に設定

### 重要なポイント

- **Product ID**: `config/subscription.ts`で定義した商品IDと**完全に一致**させる
- **Package ID**: RevenueCatダッシュボード内でのみ使用（任意の値でOK）
- **Entitlement ID**: プランタイプ（`pro`, `ultimate`）と一致させる
- **Offering ID**: `default`を使用（アプリ側で`Purchases.getOfferings()`を呼び出すと、`current`オファリングが返される）

---

## ステップ1: RevenueCatダッシュボードでの基本設定

### 1.1 プロジェクトの確認

1. [RevenueCatダッシュボード](https://app.revenuecat.com/)にログイン
2. 既存のプロジェクトを選択、または新規プロジェクトを作成
3. プロジェクト名: **Morizo Mobile**（推奨）

### 1.2 テストストアの確認

RevenueCatには**テストストア（Test Store）**機能があり、ストア側での商品登録なしでテスト可能です。

**確認事項**:
- 左メニューの「**Apps & providers**」を確認
- 「**Test Store**」が自動的にプロビジョニングされていることを確認
- テストストア用のAPIキーが「**API keys**」セクションに表示されていることを確認

---

## ステップ2: RevenueCatダッシュボードでの商品設定

### 2.1 Product Catalog（商品カタログ）の設定

RevenueCatダッシュボードで商品を設定します。**ストア側での商品登録は不要**です（テストストアを使用する場合）。

#### 手順

1. **左メニューから「Product catalog」を選択**
   - メニューの上部（「Overview」の下）にあります

2. **「Create product」をクリック**

3. **商品情報を入力**

   **商品1: Morizo PRO（月額）**
   
   | 項目 | 値 | 説明 |
   |------|-----|------|
   | **Product ID** | `morizo_pro_monthly` | 商品の識別子（必須、`config/subscription.ts`と一致させる） |
   | **Name** | Morizo PRO | **必須**。ユーザーに表示される商品名（例: "Premium"） |
   | **Description** | 月額サブスクリプション。献立一括提案10回/日、段階的提案30回/日、OCR読み取り10回/日まで利用可能。 | 商品の詳細説明（オプション） |
   | **Type** | Subscription | 商品タイプ（必須） |
   | **Duration** | 1 month | サブスクリプション期間（必須） |
   | **Price** | テスト用の価格（例: $9.99） | テストストアでは任意の価格で設定可能 |
   
   **商品2: Morizo ULTIMATE（月額）**
   
   | 項目 | 値 | 説明 |
   |------|-----|------|
   | **Product ID** | `morizo_ultimate_monthly` | 商品の識別子（必須、`config/subscription.ts`と一致させる） |
   | **Name** | Morizo ULTIMATE | **必須**。ユーザーに表示される商品名 |
   | **Description** | 月額サブスクリプション。献立一括提案100回/日、段階的提案300回/日、OCR読み取り100回/日まで利用可能。 | 商品の詳細説明（オプション） |
   | **Type** | Subscription | 商品タイプ（必須） |
   | **Duration** | 1 month | サブスクリプション期間（必須） |
   | **Price** | テスト用の価格（例: $19.99） | テストストアでは任意の価格で設定可能 |

**重要**: 
- **Name**（必須）: 「Customer-facing product details」セクションの「Name」フィールドです。これは**Descriptionとは別物**で、アプリ内でユーザーに表示される商品名を入力します（例: "Premium", "Morizo PRO"）
- **Description**（オプション）: 商品の詳細説明を入力します。Nameよりも詳しい情報を記載します
- Product IDは、`config/subscription.ts`で定義した商品IDと**完全に一致**させる必要があります
- テストストアでは、価格は任意の値で設定できます（実際の課金は発生しません）

4. **「Save」をクリック**

**重要**: 
- Product IDは、`config/subscription.ts`で定義した商品IDと**完全に一致**させる必要があります
- テストストアでは、価格は任意の値で設定できます（実際の課金は発生しません）

### 2.2 Entitlements（エンタイトルメント）の設定

エンタイトルメントは、ユーザーがアクセスできる機能やコンテンツを定義します。

#### 手順

1. **左メニューから「Entitlements」を選択**

2. **「Create entitlement」をクリック**

3. **エンタイトルメント情報を入力**

   **エンタイトルメント1: PRO**
   
   | 項目 | 値 |
   |------|-----|
   | **Entitlement ID** | `pro` |
   | **Display Name** | PRO Plan |
   | **Description** | PROプランのエンタイトルメント |
   
   **エンタイトルメント2: ULTIMATE**
   
   | 項目 | 値 |
   |------|-----|
   | **Entitlement ID** | `ultimate` |
   | **Display Name** | ULTIMATE Plan |
   | **Description** | ULTIMATEプランのエンタイトルメント |

4. **「Save」をクリック**

### 2.3 Offerings（オファリング）の設定

オファリングは、ユーザーに提示する商品パッケージのセットです。通常、1つのオファリングに複数の商品（パッケージ）を含めます。

#### 手順

1. **左メニューから「Offerings」を選択**

2. **「Create offering」をクリック**

3. **オファリング情報を入力**

   | 項目 | 値 |
   |------|-----|
   | **Offering ID** | `default` |
   | **Display Name** | Default Offering |
   | **Description** | デフォルトのオファリング |

4. **「Save」をクリック**

5. **パッケージの追加**

   オファリングの詳細ページで、「**Add package**」をクリックしてパッケージを追加します。

   **パッケージ1: PRO Monthly**
   
   | 項目 | 値 |
   |------|-----|
   | **Package ID** | `pro_monthly` |
   | **Display Name** | PRO Monthly |
   | **Product** | `morizo_pro_monthly`（Product Catalogで作成した商品） |
   | **Entitlement** | `pro`（Entitlementsで作成したエンタイトルメント） |
   
   **パッケージ2: ULTIMATE Monthly**
   
   | 項目 | 値 |
   |------|-----|
   | **Package ID** | `ultimate_monthly` |
   | **Display Name** | ULTIMATE Monthly |
   | **Product** | `morizo_ultimate_monthly`（Product Catalogで作成した商品） |
   | **Entitlement** | `ultimate`（Entitlementsで作成したエンタイトルメント） |

6. **各パッケージを「Save」で保存**

7. **オファリングを「Current」に設定**

   - オファリング一覧で、作成したオファリングの「**Set as current**」をクリック
   - これにより、アプリから`Purchases.getOfferings()`を呼び出すと、このオファリングが返されます

**重要**: Package IDとProduct IDの違い

- **Product ID**: Product Catalogで作成した商品の識別子（例: `morizo_pro_monthly`）
  - ストア側（Google Play / App Store）で登録する商品IDと一致させる必要があります
  - `config/subscription.ts`で定義した商品IDと一致させる必要があります
  
- **Package ID**: オファリング内で使用するパッケージの識別子（例: `pro_monthly`）
  - RevenueCatダッシュボード内でのみ使用されます
  - アプリ側では、Package IDまたはProduct IDのどちらでも検索可能です
  - 同じProduct IDを複数のPackage IDでラップすることができます（例: 月額/年額のパッケージ）

**アプリ側での検索方法**:
- 現在のコード（`SubscriptionScreen.tsx`）は、Package IDとProduct IDの両方で検索するように実装されています
- そのため、RevenueCatダッシュボードで設定したPackage IDまたはProduct IDのどちらでも検索可能です

---

## ステップ3: アプリ側の設定確認

### 3.1 環境変数の確認

`.env`ファイルに以下が設定されていることを確認：

```bash
# テストストア用APIキー（優先）
EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=test_xxxxxxxxxxxxxxxxxxxxx

# または、プラットフォーム固有のAPIキー（本番環境用）
# EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxxxxxxxxxxxxxxxxxx
# EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxxxxxxxxxxxxxxxxxxx
```

### 3.2 商品IDの確認

`config/subscription.ts`で定義されている商品IDが、RevenueCatダッシュボードで設定したProduct IDと一致していることを確認：

```typescript
export const SUBSCRIPTION_PRODUCTS = {
  PRO_MONTHLY: 'morizo_pro_monthly',        // RevenueCatのProduct IDと一致
  PRO_YEARLY: 'morizo_pro_yearly',
  ULTIMATE_MONTHLY: 'morizo_ultimate_monthly', // RevenueCatのProduct IDと一致
  ULTIMATE_YEARLY: 'morizo_ultimate_yearly',
} as const;
```

### 3.3 コードの確認

`SubscriptionScreen.tsx`で、オファリングから商品を取得する処理を確認：

```typescript
// オファリングを取得
const offeringsData = await Purchases.getOfferings();
if (offeringsData.current) {
  setOfferings(offeringsData.current);
}

// 購入時に商品を検索（Package IDまたはProduct IDで検索）
const packageToPurchase = offerings.availablePackages.find(
  (pkg: any) => 
    pkg.identifier === productId || // Package IDで検索
    pkg.product?.identifier === productId // Product IDで検索
);
```

**注意**: 
- `pkg.identifier`はPackage IDを返します
- `pkg.product.identifier`でProduct IDを取得できます
- 現在のコードは、Package IDとProduct IDの両方で検索するように実装されています
- RevenueCatダッシュボードで設定したPackage IDまたはProduct IDのどちらでも検索可能です

---

## ステップ4: 初期テストの実施

### 4.1 開発環境の選択

RevenueCatのテストストア機能を使用する場合、**Expo Go環境でも一部の動作が可能**です。

#### Expo Go環境での動作（制限あり）

`react-native-purchases`には「**Preview API Mode**」という機能があり、Expo Go内でも動作する可能性があります。

**可能なこと**:
- ✅ UIのプレビュー
- ✅ 統合フローのテスト（エラーハンドリングなど）
- ✅ オファリング取得のモック動作（実際の購入処理は行われない）

**制限事項**:
- ❌ 実際の購入処理は行われない
- ❌ RevenueCatの完全な機能をテストできない
- ❌ バックエンドとの同期テストができない

**注意**: Expo Go環境では、`react-native-purchases`が正しくインポートできない場合があります。その場合は、開発ビルドが必要です。

#### 開発ビルドの作成（推奨）

実際の購入フローやRevenueCatの完全な機能をテストするには、Expo Development Buildを作成する必要があります。

```bash
# 開発ビルドの作成
eas build --profile development --platform ios
# または
eas build --profile development --platform android
```

**推奨**: 初期のUIテストはExpo Goで行い、実際の購入フローのテストは開発ビルドで行うことを推奨します。

### 4.2 アプリの起動と初期化確認

#### Expo Go環境でのテスト

1. Expo Goアプリでアプリを起動
2. `SubscriptionScreen`を開く
3. ログを確認して、RevenueCatの初期化を試みる

**確認ポイント**:
- Expo Go環境では、`react-native-purchases`がインポートできない場合があります
- その場合、`isRevenueCatAvailable`が`false`になり、バックエンドAPI連携のみ動作します
- UIの表示やエラーハンドリングのテストは可能です

#### 開発ビルド環境でのテスト（推奨）

1. 開発ビルドをインストールしてアプリを起動
2. `SubscriptionScreen`を開く
3. ログを確認して、RevenueCatの初期化が成功していることを確認

**確認ポイント**:
- `RevenueCat初期化成功`のログが出力されているか
- `isRevenueCatAvailable`が`true`になっているか
- オファリングが正常に取得できているか

### 4.3 オファリング取得のテスト

1. `SubscriptionScreen`で「プランを選択」セクションを確認
2. PROとULTIMATEのプランカードが表示されていることを確認
3. ログで、オファリングデータが正常に取得できていることを確認

**確認ポイント**:
- `offerings.current`が存在するか
- `offerings.availablePackages`に商品が含まれているか
- 商品IDが正しく設定されているか

### 4.4 購入フローのテスト

1. PROまたはULTIMATEプランを選択
2. 「購入」ボタンをクリック
3. RevenueCatの購入ダイアログが表示されることを確認
4. テストストアでは、実際の課金は発生しません

**確認ポイント**:
- 購入ダイアログが表示されるか
- 商品情報（価格、説明など）が正しく表示されるか
- 購入処理が正常に完了するか
- バックエンドへの同期が正常に動作するか

### 4.5 エラーハンドリングのテスト

1. オフライン環境での動作確認
2. 無効な商品IDでの購入試行
3. 購入キャンセル時の動作確認

---

## ステップ5: RevenueCatダッシュボードでの確認

### 5.1 購入データの確認

1. **左メニューから「Customers」を選択**
2. テスト購入を行ったユーザーを検索
3. 購入履歴、エンタイトルメント、サブスクリプションステータスを確認

### 5.2 イベントログの確認

1. **左メニューから「Events」を選択**
2. 購入イベント、エンタイトルメント付与イベントなどを確認
3. エラーイベントがないか確認

### 5.3 オファリングの確認

1. **左メニューから「Offerings」を選択**
2. 作成したオファリングが「Current」になっていることを確認
3. パッケージが正しく設定されていることを確認

---

## トラブルシューティング

### 問題1: オファリングが取得できない

**原因**:
- オファリングが「Current」に設定されていない
- APIキーが正しく設定されていない
- ネットワークエラー

**対処法**:
1. RevenueCatダッシュボードでオファリングが「Current」になっているか確認
2. 環境変数のAPIキーが正しいか確認
3. ネットワーク接続を確認
4. ログでエラーメッセージを確認

### 問題2: 商品が見つからない

**原因**:
- Product IDが一致していない
- パッケージがオファリングに追加されていない
- 商品がProduct Catalogに登録されていない

**対処法**:
1. `config/subscription.ts`の商品IDとRevenueCatのProduct IDが一致しているか確認
2. オファリングにパッケージが追加されているか確認
3. Product Catalogに商品が登録されているか確認

### 問題3: 購入処理が失敗する

**原因**:
- テストストアの設定が正しくない
- エンタイトルメントが設定されていない
- バックエンドAPIのエラー
- Expo Go環境で実際の購入処理を試みている

**対処法**:
1. テストストア用のAPIキーを使用しているか確認
2. エンタイトルメントが正しく設定されているか確認
3. バックエンドAPIのログを確認
4. RevenueCatダッシュボードのイベントログを確認
5. Expo Go環境の場合は、開発ビルドでテストする

### 問題4: Expo Go環境でRevenueCatが動作しない

**原因**:
- `react-native-purchases`がネイティブモジュールのため、Expo Goでは通常動作しない
- Preview API Modeが有効になっていない

**対処法**:
1. Expo Go環境では、UIのプレビューやエラーハンドリングのテストのみ可能
2. 実際の購入フローのテストには、開発ビルドを作成する
3. `isRevenueCatAvailable`が`false`の場合は、バックエンドAPI連携のみ動作することを理解する

---

## 次のステップ

初期テストが完了したら、以下のステップに進みます：

1. **ストア側での商品登録**
   - Google Play Console / App Store Connectで商品を登録
   - RevenueCatでプラットフォーム（iOS/Android）を追加
   - プラットフォーム固有のAPIキーに切り替え

2. **サンドボックステスト**
   - ストアのサンドボックス環境でテスト
   - 実際のストアAPIとの統合を確認

3. **本番環境への移行**
   - プラットフォーム固有のAPIキーを使用
   - ストアで設定した実際の製品をオファリングに追加
   - 本番環境にデプロイ

---

## 参考資料

- [RevenueCat Dashboard](https://app.revenuecat.com/)
- [RevenueCat Documentation - Product Catalog](https://www.revenuecat.com/docs/entitlements)
- [RevenueCat Documentation - Offerings](https://www.revenuecat.com/docs/offerings)
- [RevenueCat Documentation - Test Store](https://www.revenuecat.com/docs/test-store)
- [RevenueCat Documentation - React Native Setup](https://www.revenuecat.com/docs/react-native)

---

## チェックリスト

### RevenueCatダッシュボード設定
- [ ] プロジェクトの作成・確認
- [ ] テストストアの確認
- [ ] Product Catalogで商品を作成（`morizo_pro_monthly`, `morizo_ultimate_monthly`）
- [ ] Entitlementsでエンタイトルメントを作成（`pro`, `ultimate`）
- [ ] Offeringsでオファリングを作成（`default`）
- [ ] オファリングにパッケージを追加
- [ ] オファリングを「Current」に設定

### アプリ側設定
- [ ] 環境変数にAPIキーを設定
- [ ] `config/subscription.ts`の商品IDを確認
- [ ] `SubscriptionScreen.tsx`のコードを確認

### テスト実施
- [ ] 開発ビルドの作成
- [ ] RevenueCatの初期化確認
- [ ] オファリング取得のテスト
- [ ] 購入フローのテスト
- [ ] エラーハンドリングのテスト
- [ ] RevenueCatダッシュボードでの確認

---

**最終更新**: 2025年1月29日  
**作成者**: AIエージェント協働チーム

