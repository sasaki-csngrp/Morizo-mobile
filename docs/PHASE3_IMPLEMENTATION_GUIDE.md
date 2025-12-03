# Phase3 実装ガイド - モバイルアプリのIAP連携

## 概要

Phase2までバックエンドで実装完了しているため、Phase3（モバイルアプリのIAP連携）に着手します。

**作成日**: 2025年1月29日  
**バージョン**: 1.0  
**対象**: Morizo-mobile（モバイルアプリ）

---

## PLANとDETAILの使い分け

### MONETIZATION_IMPLEMENTATION_PLAN.md（実装プラン）

**用途**: 実装の全体像と技術的な詳細を把握

**参照すべき内容**:
- ✅ Phase3の実装内容の概要（3.3.1, 3.3.2）
- ✅ 対象ファイルのリスト
- ✅ 技術的な詳細（5.1 プラン制限の定義）
- ✅ 実装チェックリスト（7. フェーズ3）

**参照タイミング**:
- 実装開始前の全体像把握
- 実装中の技術的な詳細確認
- 実装完了時のチェックリスト確認

### MONETIZATION_IMPLEMENTATION_DETAILS.md（詳細注意事項）

**用途**: 実装時の注意事項、セキュリティ、運用面の詳細を確認

**参照すべき内容**:
- ✅ ストア設定の詳細手順（1. ストア設定）
- ✅ レシート検証の実装方法（2.2 レシート検証）
- ✅ セキュリティの実装（3. セキュリティ）
- ✅ トラブルシューティング（5. トラブルシューティング）
- ✅ チェックリスト（6. チェックリスト）

**参照タイミング**:
- ストア設定を行う前
- レシート検証を実装する前
- セキュリティ関連の実装時
- エラー発生時のトラブルシューティング

---

## Phase3 実装の進め方

### ステップ1: 実装前の準備（PLAN + DETAIL参照）

#### 1.1 全体像の把握（PLAN参照）

**参照箇所**: `MONETIZATION_IMPLEMENTATION_PLAN.md` セクション3.3

**確認事項**:
- [ ] Phase3の実装内容を理解
- [ ] 対象ファイルのリストを確認
- [ ] 技術スタック（IAPライブラリ）を確認

#### 1.2 ストア設定の準備（DETAIL参照）

**参照箇所**: `MONETIZATION_IMPLEMENTATION_DETAILS.md` セクション1

**確認事項**:
- [ ] Google Play Consoleでの商品登録手順を確認
- [ ] App Store Connectでの商品登録手順を確認
- [ ] 商品IDの命名規則を確認
- [ ] テストアカウントの設定方法を確認

**重要**: ストア設定は実装前に完了させる必要があります（開発環境ではサンドボックス環境を使用）

---

### ステップ2: IAPライブラリの導入（PLAN参照）

#### 2.1 ライブラリの選択

**参照箇所**: `MONETIZATION_IMPLEMENTATION_PLAN.md` セクション3.3.2

**選択肢**:
- `react-native-purchases` (RevenueCat) - 推奨
- `expo-in-app-purchases` (Expo公式)

**推奨**: `react-native-purchases`を使用（RevenueCatはレシート検証やプラットフォーム間の統一管理が容易）

#### 2.2 パッケージのインストール

```bash
npm install react-native-purchases
```

#### 2.3 設定ファイルの作成

**参照箇所**: `MONETIZATION_IMPLEMENTATION_DETAILS.md` セクション1.3

商品IDのマッピング設定ファイルを作成:
- `/app/Morizo-mobile/config/subscription.ts` (新規作成)

---

### ステップ3: バックエンドAPI連携の実装（PLAN + DETAIL参照）

#### 3.1 APIクライアントの実装

**参照箇所**: `MONETIZATION_IMPLEMENTATION_PLAN.md` セクション3.3.2

**実装ファイル**:
- `/app/Morizo-mobile/api/subscription-api.ts` (新規作成)

**実装内容**:
- `GET /api/subscription/plan` - 現在のプラン情報取得
- `GET /api/subscription/usage` - 本日の利用回数取得
- `POST /api/subscription/update` - プラン更新（レシート検証含む）

#### 3.2 レシート検証の実装（DETAIL参照）

**参照箇所**: `MONETIZATION_IMPLEMENTATION_DETAILS.md` セクション2.2, 3.1

**重要**: レシート検証はバックエンドで実装済み（Phase2）のため、モバイルアプリからはレシートデータを送信するのみ

**実装内容**:
- 購入完了後、レシート（トークン）をバックエンドに送信
- バックエンドからの検証結果を受け取る
- エラーハンドリングの実装

---

### ステップ4: UI実装（PLAN参照）

#### 4.1 プラン表示画面の実装

**参照箇所**: `MONETIZATION_IMPLEMENTATION_PLAN.md` セクション3.3.2

**実装ファイル**:
- `/app/Morizo-mobile/screens/SubscriptionScreen.tsx` (新規作成)
- `/app/Morizo-mobile/components/PlanCard.tsx` (新規作成)

**実装内容**:
- 現在のプラン表示
- 利用回数の表示（`GET /api/subscription/usage`）
- プランアップグレード画面
- 制限超過時の警告表示

#### 4.2 購入フローの実装

**実装内容**:
- プラン購入画面の実装
- 購入処理の実装（ストア連携）
- 購入状態のバックエンド同期（`POST /api/subscription/update`）

---

### ステップ5: テストとデバッグ（DETAIL参照）

#### 5.1 サンドボックス環境でのテスト

**参照箇所**: `MONETIZATION_IMPLEMENTATION_DETAILS.md` セクション2.1

**テスト項目**:
- [ ] 購入フローのテスト
- [ ] レシート検証のテスト
- [ ] プラン更新のテスト
- [ ] エラーハンドリングのテスト

#### 5.2 トラブルシューティング

**参照箇所**: `MONETIZATION_IMPLEMENTATION_DETAILS.md` セクション5

**よくある問題**:
- レシート検証が失敗する
- プラン情報が更新されない
- 利用回数がリセットされない

---

## 実装の優先順位

### 優先度: 高（最初に実装）

1. **IAPライブラリの導入**
   - パッケージのインストール
   - 設定ファイルの作成

2. **バックエンドAPI連携**
   - APIクライアントの実装
   - レシート検証の実装

### 優先度: 中（次に実装）

3. **プラン表示機能**
   - 現在のプラン表示
   - 利用回数の表示

4. **購入フローの実装**
   - プラン購入画面
   - 購入処理

### 優先度: 低（最後に実装）

5. **UI/UXの改善**
   - 制限超過時の警告表示
   - エラーメッセージの改善

---

## 実装チェックリスト

### 準備段階
- [ ] PLANのPhase3セクションを確認
- [ ] DETAILのストア設定セクションを確認
- [ ] ストア設定（Google Play Console / App Store Connect）の準備
- [ ] テストアカウントの設定

### 実装段階
- [ ] IAPライブラリの導入
- [ ] 設定ファイルの作成（商品IDマッピング）
- [ ] APIクライアントの実装
- [ ] レシート検証の実装
- [ ] プラン表示画面の実装
- [ ] 購入フローの実装
- [ ] エラーハンドリングの実装

### テスト段階
- [ ] サンドボックス環境でのテスト
- [ ] レシート検証のテスト
- [ ] プラン更新のテスト
- [ ] エラーハンドリングのテスト

---

## 推奨される実装順序

### 1. PLANをベースに実装の全体像を把握
- Phase3の実装内容を確認
- 対象ファイルのリストを確認
- 技術スタックを確認

### 2. DETAILを参照しながら実装を進める
- ストア設定の詳細手順を確認
- レシート検証の実装方法を確認
- セキュリティの実装を確認

### 3. 両方を参照しながら実装を進める
- PLANで技術的な詳細を確認
- DETAILで注意事項を確認
- 実装チェックリストを確認

---

## 注意事項

### ストア設定
- **重要**: ストア設定は実装前に完了させる必要があります
- 開発環境ではサンドボックス環境を使用
- 商品IDは慎重に決定（変更が困難）

### レシート検証
- **重要**: レシート検証はバックエンドで実装済み（Phase2）
- モバイルアプリからはレシートデータを送信するのみ
- エラーハンドリングを適切に実装

### セキュリティ
- レシート検証は必ずバックエンドで実行
- プラットフォーム判定を適切に実装
- エラーログを適切に記録

---

## 参考資料

- [MONETIZATION_IMPLEMENTATION_PLAN.md](./MONETIZATION_IMPLEMENTATION_PLAN.md) - 実装プラン
- [MONETIZATION_IMPLEMENTATION_DETAILS.md](./MONETIZATION_IMPLEMENTATION_DETAILS.md) - 詳細注意事項
- [React Native Purchases Documentation](https://www.revenuecat.com/docs/react-native)
- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [App Store In-App Purchase Documentation](https://developer.apple.com/in-app-purchase/)

---

**最終更新日**: 2025年1月29日

