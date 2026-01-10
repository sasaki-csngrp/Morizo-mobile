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
npx expo-doctor
eas build --platform android --profile production-apk

# AABファイル（Google Play Store提出用）
# productionプロファイルを使用（デフォルトでAABを生成）
npx expo-doctor
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
npx expo-doctor
eas build --platform ios --profile production
```

**注意**: iOSビルドには、Apple Developerアカウント（年間$99）が必要です。

#### 両方のプラットフォーム

```bash
npx expo-doctor
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

## アプリストアへの登録と提出

### Google Play Store（Android）

#### 1. Google Play Consoleアカウントの登録

**登録料金**: **$25（一度限りの登録料）**

**必要な情報**:
- Googleアカウント（Gmailアカウント）
- 開発者名（個人または組織名）
- 連絡先情報（メールアドレス、電話番号）
- 支払い情報（クレジットカードまたはデビットカード）
- 開発者の住所情報

**登録手順**:

1. **Google Play Consoleにアクセス**
   - [Google Play Console](https://play.google.com/console/)にアクセス
   - Googleアカウントでログイン

2. **開発者アカウントの作成**
   - 「開発者として登録」をクリック
   - 開発者名を入力（個人名または組織名）
   - 国/地域を選択（変更不可）
   - 利用規約に同意

3. **登録料金の支払い**
   - $25の一度限りの登録料を支払い
   - クレジットカードまたはデビットカードで決済
   - 支払い完了後、即座にアカウントが有効化

4. **アカウント情報の完成**
   - 連絡先情報を入力
   - 開発者の住所を入力
   - 必要に応じて、組織情報を追加

**注意事項**:
- 登録料金は**一度限り**で、アプリの公開数に制限はありません
- アカウントは**即座に有効化**され、すぐにアプリを公開できます
- 開発者名は公開され、変更は困難です（慎重に決定）
- 国/地域は登録時に選択し、後から変更できません

#### 2. アプリの提出手順

1. **AABファイルの準備**: EAS Buildで`--profile production`を使用（デフォルトでAABを生成）
2. **Google Play Console**にアクセス
3. **アプリを作成** → **リリース** → **本番環境**
4. AABファイルをアップロード
5. **ストア掲載情報**を入力：
   - アプリ名、説明、スクリーンショット
   - アイコン、機能グラフィック
   - プライバシーポリシーURL（必須）
   - カテゴリ、コンテンツレーティング
6. **審査提出**（通常1-3営業日で審査完了）

または、EAS Submitを使用：

```bash
eas submit --platform android
```

**提出前に必要な準備**:
- ✅ プライバシーポリシー（Web上で公開されているURLが必要）
- ✅ アプリアイコン（512x512px、PNG形式）
- ✅ スクリーンショット（最低2枚、推奨5-8枚）
- ✅ アプリ説明文（日本語・英語など）
- ✅ 機能グラフィック（オプション、推奨）

### Apple App Store（iOS）

#### 1. Apple Developer Programへの登録

**登録料金**: **年間$99（自動更新）**

**必要な情報**:
- Apple ID（既存のApple IDを使用可能）
- 個人情報または組織情報
   - **個人の場合**: 氏名、住所、電話番号
   - **組織の場合**: 法人名、住所、電話番号、D-U-N-S番号（9桁の識別番号）
- 支払い情報（クレジットカード）
- 税務情報（W-9フォームなど、米国外の場合は該当する税務情報）

**登録手順**:

1. **Apple Developer Programにアクセス**
   - [Apple Developer Program](https://developer.apple.com/programs/)にアクセス
   - Apple IDでログイン（既存のApple IDを使用可能）

2. **登録タイプの選択**
   - **個人（Individual）**: 個人名で登録
   - **組織（Organization）**: 法人名で登録
     - 組織の場合は**D-U-N-S番号**が必要（無料で取得可能）

3. **情報の入力**
   - 個人情報または組織情報を入力
   - 連絡先情報を入力
   - 支払い情報を入力

4. **登録料金の支払い**
   - 年間$99の登録料を支払い
   - クレジットカードで決済

5. **審査プロセス**
   - 登録申請後、**審査プロセス**が開始（通常1-2週間）
   - 個人登録: 比較的早く承認（数日〜1週間程度）
   - 組織登録: D-U-N-S番号の確認などで時間がかかる場合あり（1-2週間程度）
   - 審査完了後、メールで通知

6. **アカウントの有効化**
   - 審査完了後、Apple Developerアカウントが有効化
   - App Store Connectにアクセス可能に

**注意事項**:
- 登録料金は**年間$99**で、毎年自動更新されます
- 審査プロセスがあるため、**登録から有効化まで時間がかかる**可能性があります
- 組織登録の場合、**D-U-N-S番号**の取得が必要（[D-U-N-S番号の取得](https://www.dnb.com/duns-number.html)）
- 登録完了後、**App Store Connect**でアプリを管理できます

**D-U-N-S番号の取得（組織登録の場合）**:
- [D&B公式サイト](https://www.dnb.com/duns-number.html)から無料で取得可能
- 取得には数日〜数週間かかる場合があります
- 既に取得済みの場合は、その番号を使用

#### 2. アプリの提出手順

1. **IPAファイルの準備**: EAS Buildで`--platform ios --profile production`を使用
2. **App Store Connect**にアクセス
   - [App Store Connect](https://appstoreconnect.apple.com/)にアクセス
   - Apple Developerアカウントでログイン

3. **アプリの作成**
   - **マイApp** → **+** → **新しいApp**をクリック
   - アプリ情報を入力：
     - プラットフォーム（iOS）
     - アプリ名（表示名、30文字以内）
     - プライマリ言語
     - バンドルID（`app.json`の`ios.bundleIdentifier`と一致させる）
     - SKU（一意の識別子、内部使用のみ）

4. **アプリ情報の完成**
   - **App情報**タブで基本情報を入力
   - **価格と販売状況**を設定
   - **Appプライバシー**でプライバシー情報を設定（必須）

5. **バージョン情報の入力**
   - **App Store**タブ → **+ バージョンまたはプラットフォーム**
   - バージョン番号を入力
   - スクリーンショットをアップロード（必須）
   - アプリ説明文を入力
   - キーワード、サポートURL、マーケティングURLを入力

6. **ビルドの提出**
   - **ビルド**セクションで、EAS Buildで作成したIPAを選択
   - または、EAS Submitを使用：

```bash
eas submit --platform ios
```

7. **審査提出**
   - すべての情報が完成したら、**審査に提出**をクリック
   - 審査は通常**1-3営業日**で完了（初回は長めに時間がかかる場合あり）

**提出前に必要な準備**:
- ✅ プライバシーポリシー（Web上で公開されているURLが必要）
- ✅ アプリアイコン（1024x1024px、PNG形式、透明度なし）
- ✅ スクリーンショット（各デバイスサイズで最低1枚、推奨5-8枚）
  - iPhone 6.7インチ（1290 x 2796px）
  - iPhone 6.5インチ（1242 x 2688px）
  - iPad Pro 12.9インチ（2048 x 2732px）など
- ✅ アプリ説明文（日本語・英語など）
- ✅ サポートURL（必須）
- ✅ 年齢制限情報
- ✅ Appプライバシー情報（必須、2020年12月以降）

**審査の注意事項**:
- 初回提出時は、審査に**1週間以上**かかる場合があります
- 審査が却下された場合、理由を確認して修正後、再提出が必要です
- 審査基準は厳格で、ガイドラインに準拠している必要があります

## ビルド前のチェックリスト

### アプリ設定
- [ ] **`app.json`の設定が正しいか確認**（`name`、`slug`、`bundleIdentifier`、`package`）
- [ ] **`eas build:configure`を実行する前に`app.json`を修正したか**
- [ ] バージョン番号を更新したか確認
- [ ] 環境変数が本番用に設定されているか確認
- [ ] TypeScriptの型エラーがないか確認（`npx tsc --noEmit`）
- [ ] テストが正常に動作するか確認
- [ ] アイコンとスプラッシュスクリーンが設定されているか確認

### アプリストア登録（初回のみ）
- [ ] **Google Play Consoleアカウントの登録**（$25の一度限りの登録料を支払い済み）
- [ ] **Apple Developer Programへの登録**（年間$99の登録料を支払い、審査完了済み）
  - [ ] 組織登録の場合は、D-U-N-S番号を取得済み

### アプリストア提出準備
- [ ] プライバシーポリシーがWeb上で公開されている（URLが必要）
- [ ] 利用規約が準備されている（推奨）
- [ ] アプリアイコンが準備されている
  - [ ] Android: 512x512px（PNG形式）
  - [ ] iOS: 1024x1024px（PNG形式、透明度なし）
- [ ] スクリーンショットが準備されている（最低2枚、推奨5-8枚）
- [ ] アプリ説明文が準備されている（日本語・英語など）
- [ ] サポートURLが準備されている（iOS必須）
- [ ] Appプライバシー情報が準備されている（iOS必須）

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

### Expo関連
- [EAS Build公式ドキュメント](https://docs.expo.dev/build/introduction/)
- [EAS Submit公式ドキュメント](https://docs.expo.dev/submit/introduction/)
- [Expo Dashboard](https://expo.dev/)

### Google Play Store
- [Google Play Console](https://play.google.com/console/)
- [Google Play Console ヘルプ](https://support.google.com/googleplay/android-developer)
- [Google Play デベロッパー ポリシー](https://play.google.com/about/developer-content-policy/)

### Apple App Store
- [Apple Developer Program](https://developer.apple.com/programs/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [App Store レビューガイドライン](https://developer.apple.com/app-store/review/guidelines/)
- [D-U-N-S番号の取得](https://www.dnb.com/duns-number.html)（組織登録の場合）

---

**最終更新**: 2025年1月27日  
**作成者**: Morizo Mobile開発チーム

