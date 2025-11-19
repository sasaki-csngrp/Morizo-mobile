# EASビルドアプリのクラッシュデバッグガイド

## 概要

このドキュメントでは、EASビルドしたAndroidアプリがクラッシュする問題をデバッグする方法を説明します。

## クラッシュログの分析

### 実際に発生した問題（2025年11月19日）

**根本原因**: `Error: Cannot find native module 'ExpoWebBrowser'`

ログから確認されたエラー：
```
[runtime not ready]: Error: Cannot find native module 'ExpoWebBrowser'
```

**原因**:
- `expo-web-browser` が `package.json` に含まれているが、`app.json` の `plugins` 配列に追加されていなかった
- EASビルドでは、ネイティブモジュールを使用する場合、`app.json` の `plugins` に明示的に追加する必要がある

**解決策**:
`app.json` の `plugins` 配列に `expo-web-browser` を追加：

```json
{
  "expo": {
    "plugins": [
      ["expo-splash-screen", { ... }],
      "expo-web-browser"
    ]
  }
}
```

### 一般的なクラッシュログの分析

提供された `adb logcat` の出力から、以下の重要な情報が確認できます：

1. **クラッシュの種類**: `Fatal signal 6 (SIGABRT)`
   - これは異常終了を示すシグナルです
   - JavaScriptエンジン（Hermes）のスレッド `mqt_v_js` で発生しています

2. **関連ライブラリ**:
   - `libreactnative.so` - React Nativeのコアライブラリ
   - `libhermes.so` - Hermes JavaScriptエンジン
   - `libexpo-av.so` - Expo AVモジュール（音声関連）
   - `libexpo-modules-core.so` - Expo Modules Core

3. **エラーハンドラー**:
   - `facebook::react::JsErrorHandler::handleError` が呼ばれている
   - これは、JavaScript側でエラーが発生し、ネイティブ側でクラッシュを引き起こしている可能性が高い

## より詳細なログの取得方法

### 1. JavaScriptエラーログを含む完全なログ

```powershell
# すべてのログを取得（JavaScriptエラーを含む）
adb logcat -v time > full_log.txt

# アプリを起動してクラッシュさせる
# Ctrl+C でログ収集を停止
```

### 2. React NativeとJavaScriptエラーのみをフィルター

```powershell
# React Native、JavaScript、エラーログのみ
adb logcat | findstr /i "ReactNative JS Error Exception FATAL morizo"
```

### 3. クラッシュ直後のスタックトレースを取得

```powershell
# クラッシュログとスタックトレースを取得
adb logcat -v time *:E AndroidRuntime:E > crash_log.txt

# アプリを起動してクラッシュさせる
# Ctrl+C でログ収集を停止
```

### 4. ネイティブクラッシュの詳細情報

```powershell
# ネイティブクラッシュの詳細なスタックトレース
adb logcat -v time | findstr /i "FATAL signal tombstone"
```

## よくある原因と対処法

### 1. 環境変数の未設定

**症状**: アプリ起動時にクラッシュ

**確認方法**:
```powershell
# アプリ起動時のログを確認
adb logcat -c
adb logcat | findstr /i "EXPO_PUBLIC SUPABASE API_URL"
```

**対処法**:
- EASビルド時に環境変数が正しく設定されているか確認
- `eas.json` の `env` セクションを確認
- `.env` ファイルの内容を確認

### 2. React Native新アーキテクチャの問題

**症状**: `newArchEnabled: true` が原因でクラッシュ

**確認方法**:
- `app.json` で `"newArchEnabled": true` が設定されているか確認

**対処法**:
- 一時的に `"newArchEnabled": false` に変更して再ビルド
- または、新アーキテクチャ対応の依存関係を更新

### 3. ネイティブモジュールの互換性問題

**症状**: 特定のネイティブモジュール（例: `expo-av`）でクラッシュ

**確認方法**:
- ログに `libexpo-av.so` や `libexpo-modules-core.so` が含まれているか確認

**対処法**:
- 使用しているExpoモジュールのバージョンを確認
- `package.json` の依存関係を更新
- 問題のあるモジュールを一時的に無効化してテスト

### 4. JavaScriptエラーが原因のクラッシュ

**症状**: JavaScriptエラーがネイティブ側でクラッシュを引き起こす

**確認方法**:
```powershell
# JavaScriptエラーログを確認
adb logcat | findstr /i "JS Error Exception"
```

**対処法**:
- JavaScriptコードのエラーハンドリングを強化
- Error Boundaryを実装
- 初期化時のエラーを確認

### 5. メモリ不足

**症状**: メモリ不足によるクラッシュ

**確認方法**:
```powershell
# メモリ使用状況を確認
adb shell dumpsys meminfo jp.co.csngrp.morizo
```

**対処法**:
- メモリリークを修正
- 画像やデータのキャッシュを最適化
- 不要なデータをクリーンアップ

### 6. ネイティブモジュールが見つからない（実際のケース）

**症状**: `Error: Cannot find native module 'ExpoWebBrowser'` などのエラー

**原因**:
- Expoモジュールが `package.json` に含まれているが、`app.json` の `plugins` に追加されていない
- EASビルドでは、ネイティブモジュールを使用する場合、`app.json` の `plugins` に明示的に追加する必要がある
- **依存関係のバージョン不一致や重複**（重要：これが主な原因の可能性が高い）

**対処法**:
1. **まず依存関係を修正**（最重要）:
   ```bash
   # expo-doctorで問題を確認
   npx expo-doctor
   
   # 依存関係を自動修正
   npx expo install --check
   ```
   
   詳細は [依存関係の修正手順](./DEPENDENCY_FIX.md) を参照

2. 使用しているExpoモジュールを確認
3. `app.json` の `plugins` 配列に追加
4. EASビルドを再実行

**例**:
```json
{
  "expo": {
    "plugins": [
      "expo-web-browser",
      "expo-av",
      "expo-image-picker"
    ]
  }
}
```

**注意**: すべてのExpoモジュールがプラグイン設定を必要とするわけではありません。エラーが発生した場合のみ追加してください。

### 7. 依存関係のバージョン不一致と重複（実際のケース）

**症状**: 
- `npx expo-doctor` で重複依存関係やバージョン不一致が検出される
- `Cannot find native module` エラーが発生する

**原因**:
- Expo SDK 54に合わせたバージョンが使用されていない
- 複数のバージョンのネイティブモジュールがインストールされている
- ネイティブビルドでは1つのバージョンのみ許可されるため、ビルドエラーが発生

**対処法**:
1. `npx expo-doctor` で問題を確認（注意: `npx expo doctor` ではなく `npx expo-doctor` を使用）
2. `npx expo install --check` で依存関係を自動修正
3. 必要に応じて手動で `package.json` を修正
4. `node_modules` を削除して再インストール

詳細は [依存関係の修正手順](./DEPENDENCY_FIX.md) を参照

## デバッグ手順

### ステップ1: ログの収集

```powershell
# ログバッファをクリア
adb logcat -c

# 完全なログを収集（別のターミナルで実行）
adb logcat -v time > debug_log.txt

# アプリを起動してクラッシュさせる
adb shell am start -n jp.co.csngrp.morizo/.MainActivity

# クラッシュ後、Ctrl+C でログ収集を停止
```

### ステップ2: ログの分析

収集したログから以下を確認：

1. **クラッシュのタイミング**: アプリ起動直後か、特定の操作後か
2. **エラーメッセージ**: JavaScriptエラーやネイティブエラー
3. **スタックトレース**: クラッシュが発生したコードの場所
4. **環境変数**: 必要な環境変数が設定されているか

### ステップ3: 問題の特定

ログから以下の情報を特定：

- **エラーの種類**: JavaScriptエラー、ネイティブクラッシュ、メモリ不足など
- **発生箇所**: どのモジュールやコンポーネントで発生しているか
- **再現条件**: 特定の操作や状態で発生するか

### ステップ4: 修正と再テスト

1. 問題を特定したら、コードを修正
2. 修正後、EASで再ビルド（必要に応じて）
3. 再ビルドしたAPKをインストールしてテスト
4. ログを再確認して問題が解決したか確認

## 推奨されるログ収集コマンド

### 完全なデバッグログ

```powershell
# すべてのログを時間付きで収集
adb logcat -v time > full_debug_log.txt
```

### エラーログのみ

```powershell
# エラーレベルのログのみ
adb logcat *:E > error_log.txt
```

### React Native関連のログ

```powershell
# React Native、JavaScript、Expo関連のログ
adb logcat | findstr /i "ReactNative JS Expo morizo" > rn_log.txt
```

### クラッシュログ

```powershell
# クラッシュ関連のログ
adb logcat | findstr /i "FATAL signal AndroidRuntime Exception" > crash_log.txt
```

## 次のステップ

1. **詳細なログを収集**: 上記のコマンドでより詳細なログを取得
2. **ログを分析**: クラッシュの原因を特定
3. **修正を実装**: 問題を修正
4. **再テスト**: 修正後、再ビルドしてテスト

## 参考リンク

- [React Native デバッグガイド](https://reactnative.dev/docs/debugging)
- [Expo デバッグガイド](https://docs.expo.dev/guides/debugging/)
- [Android logcat ドキュメント](https://developer.android.com/studio/command-line/logcat)

---

**最終更新**: 2025年1月27日  
**作成者**: AIエージェント協働チーム

