# Windows環境でのadbインストールとAndroidデバッグ環境セットアップ

## 概要

Expo Goで動いていたアプリがEASビルドで動かない問題を解決するため、Windowsホスト環境にadb（Android Debug Bridge）をインストールしてローカルデバッグ環境を構築します。

**目的**: 無料枠のビルド回数制限がある中で、トライアンドエラーを避けるためにローカルでデバッグできる環境を構築する

## 前提条件

- Windows 10/11 がインストールされていること
- Android実機が利用可能であること
- USBケーブルでAndroid実機をPCに接続できること
- 管理者権限でコマンドを実行できること

## セットアップ手順

### 1. Android SDK Platform Toolsのインストール

#### 方法1: Android Studio経由（推奨）

1. **Android Studioのダウンロード**
   - [Android Studio公式サイト](https://developer.android.com/studio)からダウンロード
   - インストーラーを実行してインストール

2. **SDK Platform Toolsのインストール**
   - Android Studioを起動
   - **More Actions** → **SDK Manager** を開く
   - **SDK Tools** タブを選択
   - **Android SDK Platform-Tools** にチェックを入れる
   - **Apply** をクリックしてインストール

3. **インストール場所の確認**
   - デフォルトのインストール場所: `C:\Users\<ユーザー名>\AppData\Local\Android\Sdk\platform-tools`
   - または、SDK Managerの**SDK Path**で確認可能

#### 方法2: スタンドアロン版のダウンロード（軽量）

1. **Platform Toolsのダウンロード**
   - [Android Platform Tools公式サイト](https://developer.android.com/tools/releases/platform-tools)からダウンロード
   - または、直接ダウンロード: [platform-tools-latest-windows.zip](https://dl.google.com/android/repository/platform-tools-latest-windows.zip)

2. **解凍と配置**
   - ダウンロードしたZIPファイルを解凍
   - 解凍したフォルダ（`platform-tools`）を任意の場所に配置
   - 推奨場所: `C:\Android\platform-tools`

### 2. 環境変数PATHの設定

1. **システム環境変数の設定**
   - Windowsキー + R を押して「ファイル名を指定して実行」を開く
   - `sysdm.cpl` と入力してEnter
   - **詳細設定** タブ → **環境変数** をクリック

2. **PATH変数の編集**
   - **システム環境変数** セクションで **Path** を選択
   - **編集** をクリック
   - **新規** をクリック
   - 以下のいずれかのパスを追加:
     - Android Studio経由の場合: `C:\Users\<ユーザー名>\AppData\Local\Android\Sdk\platform-tools`
     - スタンドアロン版の場合: `C:\Android\platform-tools`（実際の配置場所に合わせて変更）
   - **OK** をクリックしてすべてのダイアログを閉じる

3. **環境変数の反映**
   - 既に開いているコマンドプロンプトやPowerShellを閉じる
   - 新しいコマンドプロンプトまたはPowerShellを開く（環境変数が反映される）

### 3. adbの動作確認

1. **コマンドプロンプトまたはPowerShellを開く**
   - Windowsキー + R → `cmd` または `powershell` と入力

2. **adbのバージョン確認**
   ```powershell
   adb version
   ```
   - 正常にインストールされていれば、バージョン情報が表示されます
   - 例: `Android Debug Bridge version 1.0.41`

3. **adbのパス確認**
   ```powershell
   where adb
   ```
   - adbのインストール場所が表示されます

### 4. Android実機のUSBデバッグ設定

1. **開発者オプションの有効化**
   - Android実機の **設定** → **端末情報**（または **デバイス情報**）を開く
   - **ビルド番号** を7回連続でタップ
   - 「開発者になりました」というメッセージが表示されます

2. **USBデバッグの有効化**
   - **設定** → **開発者向けオプション**（または **システム** → **開発者向けオプション**）を開く
   - **USBデバッグ** を有効にする

3. **USB接続モードの確認**
   - USBケーブルでAndroid実機をPCに接続
   - 実機に表示される通知で **ファイル転送** または **MTP** モードを選択

### 5. 実機接続の確認

1. **adbデバイス一覧の確認**
   ```powershell
   adb devices
   ```
   - 正常に接続されていれば、デバイスIDが表示されます
   - 例: `List of devices attached` の下に `XXXXXXXXX    device` と表示

2. **接続されない場合の対処**
   - **USBドライバーのインストール**: 実機メーカーの公式サイトからUSBドライバーをダウンロードしてインストール
   - **adbサーバーの再起動**:
     ```powershell
     adb kill-server
     adb start-server
     adb devices
     ```
   - **USBケーブルの確認**: データ転送対応のUSBケーブルを使用（充電専用ケーブルでは動作しない場合があります）
   - **実機での確認**: 実機に「USBデバッグを許可しますか？」というダイアログが表示されたら、**許可**を選択し、**常にこのコンピューターから許可する**にチェック

### 6. ログの確認方法

1. **リアルタイムログの表示**
   ```powershell
   adb logcat
   ```
   - アプリの動作に応じてリアルタイムでログが表示されます
   - 停止するには `Ctrl + C`

2. **フィルター付きログの表示**
   ```powershell
   # React Native/Expoアプリのログのみ表示
   adb logcat | findstr "ReactNative\|Expo\|JS"

   # エラーログのみ表示
   adb logcat *:E

   # 特定のタグのログのみ表示
   adb logcat -s "YourTag"
   ```

3. **ログの保存**
   ```powershell
   # ログをファイルに保存
   adb logcat > logcat.txt

   # フィルター付きログを保存
   adb logcat | findstr "ReactNative\|Expo\|JS" > filtered_logcat.txt
   ```

4. **ログのクリア**
   ```powershell
   adb logcat -c
   ```

### 7. APKファイルのインストール

1. **APKファイルのインストール**
   ```powershell
   adb install path\to\your-app.apk
   ```
   - 例: `adb install C:\Users\YourName\Downloads\app.apk`

2. **既存アプリの上書きインストール**
   ```powershell
   adb install -r path\to\your-app.apk
   ```
   - `-r` オプションで既存のアプリを上書きインストール

3. **アプリのアンインストール**
   ```powershell
   adb uninstall jp.co.csngrp.morizo
   ```
   - パッケージ名（`app.json`の`android.package`で確認可能）を指定

### 8. 便利なadbコマンド

1. **デバイス情報の確認**
   ```powershell
   # デバイス情報
   adb shell getprop ro.product.model
   adb shell getprop ro.build.version.release

   # 詳細情報
   adb shell getprop
   ```

2. **スクリーンショットの取得**
   ```powershell
   adb shell screencap -p /sdcard/screenshot.png
   adb pull /sdcard/screenshot.png
   ```

3. **ファイルの転送**
   ```powershell
   # PCから実機へ
   adb push local_file.txt /sdcard/

   # 実機からPCへ
   adb pull /sdcard/file.txt
   ```

4. **アプリの起動**
   ```powershell
   adb shell am start -n jp.co.csngrp.morizo/.MainActivity
   ```

5. **アプリの停止**
   ```powershell
   adb shell am force-stop jp.co.csngrp.morizo
   ```

## EASビルドAPKのデバッグ手順

### 1. APKファイルの取得

1. **EAS Dashboardからダウンロード**
   - [Expo Dashboard](https://expo.dev/)にアクセス
   - プロジェクトを選択 → **Builds** を開く
   - 該当ビルドを選択 → **Download** をクリック

2. **EAS CLIでダウンロード**
   ```bash
   # Dockerコンテナ内で実行
   eas build:download [BUILD_ID]
   ```

### 2. APKのインストールとテスト

1. **APKのインストール**
   ```powershell
   adb install -r path\to\downloaded-app.apk
   ```

2. **アプリの起動と動作確認**
   - 実機でアプリを起動
   - 問題が発生したら、別のターミナルでログを確認:
     ```powershell
     adb logcat | findstr "ReactNative\|Expo\|JS\|Error\|Exception"
     ```

3. **エラーログの収集**
   ```powershell
   # エラーログをファイルに保存
   adb logcat *:E > error_log.txt

   # すべてのログを保存（後で分析）
   adb logcat > full_log.txt
   ```

### 3. よくある問題と対処法

#### 問題1: "INSTALL_FAILED_INSUFFICIENT_STORAGE"
**原因**: 実機のストレージ容量不足

**対処法**:
```powershell
# ストレージ容量の確認
adb shell df -h

# 不要なアプリやファイルを削除して容量を確保
```

#### 問題2: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
**原因**: 既存のアプリと署名が異なる

**対処法**:
```powershell
# 既存アプリをアンインストール
adb uninstall jp.co.csngrp.morizo

# 再度インストール
adb install path\to\your-app.apk
```

#### 問題3: "INSTALL_PARSE_FAILED_NO_CERTIFICATES"
**原因**: APKファイルが破損している、または署名されていない

**対処法**:
- APKファイルを再ダウンロード
- ビルドが正常に完了したか確認

#### 問題4: アプリが起動しない
**原因**: クラッシュ、環境変数の問題、API接続エラーなど

**対処法**:
```powershell
# クラッシュログの確認
adb logcat | findstr "FATAL\|AndroidRuntime\|Exception"

# アプリのプロセス確認
adb shell ps | findstr "morizo"

# アプリの再起動
adb shell am force-stop jp.co.csngrp.morizo
adb shell am start -n jp.co.csngrp.morizo/.MainActivity
```

## トラブルシューティング

### adbが認識されない

1. **環境変数PATHの確認**
   ```powershell
   echo %PATH%
   # または PowerShellの場合
   $env:PATH
   ```

2. **adbの直接実行**
   ```powershell
   # フルパスで実行してみる
   C:\Users\<ユーザー名>\AppData\Local\Android\Sdk\platform-tools\adb.exe version
   ```

3. **再起動**
   - PCを再起動して環境変数を確実に反映

### デバイスが認識されない

1. **USBドライバーの確認**
   - 実機メーカーの公式サイトからUSBドライバーをダウンロード
   - 例: Samsung → Samsung USB Driver、Google → Google USB Driver

2. **adbサーバーの再起動**
   ```powershell
   adb kill-server
   adb start-server
   adb devices
   ```

3. **USB接続モードの確認**
   - 実機で **ファイル転送** または **MTP** モードを選択
   - **PTP** モードでも動作する場合があります

4. **別のUSBポートを試す**
   - USB 2.0ポートとUSB 3.0ポートで試す
   - 別のUSBケーブルを試す

### ログが表示されない

1. **ログバッファの確認**
   ```powershell
   # ログバッファサイズの確認
   adb logcat -g

   # ログバッファサイズの設定（必要に応じて）
   adb logcat -G 16M
   ```

2. **フィルターの確認**
   - フィルターが厳しすぎる可能性があります
   - フィルターなしで実行: `adb logcat`

## 参考リンク

- [Android Platform Tools公式ドキュメント](https://developer.android.com/tools/releases/platform-tools)
- [adb公式ドキュメント](https://developer.android.com/tools/adb)
- [Android Studioダウンロード](https://developer.android.com/studio)
- [Expo EAS Buildドキュメント](https://docs.expo.dev/build/introduction/)

## 次のステップ

1. **ログの分析**: 収集したログを分析して問題を特定
2. **コードの修正**: 問題を特定したら、コードを修正
3. **再ビルド**: 修正後、EASで再ビルド（必要に応じて）
4. **再テスト**: 再ビルドしたAPKをインストールして動作確認

---

**最終更新**: 2025年1月27日  
**作成者**: AIエージェント協働チーム

