# セッション引き継ぎ文書

**作成日**: 2026年1月19日  
**セッション内容**: App Storeレビュー対応とサブスクリプション機能改善

---

## 実施した作業（完了済み）

### 1. 音声認識エラーの対応（iOS 26.2対応） ✅
- **問題**: iOS 26.2で音声認識がエラーになる
- **対応**: `staysActiveInBackground: false`追加、待機時間追加、アプリ状態確認追加
- **変更ファイル**: `hooks/useVoiceRecording.ts`

### 2. 年額プランの表示機能の実装 ✅
- **問題**: 年額プランが表示されていない
- **対応**: 月額・年額切り替えUI作成、購入処理更新、価格表示更新
- **変更ファイル**: `components/subscription/BillingPeriodToggle.tsx` (新規), `screens/SubscriptionScreen.tsx`, `hooks/usePurchase.ts`, `components/subscription/PurchaseInfoSection.tsx`, `lib/subscription/revenue-cat-client.ts`
- **RevenueCat設定**: 年額パッケージ追加済み（`pro_yearly`, `ultimate_yearly`）

### 3. エラーハンドリングの改善 ✅
- **問題**: オファリング取得エラーの詳細がわからない
- **対応**: 診断機能追加、自動再取得、診断ボタン追加
- **変更ファイル**: `lib/subscription/revenue-cat-client.ts`, `hooks/usePurchase.ts`, `screens/SubscriptionScreen.tsx`

### 4. 診断ロジックの改善 ✅
- **対応**: ステータスの不整合検出を追加、不整合メッセージを改善
- **変更ファイル**: `screens/SubscriptionScreen.tsx`

### 5. エンタイトルメントIDのマッピング修正 ✅
- **問題**: コードでは`pro`/`ultimate`を期待しているが、RevenueCatでは`morizo_pro`/`morizo_ultimate`を使用
- **対応**: `ENTITLEMENT_ID_MAP`を追加し、正しいエンタイトルメントIDを使用
- **変更ファイル**: `hooks/usePurchase.ts`

### 6. 購入処理の改善 ✅
- **対応**: 購入後の顧客情報再取得、デバッグログ追加
- **変更ファイル**: `hooks/usePurchase.ts`

### 7. ログ出力の改善 ✅
- **対応**: APIリクエストと購入処理の詳細ログ追加
- **変更ファイル**: `api/subscription-api.ts`, `hooks/usePurchase.ts`

### 8. 購入フローシーケンス図の作成 ✅
- **対応**: 購入フローの全体像をMermaid形式で可視化
- **内容**: 正常フロー、問題フロー、修正後のフローを図示
- **作成ファイル**: `docs/PURCHASE_FLOW_SEQUENCE.md`
- **更新**: バックエンド側の意見を反映した修正版を作成

### 9. RevenueCat CustomerInfo比較ガイドの作成 ✅
- **対応**: SDKとダッシュボードの比較方法をドキュメント化
- **内容**: 比較手順、チェックリスト、トラブルシューティング
- **作成ファイル**: `docs/REVENUECAT_CUSTOMERINFO_COMPARISON.md`

### 10. 開発環境でのダッシュボード確認機能の追加 ✅
- **対応**: PurchaseResult受け取り後、getCustomerInfo()呼び出し前にアラートで一時停止
- **目的**: RevenueCatダッシュボードを確認する時間を確保
- **動作**: 開発環境（`__DEV__ === true`）でのみ有効
- **変更ファイル**: `hooks/usePurchase.ts`
- **環境変数**: `EXPO_PUBLIC_ENABLE_DASHBOARD_CHECK=false`で無効化可能

### 11. 購入後の詳細ログ出力の追加 ✅
- **対応**: RevenueCatダッシュボードとの比較用の詳細ログを追加
- **内容**: SDK側の情報、診断情報、期待値、Customer IDを出力
- **変更ファイル**: `hooks/usePurchase.ts`

---

## 現在の課題

### 課題1: Pro yearly購入時のRevenueCatエンタイトルメント更新問題 ⚠️ **部分的に解決**

**状況（2026-01-21更新）**:
- ✅ **バックエンド側の修正により、正常に動作するようになった**
  - Ultimate月額 → Pro年額のダウングレードが正常に動作（2026-01-21確認）
  - ⚠️ **RevenueCat側のエンタイトルメント更新の遅延は残存**
  - 購入後、約22秒経過してもエンタイトルメントが更新されない場合がある
  - ただし、`product_id`から正しく`plan_type`を導出できるため、機能的には問題ない

**修正内容（バックエンド側）**:
- PRODUCT_CHANGEイベントの処理を追加
- `expires_at`の値に関わらず、常に`subscription_status = "active"`を設定
- これにより、Webhookと`/api/subscription/update`の両方で正しい値が設定される

**正常動作の確認（2026-01-21 01:04:29）**:
- ✅ モバイル側: `product_id: "morizo_pro_yearly"`を正しく送信
- ✅ バックエンド: `/api/subscription/update`が200 OKを返す
- ✅ バックエンド: その後のAPI呼び出しで`plan_type: "pro"`を正しく返す
- ⚠️ RevenueCat SDK: `activeEntitlements: ["morizo_ultimate"]`のまま（更新遅延）

**詳細**: `/app/Morizo-mobile/docs/PURCHASE_FLOW_SUCCESS_ANALYSIS.md` を参照

**ログ分析結果（2026-01-19 08:29:03付近）**:

**Pro yearly購入時（問題あり）**:
- `hasUpgradeInfo: true`（ダウングレードなのにtrue）
- `activeSubscriptions: ["morizo_ultimate_yearly"]`（まだultimateが残っている）
- `activeEntitlements: ["morizo_ultimate"]`（proに更新されていない）
- `expectedEntitlement: "morizo_pro"`（モバイル側は正しく期待）
- ⚠️ 警告: "アクティブなエンタイトルメントが見つかりません（iOS）"
- バックエンド送信: `product_id: "morizo_pro_yearly"`（正しい）
- バックエンド応答: 200 OK
- その後のAPI呼び出し: `plan_type: "ultimate"`（間違っている）

**Pro monthly購入時（正常動作）**:
- `hasUpgradeInfo: false`（正しい）
- `activeEntitlements: ["morizo_pro"]`（正しく更新されている）
- バックエンド送信: `product_id: "morizo_pro_monthly"`（正しい）
- その後のAPI呼び出し: `plan_type: "pro"`（正しい）

**根本原因（確定）**:
1. **バックエンド側の問題（修正済み）**: RevenueCat WebhookのPRODUCT_CHANGEイベント処理が不完全
   - `expires_at`が過去の日付の場合、`subscription_status = "expired"`になる
   - Webhookが`/api/subscription/update`の前後で非同期に実行され、古い値で上書きする可能性
   - **修正**: PRODUCT_CHANGEイベントの場合、`expires_at`の値に関わらず、常に`subscription_status = "active"`を設定

2. **RevenueCat側の問題（残存）**: Pro yearly購入時に、RevenueCatのエンタイトルメントが`morizo_ultimate`から`morizo_pro`に更新されない
   - 購入後、約22秒経過してもエンタイトルメントが更新されない場合がある
   - RevenueCatダッシュボードの設定は正しいが、実際の更新処理に遅延がある
   - **影響**: モバイル側で警告が表示されるが、`product_id`から正しく`plan_type`を導出できるため、機能的には問題ない

**実施した調査**:
1. ✅ **購入フローシーケンス図の作成**
   - 正常フロー、問題フロー、修正後のフローを可視化
   - RevenueCat Webhookの処理フローを追加
   - 詳細: `/app/Morizo-mobile/docs/PURCHASE_FLOW_SEQUENCE.md`

2. ✅ **RevenueCat CustomerInfo比較ガイドの作成**
   - SDKとダッシュボードの比較方法をドキュメント化
   - 開発環境でのアラート機能を追加（PurchaseResult後の一時停止）
   - 詳細: `/app/Morizo-mobile/docs/REVENUECAT_CUSTOMERINFO_COMPARISON.md`

3. ✅ **正常動作の確認**
   - Ultimate月額 → Pro年額のダウングレードが正常に動作
   - バックエンド側の修正が効いていることを確認
   - 詳細: `/app/Morizo-mobile/docs/PURCHASE_FLOW_SUCCESS_ANALYSIS.md`

---

### 課題2: バックエンド側のproduct_idマッピング ✅ **解決済み**

**状況（2026-01-21更新）**:
- ✅ **バックエンド側の修正により、正常に動作するようになった**
- ✅ RevenueCatダッシュボードの設定は正しい（確認済み）
  - `morizo_pro_monthly` → `morizo_pro` エンタイトルメント
  - `morizo_pro_yearly` → `morizo_pro` エンタイトルメント
  - `morizo_ultimate_monthly` → `morizo_ultimate` エンタイトルメント
  - `morizo_ultimate_yearly` → `morizo_ultimate` エンタイトルメント
- ✅ `morizo_pro_yearly`を購入した場合、バックエンドが正しく`pro`プランを返す
- ✅ モバイル側では`product_id`から正しくプランタイプを判定している

**修正内容（バックエンド側）**:
- PRODUCT_CHANGEイベントの処理を追加
- `expires_at`の値に関わらず、常に`subscription_status = "active"`を設定
- `product_id`から`plan_type`を正しく導出

**確認結果（2026-01-21 01:04:29）**:
- ✅ モバイル側: `product_id: "morizo_pro_yearly"`を正しく送信
- ✅ バックエンド: `/api/subscription/update`が200 OKを返す
- ✅ バックエンド: その後のAPI呼び出しで`plan_type: "pro"`を正しく返す

**詳細**: `/app/Morizo-mobile/docs/PURCHASE_FLOW_SEQUENCE.md` を参照

---

## 次のセッションで実施すべき作業

### 優先度: 中

1. **RevenueCat側のエンタイトルメント更新遅延の調査（継続）**
   - RevenueCatダッシュボードで、Pro yearly購入後の実際のエンタイトルメント状態を確認
   - ダウングレード時のエンタイトルメント更新ロジックを確認
   - **注意**: この問題はRevenueCat側の問題であり、バックエンド側では`product_id`から正しく`plan_type`を導出できるため、機能的には問題ない

2. **モバイル側の改善（検討事項）**
   - エンタイトルメント更新の待機時間を追加（RevenueCat側の更新完了を待つ）
   - 購入後のCustomerInfo再取得を複数回試行
   - **注意**: 現在は`product_id`から正しく`plan_type`を導出できるため、必須ではない

3. **監視とログ**
   - Webhookの実行タイミングを監視
   - `updated_at`のタイムスタンプの順序を確認
   - 問題が再発しないことを確認

### 優先度: 低

4. **ユーザー体験の改善**
   - エンタイトルメントが見つからない警告メッセージの改善
   - 購入処理中の状態表示の改善

---

## 参考情報

### RevenueCat設定
- プロジェクトID: `proj9f275a4d`
- オファリングID: `ofrng1664f25afb` (default)
- エンタイトルメント:
  - `morizo_pro` (Entitlement ID: `entla8a57c9287`)
  - `morizo_ultimate` (Entitlement ID: `entlb6f3200b45`)

### 商品IDとエンタイトルメントの紐付け（確認済み）
- ✅ `morizo_pro_monthly` → `morizo_pro` エンタイトルメント
- ✅ `morizo_pro_yearly` → `morizo_pro` エンタイトルメント
- ✅ `morizo_ultimate_monthly` → `morizo_ultimate` エンタイトルメント
- ✅ `morizo_ultimate_yearly` → `morizo_ultimate` エンタイトルメント

### 商品ID
- `morizo_pro_monthly` (PRO月額)
- `morizo_pro_yearly` (PRO年額) - Product ID: `proda8db8a11bc`
- `morizo_ultimate_monthly` (ULTIMATE月額)
- `morizo_ultimate_yearly` (ULTIMATE年額) - Product ID: `prod886a1f0ea1`

### パッケージID
- `pro_monthly` (Package ID: `pkgedd4a83a232`)
- `pro_yearly` (Package ID: `pkge5f9654437e`)
- `ultimate_monthly` (Package ID: `pkge67f1ffb224`)
- `ultimate_yearly` (Package ID: `pkgefa6e2db591`)

---

## 注意事項

1. **App Store審査中の警告**
   - すべての商品が`IN_REVIEW`状態
   - これは正常（審査中はSandboxでのテスト購入のみ可能）

2. **TestFlightでのテスト**
   - Sandbox環境でのテスト購入は可能
   - 本番環境での購入は、商品が承認済みになるまで不可

3. **バックエンド側の対応（完了）**
   - ✅ バックエンド側の修正により、正常に動作するようになった
   - ✅ PRODUCT_CHANGEイベントの処理を追加
   - ✅ `product_id`から`plan_type`を正しく導出

---

## 作成したドキュメント

### 購入フロー関連
- `/app/Morizo-mobile/docs/PURCHASE_FLOW_SEQUENCE.md`
  - 購入フローのシーケンス図（Mermaid形式）
  - 正常フロー、問題フロー、修正後のフローを図示
  - RevenueCat Webhookの処理フローを含む

- `/app/Morizo-mobile/docs/PURCHASE_FLOW_SUCCESS_ANALYSIS.md`
  - 正常動作時の詳細分析
  - Ultimate月額 → Pro年額のダウングレード成功事例

### RevenueCat関連
- `/app/Morizo-mobile/docs/REVENUECAT_CUSTOMERINFO_COMPARISON.md`
  - SDKとダッシュボードの比較ガイド
  - 比較手順、チェックリスト、トラブルシューティング
  - 開発環境でのアラート機能の説明

---

**最終更新**: 2026年1月21日  
**作成者**: AIエージェント  
**更新内容**: バックエンド側の修正完了、正常動作の確認、ドキュメント作成
