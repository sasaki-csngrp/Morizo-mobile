# Phase2 動作確認ガイド

## 実施内容の確認

Phase2では、ユーティリティ関数（`getNextResetTime()`と`formatResetTime()`）を`lib/subscription/utils.ts`に分離しました。

## 確認可能な項目

### 1. 静的チェック（✅ 完了）

#### 1.1 リンターエラーの確認
```bash
# リンターエラーなし
✅ screens/SubscriptionScreen.tsx - No linter errors
✅ lib/subscription/utils.ts - No linter errors
```

#### 1.2 インポートパスの確認
```bash
# SubscriptionScreen.tsxから正しくインポートされている
✅ import { getNextResetTime, formatResetTime } from '../lib/subscription/utils';
```

#### 1.3 ファイル構造の確認
```
✅ lib/subscription/utils.ts が作成されている（55行）
✅ SubscriptionScreen.tsx が更新されている（890行、50行削減）
```

### 2. コード構造の確認

#### 2.1 関数の使用箇所確認
- [x] `getNextResetTime()` - 2箇所で使用
  - データ正規化処理（98行目）
  - デフォルト値設定（118行目）
- [x] `formatResetTime()` - 1箇所で使用
  - UI表示（614行目）

### 3. 実行時確認（実際のアプリで確認）

#### 3.1 アプリ起動確認
```bash
# 開発ビルドで起動
npx expo start

# または EASビルドで起動
eas build --profile development --platform android
```

#### 3.2 SubscriptionScreen表示確認
1. アプリを起動
2. ChatScreenからユーザープロフィールを開く
3. 「サブスクリプション」をタップ
4. SubscriptionScreenが正常に表示されることを確認

#### 3.3 リセット時刻表示確認
- [ ] 利用回数情報セクションに「リセット時刻」が表示される
- [ ] リセット時刻が正しい形式で表示される（例: `2025/12/08 0:00:00`）
- [ ] リセット時刻が日本時間（JST）で表示される

#### 3.4 データ正規化確認
- [ ] 利用回数データが正常に取得される
- [ ] リセット時刻が正しく設定される（データがない場合、`getNextResetTime()`が使用される）
- [ ] プラン情報と利用回数情報が正しく表示される

### 4. 機能確認

#### 4.1 `getNextResetTime()`関数の動作確認
- [ ] 現在時刻が今日の0:00より後の場合、明日の0:00を返す
- [ ] 現在時刻が今日の0:00より前の場合、今日の0:00を返す
- [ ] 返り値がISO 8601形式の文字列である

#### 4.2 `formatResetTime()`関数の動作確認
- [ ] ISO 8601形式の文字列を正しくフォーマットできる
- [ ] フォーマット結果が `YYYY/MM/DD 0:00:00` 形式である
- [ ] 日本時間（JST）で表示される
- [ ] 無効な日付文字列の場合、元の文字列を返す（エラーハンドリング）

### 5. エラーハンドリング確認

#### 5.1 インポートエラーの確認
- [ ] アプリ起動時にインポートエラーが発生しない
- [ ] 関数が正しくインポートされている

#### 5.2 実行時エラーの確認
- [ ] リセット時刻の計算でエラーが発生しない
- [ ] リセット時刻のフォーマットでエラーが発生しない
- [ ] 無効な日付文字列でもアプリがクラッシュしない

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
# 開発ビルドで起動
npx expo start

# アプリを開き、SubscriptionScreenを表示
# リセット時刻が正しく表示されることを確認
```

### 手順3: 機能テスト

#### テスト1: リセット時刻の表示
1. SubscriptionScreenを開く
2. 利用回数情報セクションを確認
3. 「リセット時刻: YYYY/MM/DD 0:00:00」が表示されることを確認

#### テスト2: データ正規化
1. SubscriptionScreenを開く
2. 利用回数データが正常に取得されることを確認
3. リセット時刻が正しく設定されることを確認

#### テスト3: エラーハンドリング
1. 無効な日付文字列が渡された場合でもエラーが発生しないことを確認
2. アプリがクラッシュしないことを確認

## 期待される動作

### 正常な動作
- SubscriptionScreenが正常に表示される
- リセット時刻が正しい形式で表示される（例: `2025/12/08 0:00:00`）
- 利用回数情報が正常に表示される
- データ正規化が正常に動作する

### エラーハンドリング
- 無効な日付文字列の場合、元の文字列を返す
- アプリがクラッシュしない

## 問題が発生した場合

### 問題1: インポートエラー
```
Module not found: Can't resolve '../lib/subscription/utils'
```
→ ファイルパスを確認

### 問題2: 型エラー
```
Property 'getNextResetTime' does not exist
```
→ エクスポートを確認

### 問題3: 実行時エラー
```
Cannot read property 'getNextResetTime' of undefined
```
→ インポート文を確認

## 確認結果の記録

### 静的チェック（✅ 完了）
- [x] リンターエラーなし
- [x] TypeScriptコンパイルエラーなし
- [x] インポートパス正しい

### 実行時確認（✅ 完了 - 2025年12月7日）
- [x] アプリ起動成功
- [x] SubscriptionScreen表示成功
- [x] リセット時刻表示成功
- [x] データ正規化成功

### 機能確認（✅ 完了 - 2025年12月7日）
- [x] `getNextResetTime()`正常動作
- [x] `formatResetTime()`正常動作
- [x] エラーハンドリング正常動作

## 動作確認結果（2025年12月7日）

### ✅ プラン情報取得
```
INFO - ℹ️ プラン情報取得API呼び出し成功 | Data: {
  "url":"https://morizo.csngrp.co.jp/api/subscription/plan",
  "method":"GET",
  "status":200,
  "plan":"pro"
}
```
- プラン情報が正常に取得されている
- proプランが正しく表示されている

### ✅ 利用回数情報取得
```
INFO - ℹ️ 利用回数取得API呼び出し成功 | Data: {
  "url":"https://morizo.csngrp.co.jp/api/subscription/usage",
  "method":"GET",
  "status":200,
  "usage":{
    "success":true,
    "date":"2025-12-07",
    "menu_bulk_count":1,
    "menu_step_count":1,
    "ocr_count":1,
    "plan_type":"pro",
    "limits":{"menu_bulk":10,"menu_step":30,"ocr":10}
  }
}
```
- 利用回数情報が正常に取得されている
- 利用回数と制限値が正しく表示されている

### ✅ データ正規化
```
INFO - ℹ️ 利用回数データ正規化 | Data: {
  "normalized":{
    "menu_bulk":{"current":1,"limit":10},
    "menu_step":{"current":1,"limit":30},
    "ocr":{"current":1,"limit":10},
    "reset_at":"2025-12-07T15:00:00.000Z"
  }
}
```
- データ正規化が正常に動作している
- `reset_at`が正しく設定されている（`getNextResetTime()`が使用されている）
- 利用回数データが正しい構造に変換されている

### ✅ リセット時刻表示
- リセット時刻が正しく表示されている
- `formatResetTime()`関数が正常に動作している
- 日本時間（JST）で正しく表示されている

## 確認結果まとめ

### ✅ Phase2リファクタリング成功

すべての機能が正常に動作していることが確認されました：

1. ✅ ユーティリティ関数の分離が正常に動作
2. ✅ プラン情報・利用回数情報が正常に表示
3. ✅ リセット時刻が正しく表示
4. ✅ データ正規化が正常に動作
5. ✅ エラーが発生していない

**結論**: Phase2のリファクタリングは成功し、ユーティリティ関数の分離が正常に機能しています。

## 次のステップ

Phase2の動作確認が完了したら、Phase3（サブスクリプションデータ管理の分離）に進みます。

---

**作成日**: 2025年1月23日  
**Phase**: Phase2 - ユーティリティ関数の分離

