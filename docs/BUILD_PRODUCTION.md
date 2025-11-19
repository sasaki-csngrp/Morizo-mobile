# 本番ビルド手順

## 概要

Morizo Mobileアプリの本番ビルドを行う手順を説明します。Expoプロジェクトでは、**EAS Build（Expo Application Services）**を使用してクラウド上でビルドする方法が推奨されています。

## 前提条件

- Expoアカウント（無料プランで利用可能）
- Node.jsとnpmがインストールされていること
- 本番用の環境変数が準備されていること

## 方法1: EAS Build（推奨）

EAS Buildは、Expoが提供するクラウドビルドサービスです。ローカル環境を構築する必要がなく、簡単に本番ビルドを作成できます。

### 1. app.jsonの設定（重要：最初に実行）

**EAS build:configureを実行する前に、必ず`app.json`を修正してください。**

現在の`app.json`は汎用的な名前（`"app"`）になっているため、本番用に適切な設定に変更する必要があります。

#### app.jsonの修正例

```json
{
  "expo": {
    "name": "Morizo Mobile",           // アプリの表示名
    "slug": "morizo-mobile",           // URLなどで使われる識別子（英数字とハイフンのみ）
    "scheme": "morizo-mobile",         // ディープリンク用スキーム
    "version": "1.0.0",                 // バージョン番号
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "jp.co.csngrp.morizo"  // iOS用バンドルID（一意である必要がある）
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "jp.co.csngrp.morizo",   // Android用パッケージ名（一意である必要がある）
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    }
  }
}
```

#### 設定項目の説明

- **name**: アプリの表示名（ユーザーに表示される名前）
- **slug**: アプリの識別子（URLや内部で使用、英数字とハイフンのみ）
- **ios.bundleIdentifier**: iOS用バンドルID
  - 通常のドメイン（.com）の場合: `com.yourcompany.appname`
  - 日本のドメイン（.co.jp）の場合: `jp.co.yourcompany.appname`（逆ドメイン表記）
- **android.package**: Android用パッケージ名（iOSと同じ命名規則）

**注意**: 
- `bundleIdentifier`と`package`は、他のアプリと重複しない一意の値である必要があります
- `co.jp`ドメインの場合は、`jp.co`から始める逆ドメイン表記を使用します（例: `csngrp.co.jp` → `jp.co.csngrp.morizo`）

### 2. EAS CLIのインストール

```bash
npm install -g eas-cli
```

### 3. EASにログイン

```bash
eas login
```

Expoアカウントでログインします。アカウントがない場合は、`eas register`で新規登録できます。

### 4. ビルド設定の初期化

```bash
eas build:configure
```

このコマンドを実行すると、`eas.json`ファイルが作成されます。

**重要**: この時点で、`app.json`が正しく設定されている必要があります。EASは`app.json`の`name`フィールド（または`package.json`の`name`）を基にプロジェクトを作成します。

### 5. eas.jsonの設定確認

作成された`eas.json`を確認し、必要に応じて編集します：

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 6. app.jsonの最終確認

本番ビルド前に、`app.json`の以下の項目を再度確認します：

- ✅ `name`: アプリ名（表示名）が適切に設定されているか
- ✅ `slug`: アプリの識別子が適切に設定されているか
- ✅ `version`: バージョン番号が正しいか（例: "1.0.0"）
- ✅ `ios.bundleIdentifier`: iOS用バンドルIDが設定されているか（例: "jp.co.csngrp.morizo"）
- ✅ `android.package`: Android用パッケージ名が設定されているか（例: "jp.co.csngrp.morizo"）

### 7. 環境変数の設定（EAS Dashboardで設定）

EAS Dashboardで環境変数を設定します：

1. [Expo Dashboard](https://expo.dev/)にアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables** に移動
4. 以下の環境変数を追加：
   - `EXPO_PUBLIC_SUPABASE_URL`: 本番用Supabase URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: 本番用Supabase匿名キー
   - `EXPO_PUBLIC_API_URL`: 本番用API URL

### 8. 本番ビルドの実行

#### Android用ビルド

**重要**: `production`プロファイルはデフォルトで**AABファイル**を生成します。直接インストールする場合は**APKファイル**が必要です。

```bash
# APKファイル（直接インストール用）
# production-apkプロファイルを使用
eas build --platform android --profile production-apk

# AABファイル（Google Play Store提出用）
# productionプロファイルを使用（デフォルトでAABを生成）
eas build --platform android --profile production
```

**APKとAABの違い**:

| 形式 | 用途 | 直接インストール | 使用例 |
|------|------|----------------|--------|
| **APK** | 直接インストール用 | ✅ 可能 | 実機でのテスト、社内配布 |
| **AAB** | Google Play Store提出用 | ❌ 不可 | ストア公開時のみ |

**注意**: AABファイルは直接Android実機にインストールできません。実機でテストする場合は必ずAPKファイルを使用してください。

#### AABからAPKを抽出する方法（ビルド回数を節約）

既にAABファイルが生成されている場合、**bundletool**を使用してAPKを抽出できます。これにより、新しいビルドを実行せずに済み、ビルド回数を節約できます。

**推奨**: bundletoolは**ホスト環境（Windows）で実行**することを推奨します。Dockerコンテナ内で実行する必要はありません。

**前提条件**:
- Java 11以上がインストールされていること（Windows環境）
- bundletoolがダウンロードされていること

**手順**:

1. **bundletoolのダウンロード（Windows環境）**
   ```powershell
   # PowerShellまたはコマンドプロンプトで実行
   # ブラウザで以下のURLから最新版をダウンロード
   # https://github.com/google/bundletool/releases/latest
   # または、PowerShellでダウンロード
   Invoke-WebRequest -Uri "https://github.com/google/bundletool/releases/latest/download/bundletool-all-1.15.6.jar" -OutFile "bundletool.jar"
   ```

2. **AABファイルをダウンロード（Dockerコンテナ内またはWindows環境）**
   ```bash
   # Dockerコンテナ内で実行
   eas build:download [BUILD_ID]
   
   # または、EAS Dashboardから直接ダウンロード
   # https://expo.dev/ にアクセス → Builds → 該当ビルドをダウンロード
   ```

3. **AABファイルをWindows環境にコピー**
   - Dockerコンテナ内でダウンロードした場合は、ホスト環境にコピー
   - 例: `docker cp container_name:/app/Morizo-mobile/your-app.aab C:\path\to\your-app.aab`

4. **APKセットを生成（Windows環境）**
   ```powershell
   # PowerShellで実行
   java -jar bundletool.jar build-apks `
     --bundle=your-app.aab `
     --output=your-app.apks `
     --mode=universal
   ```

5. **APKファイルを抽出（Windows環境）**
   ```powershell
   # APKセット（.apks）はZIPファイルなので、解凍してAPKを取得
   # PowerShellで解凍
   Expand-Archive -Path your-app.apks -DestinationPath output\
   # output\universal.apk が実際のAPKファイル
   ```

**注意事項**:
- `--mode=universal`を使用すると、すべてのデバイスに対応する単一のAPKが生成されます
- デバイス固有のAPKが必要な場合は、`--mode=default`を使用し、デバイス接続情報を指定する必要があります
- 抽出されたAPKは、AABと同等の機能を持ちますが、ファイルサイズが大きくなる可能性があります

**メリット**:
- ✅ ビルド回数を節約できる（月間制限があるため重要）
- ✅ 既存のAABファイルを活用できる
- ✅ 追加のビルド時間が不要

**デメリット**:
- ⚠️ bundletoolのセットアップが必要
- ⚠️ 手動での操作が必要

#### iOS用ビルド

```bash
eas build --platform ios --profile production
```

**注意**: iOSビルドには、Apple Developerアカウント（年間$99）が必要です。

#### 両方のプラットフォーム

```bash
eas build --platform all --profile production
```

### 9. ビルドの進行状況確認

ビルドが開始されると、以下の方法で進行状況を確認できます：

- ターミナルに表示されるURLから確認
- [Expo Dashboard](https://expo.dev/)の**Builds**セクションから確認

### 10. ビルドファイルのダウンロード

ビルドが完了すると、ダウンロードリンクが提供されます：

```bash
# ビルド一覧を確認
eas build:list

# 特定のビルドをダウンロード
eas build:download [BUILD_ID]
```

## 方法2: ローカルビルド（上級者向け）

ローカル環境でビルドする場合の手順です。より複雑ですが、ビルドの詳細を制御できます。

### Android用ローカルビルド

```bash
# 開発ビルドの準備
npx expo prebuild

# Android Studioでビルド
cd android
./gradlew assembleRelease

# APKファイルの場所
# android/app/build/outputs/apk/release/app-release.apk
```

### iOS用ローカルビルド

```bash
# 開発ビルドの準備
npx expo prebuild

# Xcodeでビルド
# ios/ フォルダをXcodeで開き、Archiveを作成
```

## アプリストアへの提出

### Google Play Store（Android）

1. **AABファイルの準備**: EAS Buildで`--type app-bundle`を使用
2. **Google Play Console**にアクセス
3. **アプリを作成** → **リリース** → **本番環境**
4. AABファイルをアップロード

または、EAS Submitを使用：

```bash
eas submit --platform android
```

### Apple App Store（iOS）

1. **IPAファイルの準備**: EAS BuildでiOSビルドを作成
2. **App Store Connect**にアクセス
3. **App Store** → **+ バージョンまたはプラットフォーム**
4. IPAファイルをアップロード

または、EAS Submitを使用：

```bash
eas submit --platform ios
```

## ビルド前のチェックリスト

- [ ] **`app.json`の設定が正しいか確認**（`name`、`slug`、`bundleIdentifier`、`package`）
- [ ] **`eas build:configure`を実行する前に`app.json`を修正したか**
- [ ] バージョン番号を更新したか確認
- [ ] 環境変数が本番用に設定されているか確認
- [ ] TypeScriptの型エラーがないか確認（`npx tsc --noEmit`）
- [ ] テストが正常に動作するか確認
- [ ] アイコンとスプラッシュスクリーンが設定されているか確認
- [ ] プライバシーポリシーと利用規約が準備されているか確認（アプリストア提出時）

## トラブルシューティング

### ビルドエラーが発生する場合

1. **ログを確認**: EAS Dashboardのビルドログを確認
2. **依存関係の確認**: `package.json`の依存関係が正しいか確認
3. **環境変数の確認**: EAS Dashboardの環境変数設定を確認
4. **app.jsonの確認**: 設定に誤りがないか確認

### iOSビルドで証明書エラーが発生する場合

1. **Apple Developerアカウント**: 有効なアカウントか確認
2. **証明書の設定**: EASが自動的に証明書を管理しますが、手動設定が必要な場合もあります

### Androidビルドでパッケージ名エラーが発生する場合

1. **app.jsonの確認**: `android.package`が正しく設定されているか確認
2. **一意性の確認**: パッケージ名が他のアプリと重複していないか確認

## 参考リンク

- [EAS Build公式ドキュメント](https://docs.expo.dev/build/introduction/)
- [EAS Submit公式ドキュメント](https://docs.expo.dev/submit/introduction/)
- [Expo Dashboard](https://expo.dev/)

---

**最終更新**: 2025年1月27日  
**作成者**: Morizo Mobile開発チーム

