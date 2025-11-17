# 本番ビルド手順

## 概要

Morizo Mobileアプリの本番ビルドを行う手順を説明します。Expoプロジェクトでは、**EAS Build（Expo Application Services）**を使用してクラウド上でビルドする方法が推奨されています。

## 前提条件

- Expoアカウント（無料プランで利用可能）
- Node.jsとnpmがインストールされていること
- 本番用の環境変数が準備されていること

## 方法1: EAS Build（推奨）

EAS Buildは、Expoが提供するクラウドビルドサービスです。ローカル環境を構築する必要がなく、簡単に本番ビルドを作成できます。

### 1. EAS CLIのインストール

```bash
npm install -g eas-cli
```

### 2. EASにログイン

```bash
eas login
```

Expoアカウントでログインします。アカウントがない場合は、`eas register`で新規登録できます。

### 3. ビルド設定の初期化

```bash
eas build:configure
```

このコマンドを実行すると、`eas.json`ファイルが作成されます。

### 4. eas.jsonの設定確認

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

### 5. app.jsonの設定確認

本番ビルド前に、`app.json`の以下の項目を確認・更新します：

- `name`: アプリ名（表示名）
- `slug`: アプリの識別子
- `version`: バージョン番号（例: "1.0.0"）
- `ios.bundleIdentifier`: iOS用バンドルID（例: "com.yourcompany.morizo"）
- `android.package`: Android用パッケージ名（例: "com.yourcompany.morizo"）

### 6. 環境変数の設定

EAS Dashboardで環境変数を設定します：

1. [Expo Dashboard](https://expo.dev/)にアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables** に移動
4. 以下の環境変数を追加：
   - `EXPO_PUBLIC_SUPABASE_URL`: 本番用Supabase URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: 本番用Supabase匿名キー
   - `EXPO_PUBLIC_API_URL`: 本番用API URL

### 7. 本番ビルドの実行

#### Android用ビルド

```bash
# APKファイル（直接インストール用）
eas build --platform android --profile production

# AABファイル（Google Play Store提出用）
eas build --platform android --profile production --type app-bundle
```

#### iOS用ビルド

```bash
eas build --platform ios --profile production
```

**注意**: iOSビルドには、Apple Developerアカウント（年間$99）が必要です。

#### 両方のプラットフォーム

```bash
eas build --platform all --profile production
```

### 8. ビルドの進行状況確認

ビルドが開始されると、以下の方法で進行状況を確認できます：

- ターミナルに表示されるURLから確認
- [Expo Dashboard](https://expo.dev/)の**Builds**セクションから確認

### 9. ビルドファイルのダウンロード

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

- [ ] `app.json`の設定が正しいか確認
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

