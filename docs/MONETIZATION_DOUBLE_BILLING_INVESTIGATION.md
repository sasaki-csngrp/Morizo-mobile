# 二重課金問題の調査タスク

**作成日**: 2025年12月7日  
**最終更新**: 2025年12月7日  
**状況**: ✅ **解決済み** - 実装完了

---

## 問題の概要

**確認済みの問題**: 
- Google Playストアの「定期購入」画面で、PROとULTIMATEの両方が表示されている
- proプランを購入した後、ultimateプランにアップグレードした場合、両方のサブスクリプションが有効なままになっている
- これは二重課金の問題が実際に発生していることを示している

**問題の根本原因**:
- `pro`と`ultimate`は**別々のエンタイトルメント**として設定されている
- RevenueCatでは、**異なるエンタイトルメント間のアップグレード**では、既存のサブスクリプションが自動的にキャンセルされない
- そのため、PROとULTIMATEの両方が有効なままになっている

**スクリーンショットで確認済み**:
- テスト: Morizo AI (PRO Plan) - ¥100 (次回のお支払い: 2025年12月7日 午後3:15 JST)
- テスト: Morizo AI (ULTIMATE Plan) - ¥500 (次回のお支払い: 2025年12月7日 午後3:17 JST)

---

## 調査タスク一覧

### タスク1: RevenueCat側での対応方法の調査

**調査項目**:
- [x] RevenueCatで、異なるエンタイトルメント間のアップグレード時の動作を確認
  - **確認済み**: `pro`と`ultimate`は別々のエンタイトルメントとして設定されている
  - **発見**: 異なるエンタイトルメント間のアップグレードでは、既存のサブスクリプションが自動的にキャンセルされない
- [ ] RevenueCatで、アップグレード時に既存のサブスクリプションを自動的にキャンセルする設定があるか
- [ ] RevenueCatの公式ドキュメントで、サブスクリプションのアップグレード/ダウングレード時の動作を確認
- [ ] RevenueCatのAPIで、既存のサブスクリプションをキャンセルする方法
- [ ] RevenueCatのダッシュボードで、サブスクリプションの管理設定を確認

**調査先**:
- RevenueCat公式ドキュメント
- RevenueCatのGitHubリポジトリ
- RevenueCatのコミュニティフォーラム

**調査結果**: 
- 調査中（2025年12月7日）

**調査日**: 2025年12月7日  
**調査者**: AIエージェント

**調査結果**:
- [x] RevenueCatで、同じエンタイトルメントに紐づく複数のサブスクリプションを管理する方法
  - **確認済み**: 既存のコード（`screens/SubscriptionScreen.tsx`）を確認した結果、`purchasePackage`を呼び出すだけで、既存のサブスクリプションをキャンセルする処理は実装されていない
  - **発見**: `purchasePackage`を呼び出すと、新しいサブスクリプションが購入されるが、既存のサブスクリプションが自動的にキャンセルされるかどうかは不明
  - **要確認**: RevenueCat公式ドキュメントで、`purchasePackage`の動作を確認する必要がある
- [x] RevenueCatで、アップグレード時に既存のサブスクリプションを自動的にキャンセルする設定があるか
  - **確認済み**: 既存のコードでは、アップグレード時に確認ダイアログを表示する処理は実装されているが、既存のサブスクリプションをキャンセルする処理は実装されていない
  - **発見**: `proceedWithPurchase`関数内で、`purchasePackage`を呼び出すだけで、既存のサブスクリプションをキャンセルする処理は実装されていない
  - **要確認**: RevenueCat公式ドキュメントで、アップグレード時の動作を確認する必要がある
- [ ] RevenueCatの公式ドキュメントで、サブスクリプションのアップグレード/ダウングレード時の動作を確認
  - **未確認**: RevenueCat公式ドキュメント（https://docs.revenuecat.com/）の直接確認が必要
  - **注意**: Web検索では適切な結果が得られなかったため、公式ドキュメントを直接確認する必要がある
- [ ] RevenueCatのAPIで、既存のサブスクリプションをキャンセルする方法
  - **未確認**: react-native-purchasesのAPIリファレンス（https://github.com/RevenueCat/react-native-purchases）の直接確認が必要
  - **注意**: 既存のコードでは、`cancelSubscription`や`unsubscribe`などのメソッドは使用されていない
- [ ] RevenueCatのダッシュボードで、サブスクリプションの管理設定を確認
  - **未確認**: RevenueCatダッシュボードの実際の確認が必要
  - **要確認**: エンタイトルメントの設定や、サブスクリプションのアップグレード/ダウングレード時の動作設定があるか

**参考資料**:
- RevenueCat公式ドキュメント: https://docs.revenuecat.com/
- react-native-purchases GitHub: https://github.com/RevenueCat/react-native-purchases

**結論**:
- **重要な発見**: 既存のコードでは、`purchasePackage`を呼び出すだけで、既存のサブスクリプションをキャンセルする処理は実装されていない
- **問題の原因**: アップグレード時に、既存のサブスクリプションをキャンセルせずに新しいサブスクリプションを購入しているため、二重課金が発生している可能性が高い
- **対応方針**: 
  1. RevenueCat公式ドキュメントで、`purchasePackage`の動作を確認する（既存のサブスクリプションが自動的にキャンセルされるかどうか）
  2. 自動的にキャンセルされない場合は、アプリ側で既存のサブスクリプションをキャンセルする処理を実装する必要がある
  3. react-native-purchasesのAPIリファレンスで、既存のサブスクリプションをキャンセルする方法を確認する

**次のアクション**:
- RevenueCat公式ドキュメント（https://docs.revenuecat.com/）で、サブスクリプションのアップグレード時の動作を確認
- react-native-purchasesのGitHubリポジトリ（https://github.com/RevenueCat/react-native-purchases）で、APIリファレンスを確認
- RevenueCatダッシュボードで、エンタイトルメントの設定や、サブスクリプションのアップグレード/ダウングレード時の動作設定を確認
- 既存のサブスクリプションをキャンセルする処理の実装方法を調査

---

### タスク2: アプリ側での対応方法の調査

**調査項目**:
- [ ] Google Play Billing APIで、既存のサブスクリプションをキャンセルする方法
- [ ] RevenueCat SDKで、既存のサブスクリプションをキャンセルする方法
- [ ] アップグレード時に、既存のサブスクリプションを手動でキャンセルする処理の実装方法
- [ ] react-native-purchases（RevenueCat SDK）のAPIリファレンスを確認
- [ ] 既存のコードで、サブスクリプションのキャンセル処理が実装されているか確認

**調査先**:
- Google Play Billing API公式ドキュメント
- RevenueCat SDK（react-native-purchases）の公式ドキュメント
- 既存のコードベース

**調査結果**: 
- 調査中（2025年12月7日）

**調査日**: 2025年12月7日  
**調査者**: AIエージェント

**調査結果**:
- [x] Google Play Billing APIで、既存のサブスクリプションをキャンセルする方法
  - **確認済み**: 既存のコードでは、Google Play Billing APIを直接使用していない（RevenueCat SDK経由で使用）
  - **発見**: RevenueCat SDK（react-native-purchases）を使用しているため、Google Play Billing APIを直接呼び出す必要はない可能性がある
  - **要確認**: Google Play Billing Library公式ドキュメント（https://developer.android.com/google/play/billing）で、サブスクリプションのアップグレード/置換方法を確認する必要がある
- [x] RevenueCat SDKで、既存のサブスクリプションをキャンセルする方法
  - **確認済み**: 既存のコード（`screens/SubscriptionScreen.tsx`）を確認した結果、`cancelSubscription`や`unsubscribe`などのメソッドは使用されていない
  - **発見**: `purchasePackage`を呼び出すだけで、既存のサブスクリプションをキャンセルする処理は実装されていない
  - **要確認**: react-native-purchasesのAPIリファレンスで、既存のサブスクリプションをキャンセルする方法を確認する必要がある
- [x] アップグレード時に、既存のサブスクリプションを手動でキャンセルする処理の実装方法
  - **確認済み**: 既存のコードでは、アップグレード時に確認ダイアログを表示する処理は実装されているが、既存のサブスクリプションをキャンセルする処理は実装されていない
  - **発見**: `proceedWithPurchase`関数内で、`purchasePackage`を呼び出す前に、既存のサブスクリプションをキャンセルする処理を追加する必要がある可能性がある
  - **要確認**: react-native-purchasesのAPIリファレンスで、既存のサブスクリプションをキャンセルする方法を確認する必要がある
- [ ] react-native-purchases（RevenueCat SDK）のAPIリファレンスを確認
  - **未確認**: APIリファレンス（https://github.com/RevenueCat/react-native-purchases）の直接確認が必要
  - **注意**: Web検索では適切な結果が得られなかったため、GitHubリポジトリを直接確認する必要がある
- [x] 既存のコードで、サブスクリプションのキャンセル処理が実装されているか確認
  - **確認済み**: 既存のコード（`screens/SubscriptionScreen.tsx`）を確認した結果、サブスクリプションをキャンセルする処理は実装されていない
  - **詳細**: 
    - アップグレード時に確認ダイアログを表示する処理は実装されている（`handlePurchase`関数内、469-487行目）
    - しかし、既存のサブスクリプションをキャンセルする処理は実装されていない
    - `proceedWithPurchase`関数内で、`purchasePackage`を呼び出すだけで、既存のサブスクリプションをキャンセルする処理は実装されていない

**参考資料**:
- Google Play Billing Library公式ドキュメント: https://developer.android.com/google/play/billing
- react-native-purchases APIリファレンス: https://github.com/RevenueCat/react-native-purchases

**結論**:
- **確認済み**: 既存のコードでは、サブスクリプションをキャンセルする処理は実装されていない
- **問題の原因**: アップグレード時に、既存のサブスクリプションをキャンセルせずに新しいサブスクリプションを購入しているため、二重課金が発生している
- **対応方針**: 
  1. react-native-purchasesのAPIリファレンスで、既存のサブスクリプションをキャンセルする方法を確認する
  2. アップグレード時に、既存のサブスクリプションをキャンセルする処理を実装する
  3. Google Play Billing Library公式ドキュメントで、サブスクリプションのアップグレード/置換方法を確認する（参考情報として）

**次のアクション**:
- react-native-purchasesのGitHubリポジトリ（https://github.com/RevenueCat/react-native-purchases）で、APIリファレンスを確認し、既存のサブスクリプションをキャンセルする方法を調査
- Google Play Billing Library公式ドキュメント（https://developer.android.com/google/play/billing）で、サブスクリプションのアップグレード/置換方法を確認（参考情報として）
- 既存のサブスクリプションをキャンセルする処理の実装方法を調査し、`proceedWithPurchase`関数内に追加する

---

### タスク3: Google Play Console側での対応方法の調査

**調査項目**:
- [ ] Google Play Consoleで、サブスクリプショングループの設定が存在するか（別の場所にある可能性）
- [ ] Google Play Billing Library 5.0以降での、サブスクリプション管理の変更点
- [ ] Base PlanとOfferの概念で、サブスクリプションのアップグレード/ダウングレードを管理する方法
- [ ] Google Play Consoleの公式ドキュメントで、サブスクリプションのアップグレード/ダウングレード時の動作を確認
- [ ] Google Play Consoleのヘルプセンターで、二重課金を防ぐ方法を確認

**調査先**:
- Google Play Console公式ドキュメント
- Google Play Billing Library公式ドキュメント
- Google Play Consoleのヘルプセンター

**調査結果**: 
- 調査中（2025年12月7日）

**調査日**: 2025年12月7日  
**調査者**: AIエージェント

**調査結果**:
- [x] Google Play Consoleで、サブスクリプショングループの設定が存在するか（別の場所にある可能性）
  - **確認済み**: ユーザーが実際にGoogle Play Consoleを確認した結果、サブスクリプショングループの設定は存在しないことを確認済み
  - 一覧ページにも詳細ページにも存在しない
- [ ] Google Play Billing Library 5.0以降での、サブスクリプション管理の変更点
  - **未確認**: Google Play Billing Library公式ドキュメントの直接確認が必要
- [ ] Base PlanとOfferの概念で、サブスクリプションのアップグレード/ダウングレードを管理する方法
  - **未確認**: Google Play Billing Library公式ドキュメントの直接確認が必要
- [ ] Google Play Consoleの公式ドキュメントで、サブスクリプションのアップグレード/ダウングレード時の動作を確認
  - **未確認**: Google Play Console公式ドキュメントの直接確認が必要
- [ ] Google Play Consoleのヘルプセンターで、二重課金を防ぐ方法を確認
  - **未確認**: Google Play Consoleヘルプセンターの直接確認が必要

**参考資料**:
- Google Play Console公式ドキュメント: https://support.google.com/googleplay/android-developer
- Google Play Billing Library公式ドキュメント: https://developer.android.com/google/play/billing

**結論**:
- Google Play Consoleの現在のUIでは、サブスクリプショングループの設定機能が存在しない
- Google Play Billing Library 5.0以降での変更点を確認する必要がある
- Base PlanとOfferの概念で、サブスクリプションのアップグレード/ダウングレードを管理する方法を確認する必要がある

**次のアクション**:
- Google Play Billing Library公式ドキュメントの確認
- Google Play Console公式ドキュメントの確認
- Google Play Consoleヘルプセンターの確認

---

## 調査の進め方

### セッション1: RevenueCat側での対応方法の調査
- タスク1を完了
- 調査結果を記録

### セッション2: アプリ側での対応方法の調査
- タスク2を完了
- 調査結果を記録

### セッション3: Google Play Console側での対応方法の調査
- タスク3を完了
- 調査結果を記録

### セッション4: 調査結果のまとめと対応方針の決定
- すべての調査結果をまとめる
- 対応方針を決定
- 実装計画を作成

---

## 調査結果の記録形式

各タスクの調査結果は、以下の形式で記録します：

```markdown
### タスクX: [タスク名]

**調査日**: YYYY-MM-DD
**調査者**: AIエージェント

**調査結果**:
- [調査項目1]: [結果]
- [調査項目2]: [結果]
- ...

**参考資料**:
- [URL1]: [説明]
- [URL2]: [説明]

**結論**:
[調査結果をまとめた結論]

**次のアクション**:
- [アクション1]
- [アクション2]
```

---

---

## 調査結果のまとめ（2025年12月7日更新）

### 現在の実装状況

**既存のコード（`screens/SubscriptionScreen.tsx`）の確認結果**:
- ✅ アップグレード時に確認ダイアログを表示する処理は実装されている（469-487行目）
- ❌ 既存のサブスクリプションをキャンセルする処理は実装されていない
- ❌ `purchasePackage`を呼び出すだけで、既存のサブスクリプションをキャンセルする処理は実装されていない

**問題の原因**:
- アップグレード時に、既存のサブスクリプションをキャンセルせずに新しいサブスクリプションを購入している
- これにより、Google Playストアで両方のサブスクリプションが表示され、二重課金が発生している

### 次のステップ

1. **RevenueCat公式ドキュメントの確認**
   - `purchasePackage`の動作を確認（既存のサブスクリプションが自動的にキャンセルされるかどうか）
   - サブスクリプションのアップグレード時の動作を確認

2. **react-native-purchasesのAPIリファレンスの確認**
   - 既存のサブスクリプションをキャンセルする方法を確認
   - `cancelSubscription`や`unsubscribe`などのメソッドが存在するか確認

3. **実装方法の調査**
   - 既存のサブスクリプションをキャンセルする処理を`proceedWithPurchase`関数内に追加する方法を調査
   - アップグレード時に、既存のサブスクリプションをキャンセルしてから新しいサブスクリプションを購入する処理を実装

4. **Google Play Billing Libraryの確認（参考情報として）**
   - サブスクリプションのアップグレード/置換方法を確認
   - Base PlanとOfferの概念で、サブスクリプションのアップグレード/ダウングレードを管理する方法を確認

---

## 追加調査結果（2025年12月7日 - セッション2）

### 調査結果の詳細

#### 1. Google Play Billing APIの調査

**発見事項**:
- Google Play Billing Libraryでは、`purchases.subscriptions.cancel`メソッドを使用して定期購入をキャンセルできる
- Google Play Billing Library 8.0.0以降では、デバイス上で直接サブスクリプション情報を照会し、サブスクリプションの状態を管理できる
- **重要な発見**: `BillingFlowParams`に`setOldSku()`を設定することで、既存のサブスクリプションを指定し、新しいサブスクリプションへの切り替えを適切に処理できる

**参考情報**:
- Google Play Billing公式ドキュメント: https://developer.android.com/google/play/billing
- 定期購入のライフサイクル管理: https://developer.android.com/google/play/billing/lifecycle/subscriptions

#### 2. RevenueCatのサブスクリプション管理

**重要な発見（修正）**:
- `pro`と`ultimate`は**別々のエンタイトルメント**として設定されている（RevenueCatダッシュボードで確認済み）
- RevenueCatでは、**異なるエンタイトルメント間のアップグレード**では、既存のサブスクリプションが自動的にキャンセルされない
- そのため、PROとULTIMATEの両方が有効なままになり、Google Playストアで両方のサブスクリプションが表示される

**問題の本質**:
- 同じエンタイトルメント内でのアップグレード（例：PRO月額→PRO年額）では、自動的に置き換えられる可能性がある
- しかし、**異なるエンタイトルメント間のアップグレード（PRO→ULTIMATE）では、自動的にキャンセルされない**
- これは、RevenueCatの仕様であり、多くのアプリで複数のプラン（PRO、ULTIMATE）を提供する際の一般的な問題

**対応が必要**:
- アプリ側で、アップグレード時に既存のサブスクリプションをキャンセルする処理を実装する必要がある
- または、Google Play Billingの`setOldSku()`を使用して、既存のサブスクリプションを置き換える方法を検討する

#### 3. サブスクリプションのアップグレード時の動作

**Apple App Storeの動作**:
- サブスクリプションをアップグレードする際、日割り計算でクレジットが払い戻され、新しいサブスクリプションの全額が課金される
- 既存のサブスクリプションは自動的にキャンセルされる

**Google Playストアの動作（参考事例）**:
- Photoroomの事例では、Androidでプランをアップグレードする際、新しいプランが即座に適用される
- 前のプランの残り期間は、新しいプランの利用期間に比例して自動的に換算され、その分の利用期間が延長される
- **しかし、既存のサブスクリプションが自動的にキャンセルされるかどうかは、サブスクリプショングループの設定に依存する可能性がある**

#### 4. react-native-purchasesのAPI調査

**現在使用されているメソッド**:
- `Purchases.configure()`: RevenueCatの初期化
- `Purchases.getOfferings()`: オファリングの取得
- `Purchases.purchasePackage()`: パッケージの購入

**調査が必要なメソッド**:
- `Purchases.getCustomerInfo()`: 顧客情報の取得（アクティブなサブスクリプションの確認に使用可能）
- `Purchases.restorePurchases()`: 購入の復元（既存のサブスクリプションの確認に使用可能）
- 既存のサブスクリプションをキャンセルするメソッドの有無（要確認）

**重要な発見**:
- react-native-purchasesには、**既存のサブスクリプションを直接キャンセルするメソッドは提供されていない可能性が高い**
- サブスクリプションのキャンセルは、通常、ストア側（Google PlayストアまたはApp Store）で行う必要がある
- ただし、**アップグレード時に既存のサブスクリプションを自動的に置き換える機能がある可能性がある**

### 対応方針の検討

#### オプション1: Google Play Consoleでの設定確認

**推奨事項**:
1. Google Play Consoleで、サブスクリプションの設定を確認
2. サブスクリプショングループの設定が存在するか確認（現在のUIでは存在しないことが確認済み）
3. Base PlanとOfferの概念で、サブスクリプションのアップグレード/ダウングレードを管理する方法を確認

**注意点**:
- Google Play Consoleの現在のUIでは、サブスクリプショングループの設定機能が存在しないことが確認済み
- Google Play Billing Library 5.0以降での変更点を確認する必要がある

#### オプション2: アプリ側での処理実装

**推奨事項**:
1. `proceedWithPurchase`関数内で、既存のサブスクリプションを確認
2. 既存のサブスクリプションがある場合、ユーザーにGoogle Playストアでキャンセルするよう案内
3. または、RevenueCatのAPIを使用して、既存のサブスクリプションの状態を確認し、適切に処理

**注意点**:
- react-native-purchasesには、既存のサブスクリプションを直接キャンセルするメソッドは提供されていない可能性が高い
- サブスクリプションのキャンセルは、通常、ストア側で行う必要がある

#### オプション3: RevenueCatのサポートに問い合わせ

**推奨事項**:
1. RevenueCatのサポートチームに直接問い合わせ
2. サブスクリプションのアップグレード時に既存のサブスクリプションをキャンセルする推奨される方法を確認
3. 同じエンタイトルメントに複数のサブスクリプションが紐づく場合の動作を確認

**注意点**:
- 公式ドキュメントで情報が見つからなかったため、サポートチームへの問い合わせが有効な可能性がある

### 実装方針（決定）

**調査結果**:
- react-native-purchasesには、`setOldSku()`に直接対応するメソッドは提供されていない
- react-native-purchasesには、既存のサブスクリプションを直接キャンセルするメソッドは提供されていない
- ただし、`getCustomerInfo()`を使用して、アクティブなサブスクリプションを確認することは可能

**実装方法**:

#### 方法1: `getCustomerInfo()`で既存のサブスクリプションを確認し、バックエンド経由でキャンセル

1. **アプリ側の実装**:
   - `proceedWithPurchase`関数内で、`Purchases.getCustomerInfo()`を呼び出して、アクティブなサブスクリプションを確認
   - 既存のサブスクリプションがある場合、その情報（product_id、purchase_tokenなど）を取得
   - バックエンドAPIに、既存のサブスクリプションをキャンセルするリクエストを送信

2. **バックエンド側の実装**:
   - Google Play Developer APIの`purchases.subscriptions.cancel`メソッドを使用して、既存のサブスクリプションをキャンセル
   - キャンセル成功後、新しいサブスクリプションの購入処理を続行

#### 方法2: アップグレード時に既存のサブスクリプション情報を取得し、新しい購入時にGoogle Playに通知

1. **アプリ側の実装**:
   - `proceedWithPurchase`関数内で、既存のサブスクリプション情報を取得
   - `purchasePackage`を呼び出す前に、既存のサブスクリプション情報をバックエンドに送信
   - バックエンド側で、Google Play Developer APIを使用して既存のサブスクリプションをキャンセル

2. **注意点**:
   - Google Play Developer APIを使用するには、バックエンド側での実装が必要
   - サービスアカウントの認証情報が必要

### 次のアクション

1. **アプリ側の実装**
   - `proceedWithPurchase`関数内で、`getCustomerInfo()`を使用してアクティブなサブスクリプションを確認
   - 既存のサブスクリプション情報を取得し、バックエンドに送信する処理を実装

2. **バックエンド側の実装**
   - Google Play Developer APIを使用して、既存のサブスクリプションをキャンセルするエンドポイントを実装
   - サービスアカウントの認証情報を設定

3. **テスト**
   - アップグレードフローのテストを実施
   - 既存のサブスクリプションが正しくキャンセルされることを確認

---

## ✅ 解決策の実装（2025年12月7日）

### 問題の解決方法

**解決策**: `upgradeInfo`を使用して、Google Play Store APIに既存のサブスクリプションを置き換える指示を明示的に送信する。

**実装のポイント**:
- `react-native-purchases`の`purchasePackage`メソッドに`upgradeInfo`パラメータを追加
- アップグレード/ダウングレード時に、アクティブな既存サブスクリプションのProduct IDを取得
- `upgradeInfo`に`oldProductId`を設定し、Google Play Store APIに「新しい購入が既存のサブスクリプションを置き換える」ことを指示

### 実装内容

#### 1. `lib/subscription/revenue-cat-client.ts`の修正

**追加した機能**:
- `getCustomerInfo()`メソッド: アクティブなサブスクリプション情報を取得
- `UpgradeInfo`型定義: アップグレード情報の型を定義
- `purchasePackage()`メソッドの拡張: `upgradeInfo`パラメータを受け取り、Androidの場合に`prorationMode`を設定してSDKに渡す

**実装コード**:
```typescript
// UpgradeInfoの型定義
export interface UpgradeInfo {
  oldProductId: string;
  googleMode?: 'IMMEDIATE_AND_CHARGE' | 'IMMEDIATE_WITHOUT_PRORATION' | 'DEFERRED';
}

// getCustomerInfoメソッドの追加
public async getCustomerInfo(): Promise<RevenueCatCustomerInfo | null> {
  if (!this.Purchases) {
    return null;
  }
  const customerInfo = await this.Purchases.getCustomerInfo();
  return {
    originalAppUserId: customerInfo.originalAppUserId,
    entitlements: customerInfo.entitlements,
    activeSubscriptions: customerInfo.activeSubscriptions || [],
  };
}

// purchasePackageメソッドの拡張
public async purchasePackage(
  packageToPurchase: RevenueCatPackage,
  upgradeInfo?: UpgradeInfo
): Promise<RevenueCatCustomerInfo> {
  // ... 既存のコード ...
  
  if (upgradeInfo && Platform.OS === 'android') {
    const upgradeInfoForSDK = {
      oldProductIdentifier: upgradeInfo.oldProductId,
      prorationMode: googleModeValue, // IMMEDIATE_AND_CHARGE = 1
    };
    purchaseResult = await this.Purchases.purchasePackage(
      packageToPurchase,
      upgradeInfoForSDK
    );
  } else {
    purchaseResult = await this.Purchases.purchasePackage(packageToPurchase);
  }
  // ... 後続の処理 ...
}
```

#### 2. `hooks/usePurchase.ts`の修正

**追加した機能**:
- アップグレード/ダウングレード検出: PRO→ULTIMATE（アップグレード）とULTIMATE→PRO（ダウングレード）の両方を検出
- アクティブなサブスクリプションの取得: `getCustomerInfo()`でアクティブな既存サブスクリプションのProduct IDを取得
- `upgradeInfo`の作成: 既存のProduct IDを`oldProductId`として設定し、`upgradeInfo`を作成

**実装コード**:
```typescript
// アップグレード/ダウングレード情報の作成
let upgradeInfo: any = undefined;
const isUpgrade = selectedPlan === 'ultimate' && currentPlan && 
  currentPlan.plan_type === 'pro' && currentPlan.subscription_status === 'active';
const isDowngrade = selectedPlan === 'pro' && currentPlan && 
  currentPlan.plan_type === 'ultimate' && currentPlan.subscription_status === 'active';

if (isUpgrade || isDowngrade) {
  const customerInfoForUpgrade = await revenueCatClient.getCustomerInfo();
  let oldProductId: string | undefined;

  if (customerInfoForUpgrade && customerInfoForUpgrade.activeSubscriptions) {
    const activeSubs = customerInfoForUpgrade.activeSubscriptions;
    
    if (isUpgrade) {
      // PRO→ULTIMATE: アクティブなPROのIDを探す
      const proMonthlyId = SUBSCRIPTION_PRODUCTS.PRO_MONTHLY;
      const proYearlyId = SUBSCRIPTION_PRODUCTS.PRO_YEARLY;
      // ... Product IDの検索処理 ...
    } else if (isDowngrade) {
      // ULTIMATE→PRO: アクティブなULTIMATEのIDを探す
      const ultimateMonthlyId = SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY;
      const ultimateYearlyId = SUBSCRIPTION_PRODUCTS.ULTIMATE_YEARLY;
      // ... Product IDの検索処理 ...
    }
  }

  if (oldProductId) {
    upgradeInfo = {
      oldProductId: oldProductId,
      googleMode: 'IMMEDIATE_AND_CHARGE' as const,
    };
  }
}

// 購入処理
const customerInfo = await revenueCatClient.purchasePackage(packageToPurchase, upgradeInfo);
```

### 動作の仕組み

1. **アップグレード/ダウングレード検出**
   - `selectedPlan`と`currentPlan`を比較して、アップグレードまたはダウングレードを検出

2. **既存サブスクリプションの取得**
   - `getCustomerInfo()`でアクティブなサブスクリプションのリストを取得
   - 既存のProduct ID（`morizo_pro_monthly`または`morizo_ultimate_monthly`など）を特定

3. **upgradeInfoの作成**
   - `oldProductId`に既存のProduct IDを設定
   - `googleMode`を`IMMEDIATE_AND_CHARGE`に設定（即座に変更し、日割りで差額を請求/返金）

4. **Google Play Store APIへの指示**
   - RevenueCat SDKが`upgradeInfo`を受け取り、Google Play Store APIに「新しい購入（ULTIMATE）が既存のサブスクリプション（PRO）を置き換える」ことを明示的に指示
   - これにより、既存のサブスクリプションが自動的にキャンセルされ、二重登録が回避される

### 解決した問題

✅ **PRO→ULTIMATE（アップグレード）**: 既存のPROサブスクリプションが自動的にキャンセルされ、ULTIMATEに置き換えられる  
✅ **ULTIMATE→PRO（ダウングレード）**: 既存のULTIMATEサブスクリプションが自動的にキャンセルされ、PROに置き換えられる  
✅ **二重課金の回避**: Google Playストアで両方のサブスクリプションが表示される問題が解消

### 重要なポイント

- **Play Consoleの設定は不要**: APIによる明示的な指示がPlay Consoleの設定よりも優先されるため、設定画面が見つからなくても問題なく動作する
- **Android専用の実装**: iOSの場合は、App Storeが自動的に処理するため、`upgradeInfo`は不要
- **日割り計算**: `IMMEDIATE_AND_CHARGE`モードにより、アップグレード時は差額を請求、ダウングレード時は差額を返金（クレジット）する

### テスト結果

- ✅ PRO→ULTIMATEのアップグレード: 正常に動作確認済み
- ✅ ULTIMATE→PROのダウングレード: 正常に動作確認済み
- ✅ 二重登録の回避: Google Playストアで両方のサブスクリプションが表示されないことを確認

---

**最終更新**: 2025年12月7日  
**作成者**: AIエージェント協働チーム  
**解決策の提供**: Google Gemini

