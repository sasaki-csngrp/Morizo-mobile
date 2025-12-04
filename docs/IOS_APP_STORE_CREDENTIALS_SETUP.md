# iOS App Store Credentials 設定手順

## 概要

RevenueCatがApp Store Connectと連携するために必要な認証情報の設定手順です。iOSアプリでは、以下の3種類の認証情報が必要です：

1. **App Store Connect API Key**（必須）: 製品情報のインポートと管理に使用
2. **In-App Purchase Key**（推奨）: StoreKit 2を使用する場合に必要
3. **App-Specific Shared Secret**（オプション）: StoreKit 1の互換性のために使用（非推奨）

**所要時間**: 約30分〜1時間

**作成日**: 2025年1月29日  
**バージョン**: 1.0

---

## 前提条件

- App Store Connectアカウント
- Apple Developer Programへの登録が完了していること（年間$99）
- 対象のiOSアプリがApp Store Connectに登録されていること
- アプリのBundle ID: `jp.co.csngrp.morizo`
- RevenueCatアカウント

---

## 全体の流れ

1. **Part 1**: App Store Connect API Keyの作成と設定（必須）
2. **Part 2**: In-App Purchase Keyの作成と設定（推奨 - StoreKit 2用）
3. **Part 3**: App-Specific Shared Secretの作成と設定（オプション - StoreKit 1用）
4. **Part 4**: RevenueCatでの認証情報の設定と検証

---

## Part 1: App Store Connect API Keyの作成と設定（必須）

### 1.0 既存のAPIキーの確認（重要）

**既存のキーがある場合の確認事項**:

EAS Submitやその他のツールで既にApp Store Connect API Keyを作成している場合、そのキーを再利用できる可能性があります。

**確認手順**:

1. **App Store Connectにアクセス**
   - [App Store Connect](https://appstoreconnect.apple.com/)にログイン
   - 「**ユーザーとアクセス**」→ 「**統合**」→ 「**App Store Connect API**」に移動

2. **既存のキーを確認**
   - 既存のキーが表示されている場合、以下の情報を確認：
     - **アクセスレベル**: 「Admin」または「App Manager」以上であれば使用可能
     - **キーID**: コピーして保存
     - **Issuer ID**: コピーして保存（ページ上部に表示）

3. **.p8ファイルの確認**
   - **重要**: .p8ファイルは一度しかダウンロードできません
   - EAS Submit設定時にダウンロードした.p8ファイルが保存されているか確認
   - 保存場所の例：
     - EAS設定フォルダ
     - ダウンロードフォルダ
     - プロジェクトの設定ファイル

**既存のキーを使用できる場合**:
- ✅ アクセスレベルが「Admin」または「App Manager」以上
- ✅ .p8ファイルが保存されている
- → この場合、新しいキーを作成する必要はありません。既存のキーを使用してください。

**既存のキーを使用できない場合**:
- ❌ .p8ファイルが保存されていない
- ❌ アクセスレベルが「App Manager」未満
- → この場合、新しいキーを作成する必要があります（下記の1.1を参照）。

**注意**: 既存のキーを使用する場合でも、RevenueCatに設定する際には、Issuer ID、Key ID、.p8ファイル、Vendor番号が必要です。

---

### 1.1 App Store Connect API Keyの生成（新規作成の場合）

**場所**: App Store Connect

**手順**:

1. **App Store Connectにアクセス**
   - [App Store Connect](https://appstoreconnect.apple.com/)にログイン
   - Apple Developer Programのアカウントでログイン

2. **ユーザーとアクセスページに移動**
   - 右上のユーザーアイコンをクリック
   - 「**ユーザーとアクセス**」を選択
   - または、直接[ユーザーとアクセスページ](https://appstoreconnect.apple.com/access/users)にアクセス

3. **統合セクションに移動**
   - 左側のメニューから「**統合**」を選択
   - 「**App Store Connect API**」をクリック

4. **APIキーを生成**
   - 「**App Store Connect APIキーを生成**」ボタンをクリック
   - または、「**+**」ボタンをクリック

5. **キー情報を入力**
   - **名前**: `RevenueCat API Key`（任意の名前でも可）
   - **アクセスレベル**: 「**App Manager**」を選択
     - **重要**: 「App Manager」アクセスレベルが必要です
     - これにより、RevenueCatが製品情報をインポートし、管理できるようになります

6. **キーを生成**
   - 「**生成**」ボタンをクリック
   - **重要**: この時点で、以下の情報が表示されます：
     - **Issuer ID**: 例: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
     - **Key ID**: 例: `XXXXXXXXXX`
     - **.p8ファイル**: 自動的にダウンロードされます

7. **情報を保存**
   - **Issuer ID**をコピーして安全な場所に保存
   - **Key ID**をコピーして安全な場所に保存
   - **.p8ファイル**を安全な場所に保存
   - **重要**: .p8ファイルは一度しかダウンロードできません。失くした場合は、新しいキーを生成する必要があります

**注意事項**:
- .p8ファイルは機密情報です。適切に管理してください
- キーを生成した後、すぐにRevenueCatにアップロードすることを推奨します
- 複数のキーを作成できますが、各キーは個別に管理されます

---

### 1.2 Vendor番号の確認

**場所**: App Store Connect

**手順**:

1. **App Store Connectにアクセス**
   - [App Store Connect](https://appstoreconnect.apple.com/)にログイン

2. **支払と財務報告ページに移動**
   - ホーム画面で「**支払と財務報告**」をクリック
   - または、左側のメニューから「**支払と財務報告**」を選択

3. **Vendor番号を確認**
   - ページの左上隅に法人名とともに「**ベンダー番号**」（Vendor番号）が表示されます
   - 例: `12345678`
   - この番号をコピーして安全な場所に保存

**注意事項**:
- 「支払と財務報告」セクションにアクセスできない場合、アカウントの権限が制限されている可能性があります
- この場合、アカウントの管理者に連絡して、適切な権限を付与してもらう必要があります
- Vendor番号は、RevenueCatでApp Store Connect API Keyを設定する際に必要です（必須の場合と任意の場合があります）

**代替方法**:
- 一部のアカウントでは、「App情報」ページにVendor番号が表示される場合もあります
- または、「ユーザーとアクセス」ページの上部に表示される場合もあります
- RevenueCatの設定画面でVendor番号が必須かどうかを確認してください

---

### 1.3 RevenueCatにApp Store Connect API Keyをアップロード

**場所**: RevenueCatダッシュボード

**手順**:

1. **RevenueCatダッシュボードにアクセス**
   - [RevenueCatダッシュボード](https://app.revenuecat.com/)にログイン
   - 対象のプロジェクトを選択

2. **iOS App設定ページにアクセス**
   - 左側のメニューから「**Apps & providers**」を選択
   - 対象のiOSアプリを選択
   - または、プロジェクトページ → 「**iOS App Settings**」に直接アクセス

3. **App Store Connect API Keyをアップロード**
   - RevenueCatのダッシュボードで「**In-app purchase key configuration**」セクションを探す
   - 以下の情報を入力：
     - **Issuer ID**: Part 1.1でコピーしたIssuer IDを入力（必須）
     - **Key ID**: Part 1.1でコピーしたKey IDを入力（必須）
     - **Vendor番号**: Part 1.2で確認したVendor番号を入力（必須の場合と任意の場合があります）
     - **.p8ファイル**: Part 1.1でダウンロードした.p8ファイルをアップロード（必須）
       - 「**ファイルを選択**」ボタンをクリック
       - または、.p8ファイルをドラッグ&ドロップでアップロード
   
   **重要**: ファイル名の問題について
   - App Store Connectからダウンロードされる.p8ファイルは`AuthKey_XXXXXXXXXX.p8`という形式です
   - しかし、RevenueCatは`SubscriptionKey_XXXXXXXXXX.p8`という形式のファイル名を期待している場合があります
   - **解決方法**: ファイル名を`SubscriptionKey_`で始まる形式にリネームしてください
     - 例: `AuthKey_Z6＊＊＊＊＊＊＊S.p8` → `SubscriptionKey_Z6＊＊＊＊＊＊＊S.p8`
   - ファイル名を変更しても、ファイルの内容（実際のキー）は変わりません
   - ファイル名を変更してからアップロードしてください

4. **変更を保存**
   - 「**保存**」ボタンをクリックして設定を完了

**重要**: 認証情報が有効になるまで、数分から数時間かかる場合があります。

**Vendor番号が取得できない場合**:
- 「支払と財務報告」セクションにアクセスできない場合は、アカウントの権限が制限されている可能性があります
- この場合、まずはVendor番号なしで設定を試みてください
- RevenueCatの設定画面でVendor番号が必須かどうかを確認してください
- 必須の場合は、アカウントの管理者に連絡して、適切な権限を付与してもらう必要があります

**確認事項**:
- Issuer ID、Key IDが正しく入力されているか
- .p8ファイルが正しくアップロードされているか
- アクセスレベルが「App Manager」以上に設定されているか
- Vendor番号が必須の場合は、正しく入力されているか

---

## Part 2: In-App Purchase Keyの作成と設定（推奨 - StoreKit 2用）

### 2.1 In-App Purchase Keyの生成

**場所**: App Store Connect

**手順**:

1. **App Store Connectにアクセス**
   - [App Store Connect](https://appstoreconnect.apple.com/)にログイン

2. **ユーザーとアクセスページに移動**
   - 右上のユーザーアイコンをクリック
   - 「**ユーザーとアクセス**」を選択
   - または、直接[ユーザーとアクセスページ](https://appstoreconnect.apple.com/access/users)にアクセス

3. **統合セクションに移動**
   - 左側のメニューから「**統合**」を選択
   - 「**アプリ内購入**」をクリック

4. **アプリ内購入キーを生成**
   - 「**アプリ内購入キーを生成**」ボタンをクリック
   - または、「**+**」ボタンをクリック

5. **キー情報を入力**
   - **名前**: `RevenueCat In-App Purchase Key`（任意の名前でも可）

6. **キーを生成**
   - 「**生成**」ボタンをクリック
   - **重要**: この時点で、以下の情報が表示されます：
     - **Issuer ID**: 例: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
     - **Key ID**: 例: `XXXXXXXXXX`
     - **.p8ファイル**: 自動的にダウンロードされます

7. **情報を保存**
   - **Issuer ID**をコピーして安全な場所に保存
   - **Key ID**をコピーして安全な場所に保存
   - **.p8ファイル**を安全な場所に保存
   - **重要**: .p8ファイルは一度しかダウンロードできません。失くした場合は、新しいキーを生成する必要があります

**注意事項**:
- In-App Purchase Keyは、StoreKit 2を使用する場合に必要です
- このプロジェクトでは`react-native-purchases`（RevenueCat SDK）を使用しており、StoreKit 2をサポートしています
- .p8ファイルは機密情報です。適切に管理してください

---

### 2.2 RevenueCatにIn-App Purchase Keyをアップロード

**場所**: RevenueCatダッシュボード

**手順**:

1. **RevenueCatダッシュボードにアクセス**
   - [RevenueCatダッシュボード](https://app.revenuecat.com/)にログイン
   - 対象のプロジェクトを選択

2. **iOS App設定ページにアクセス**
   - 左側のメニューから「**Apps & providers**」を選択
   - 対象のiOSアプリを選択
   - または、プロジェクトページ → 「**iOS App Settings**」に直接アクセス

3. **In-App Purchase Keyをアップロード**
   - 「**In-App Purchase Key**」セクションを探す（「App Store Connect API Key」セクションとは別です）
   - 以下の情報を入力：
     - **Issuer ID**: Part 2.1でコピーしたIssuer IDを入力
     - **Key ID**: Part 2.1でコピーしたKey IDを入力
     - **.p8ファイル**: Part 2.1でダウンロードした.p8ファイルをアップロード
       - 「**ファイルを選択**」ボタンをクリック
       - または、.p8ファイルをドラッグ&ドロップでアップロード
   
   **重要**: In-App Purchase Key用の.p8ファイルを使用してください
   - In-App Purchase Keyの.p8ファイルは、`AuthKey_XXXXXXXXXX.p8`または`SubscriptionKey_XXXXXXXXXX.p8`という形式のファイル名です
   - App Store Connect API Keyの.p8ファイルとは異なります
   - ファイル名が`AuthKey_`または`SubscriptionKey_`で始まるファイルを使用してください

4. **変更を保存**
   - 「**保存**」ボタンをクリックして設定を完了

**重要**: In-App Purchase Keyは、StoreKit 2を使用する場合に必要です。このプロジェクトでは推奨されています。

---

## Part 3: App-Specific Shared Secretの作成と設定（オプション - StoreKit 1用）

### 3.1 App-Specific Shared Secretの生成

**場所**: App Store Connect

**手順**:

1. **App Store Connectにアクセス**
   - [App Store Connect](https://appstoreconnect.apple.com/)にログイン

2. **マイAppページに移動**
   - 「**マイApp**」を選択
   - 対象のアプリ（Morizo Mobile）を選択

3. **App情報ページに移動**
   - 左側のメニューから「**App情報**」を選択

4. **App固有の共有シークレットセクションに移動**
   - 「**App情報**」ページを下にスクロール
   - 「**App固有の共有シークレット**」セクションを探す

5. **共有シークレットを生成**
   - 「**管理**」ボタンをクリック
   - 「**共有シークレットを生成**」ボタンをクリック
   - 確認ダイアログで「**生成**」をクリック

6. **共有シークレットをコピー**
   - 生成された共有シークレットが表示されます
   - 例: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **重要**: このシークレットは一度しか表示されません
   - シークレットをコピーして安全な場所に保存

**注意事項**:
- App-Specific Shared Secretは、StoreKit 1を使用する場合に必要です
- StoreKit 1はAppleによって非推奨となっており、新しいアプリではStoreKit 2の使用が推奨されています
- ただし、互換性のために設定しておくことを推奨します

---

### 3.2 RevenueCatにApp-Specific Shared Secretを設定

**場所**: RevenueCatダッシュボード

**手順**:

1. **RevenueCatダッシュボードにアクセス**
   - [RevenueCatダッシュボード](https://app.revenuecat.com/)にログイン
   - 対象のプロジェクトを選択

2. **iOS App設定ページにアクセス**
   - 左側のメニューから「**Apps & providers**」を選択
   - 対象のiOSアプリを選択
   - または、プロジェクトページ → 「**iOS App Settings**」に直接アクセス

3. **App-Specific Shared Secretを設定**
   - 「**App-Specific Shared Secret**」セクションを探す
   - Part 3.1でコピーした共有シークレットを入力

4. **変更を保存**
   - 「**保存**」ボタンをクリックして設定を完了

**重要**: App-Specific Shared Secretは、StoreKit 1の互換性のために設定することを推奨しますが、必須ではありません。

---

## Part 4: 認証情報のステータス確認

**場所**: RevenueCatダッシュボード

**手順**:

1. **RevenueCatダッシュボードにアクセス**
   - [RevenueCatダッシュボード](https://app.revenuecat.com/)にログイン
   - 対象のプロジェクトを選択
   - 「**iOS App Settings**」ページに移動

2. **認証情報の検証を実行**
   - 各認証情報の横に「**検証を実行**」または「**Validate**」ボタンがある場合、クリックして検証を実行
   - または、認証情報を再アップロードすると、自動的に検証が実行されます

3. **検証結果の確認**
   - 検証結果のサマリーメッセージが表示されます
   - 認証情報が有効な場合、「**有効な認証情報**」メッセージが表示されます

**確認事項**:

- ✅ **App Store Connect API Key**: 製品情報のインポートが可能
- ✅ **In-App Purchase Key**: StoreKit 2での購入処理が可能
- ✅ **App-Specific Shared Secret**: StoreKit 1の互換性が確保

**注意**: 認証情報が有効になるまで、数分から数時間かかる場合があります。

---

## チェックリスト

設定手順を完了した後、以下のチェックリストを確認してください:

### App Store Connect API Key（必須）
- [ ] App Store ConnectでAPIキーが生成されている
- [ ] アクセスレベルが「App Manager」に設定されている
- [ ] Issuer ID、Key ID、.p8ファイルが保存されている
- [ ] Vendor番号が確認されている
- [ ] RevenueCatにApp Store Connect API Keyがアップロードされている

### In-App Purchase Key（推奨）
- [ ] App Store ConnectでIn-App Purchase Keyが生成されている
- [ ] Issuer ID、Key ID、.p8ファイルが保存されている
- [ ] RevenueCatにIn-App Purchase Keyがアップロードされている

### App-Specific Shared Secret（オプション）
- [ ] App Store Connectで共有シークレットが生成されている
- [ ] RevenueCatに共有シークレットが設定されている

### 検証
- [ ] RevenueCatで認証情報の検証が成功している
- [ ] 製品情報のインポートが可能であることを確認

---

## トラブルシューティング

### 既存のキー（EAS Submitなど）を使用できるか？

**状況**: EAS Submitやその他のツールで既にApp Store Connect API Keyを作成している場合。

**確認事項**:
- ✅ **アクセスレベル**: 「Admin」または「App Manager」以上であれば使用可能
- ✅ **.p8ファイル**: 保存されているか確認（EAS設定フォルダやダウンロードフォルダを確認）

**使用可能な場合**:
- 既存のキーのIssuer ID、Key ID、.p8ファイル、Vendor番号を使用してRevenueCatに設定できます
- 新しいキーを作成する必要はありません

**使用できない場合**:
- .p8ファイルが保存されていない場合は、新しいキーを作成する必要があります
- アクセスレベルが「App Manager」未満の場合は、新しいキーを作成する必要があります

**注意**: 既存のキーを使用する場合でも、RevenueCatに設定する際には、Issuer ID、Key ID、.p8ファイル、Vendor番号が必要です。

### 認証情報が有効にならない

**原因**: 認証情報の設定に問題がある可能性があります。

**対処方法**:
- Issuer ID、Key ID、Vendor番号が正しく入力されているか確認
- .p8ファイルが正しくアップロードされているか確認
- アクセスレベルが「App Manager」以上に設定されているか確認（「Admin」でも可）
- 数時間待ってから再度検証を実行

### .p8ファイルのファイル名エラー（エラー: Invalid file name）

**エラーメッセージ**: "Invalid file name, it should be SubscriptionKey_XXXXXXXXXX.p8. A file name with any other prefix could be a private key for a different Apple service."

**原因**: 
- App Store Connectからダウンロードされる.p8ファイルは`AuthKey_XXXXXXXXXX.p8`という形式です
- しかし、RevenueCatは`SubscriptionKey_XXXXXXXXXX.p8`という形式のファイル名を期待しています
- RevenueCatの設定画面では「In-app purchase key configuration」セクションしかない場合があります

**対処方法**:
1. **ファイル名をリネーム**
   - `AuthKey_XXXXXXXXXX.p8` → `SubscriptionKey_XXXXXXXXXX.p8`にリネーム
   - 例: `AuthKey_Z6＊＊＊＊＊＊＊S.p8` → `SubscriptionKey_Z6＊＊＊＊＊＊＊S.p8`
   - **重要**: ファイル名を変更しても、ファイルの内容（実際のキー）は変わりません
   - ファイル名を変更してからアップロードしてください

2. **RevenueCatの設定画面で確認**
   - RevenueCatのダッシュボードで「**In-app purchase key configuration**」セクションを探す
   - このセクションに、リネームした.p8ファイルをアップロードしてください

**注意**: 
- App Store Connect API Keyを生成した際にダウンロードされた.p8ファイルは、そのまま使用できます
- ファイル名を`SubscriptionKey_`で始まる形式にリネームするだけで問題ありません
- ファイルの内容（実際のキー）は変更されません

### .p8ファイルを失くした

**原因**: .p8ファイルは一度しかダウンロードできません。

**対処方法**:
- 既存のキーの.p8ファイルが保存されていない場合は、新しいキーを生成する必要があります
- App Store Connectで新しいキーを生成
- 新しいキーの情報をRevenueCatに再アップロード
- **注意**: 既存のキー（EAS Submit用など）を削除する必要はありません。複数のキーを同時に使用できます

### Vendor番号が見つからない

**原因**: 「支払と財務報告」セクションにアクセスできない、またはVendor番号が表示されない場合。

**対処方法**:
1. **「支払と財務報告」ページを確認**
   - App Store Connect → 「支払と財務報告」に移動
   - ページの左上隅にVendor番号が表示されます
   
2. **アクセス権限の確認**
   - 「支払と財務報告」にアクセスできない場合は、アカウントの権限が制限されている可能性があります
   - アカウントの管理者に連絡して、適切な権限を付与してもらう必要があります
   
3. **RevenueCatの設定画面で確認**
   - RevenueCatの設定画面でVendor番号が必須かどうかを確認してください
   - 必須でない場合は、Vendor番号なしで設定を進めることができます
   - 必須の場合は、アカウントの管理者に連絡して、適切な権限を付与してもらう必要があります

**注意**: Vendor番号は、RevenueCatでApp Store Connect API Keyを設定する際に必要です（必須の場合と任意の場合があります）。

### 製品情報がインポートできない

**原因**: App Store Connect API Keyの設定に問題がある可能性があります。

**対処方法**:
- App Store Connect API Keyが正しく設定されているか確認
- アクセスレベルが「App Manager」以上に設定されているか確認
- Vendor番号が必須の場合は、正しく入力されているか確認
- Issuer ID、Key ID、.p8ファイルが正しく設定されているか確認

### 購入処理が動作しない

**原因**: In-App Purchase Keyの設定に問題がある可能性があります。

**対処方法**:
- In-App Purchase Keyが正しく設定されているか確認
- StoreKit 2が有効になっているか確認
- アプリが正しくビルドされているか確認

---

## よくある質問

### Q1: どの認証情報が必須ですか？

**A**: 
- **App Store Connect API Key**: 必須（製品情報のインポートに必要）
- **In-App Purchase Key**: 推奨（StoreKit 2を使用する場合）
- **App-Specific Shared Secret**: オプション（StoreKit 1の互換性のため）

### Q2: StoreKit 1とStoreKit 2の違いは何ですか？

**A**: 
- **StoreKit 1**: Appleによって非推奨となっていますが、既存のアプリとの互換性のために使用できます
- **StoreKit 2**: Appleが推奨する新しいAPIで、より安全で効率的です

このプロジェクトでは`react-native-purchases`（RevenueCat SDK）を使用しており、StoreKit 2をサポートしています。

### Q3: Vendor番号が見つからない場合はどうすればよいですか？

**A**: 以下の手順で確認してください：

1. **「支払と財務報告」ページを確認**
   - App Store Connect → 「支払と財務報告」に移動
   - ページの左上隅にVendor番号が表示されます

2. **アクセス権限の確認**
   - 「支払と財務報告」にアクセスできない場合は、アカウントの権限が制限されている可能性があります
   - アカウントの管理者に連絡して、適切な権限を付与してもらう必要があります

3. **RevenueCatの設定画面で確認**
   - RevenueCatの設定画面でVendor番号が必須かどうかを確認してください
   - 必須でない場合は、Vendor番号なしで設定を進めることができます
   - 必須の場合は、アカウントの管理者に連絡して、適切な権限を付与してもらう必要があります

**注意**: Vendor番号は、RevenueCatでApp Store Connect API Keyを設定する際に必要です（必須の場合と任意の場合があります）。

### Q4: .p8ファイルのアップロードでエラーが発生しました（Invalid file name）

**エラーメッセージ**: "Invalid file name, it should be SubscriptionKey_XXXXXXXXXX.p8."

**A**: このエラーは、App Store Connectからダウンロードされた.p8ファイルのファイル名が`AuthKey_`で始まるが、RevenueCatが`SubscriptionKey_`で始まるファイル名を期待している場合に発生します。

**対処方法**:
1. **ファイル名をリネーム**
   - `AuthKey_XXXXXXXXXX.p8` → `SubscriptionKey_XXXXXXXXXX.p8`にリネーム
   - 例: `AuthKey_Z6＊＊＊＊＊＊＊S.p8` → `SubscriptionKey_Z6＊＊＊＊＊＊＊S.p8`
   - **重要**: ファイル名を変更しても、ファイルの内容（実際のキー）は変わりません

2. **RevenueCatの設定画面で確認**
   - RevenueCatのダッシュボードで「**In-app purchase key configuration**」セクションを探す
   - このセクションに、リネームした.p8ファイルをアップロードしてください

3. **必要な情報を入力**
   - Issuer ID: App Store Connect API Key生成時に取得したIssuer ID
   - Key ID: App Store Connect API Key生成時に取得したKey ID
   - Vendor番号: 取得できる場合のみ（必須でない場合もあります）

**注意**: 
- App Store Connect API Keyを生成した際にダウンロードされた.p8ファイルは、そのまま使用できます
- ファイル名を`SubscriptionKey_`で始まる形式にリネームするだけで問題ありません
- ファイルの内容（実際のキー）は変更されません

### Q5: 認証情報が有効になるまでどのくらいかかりますか？

**A**: 通常は数分から数時間です。場合によっては、最大24時間かかることもあります。

### Q6: 既存のキー（EAS Submit用など）をRevenueCatで使用できますか？

**A**: はい、使用できます。以下の条件を満たしている場合：
- ✅ アクセスレベルが「Admin」または「App Manager」以上
- ✅ .p8ファイルが保存されている

既存のキーを使用する場合：
- 新しいキーを作成する必要はありません
- 既存のキーのIssuer ID、Key ID、.p8ファイル、Vendor番号（取得できる場合）を使用してRevenueCatに設定できます
- EAS SubmitとRevenueCatで同じキーを使用できます（複数のサービスで同じキーを使用可能）

**注意**: .p8ファイルが保存されていない場合は、新しいキーを作成する必要があります。また、App Store Connect API Key用の.p8ファイルとIn-App Purchase Key用の.p8ファイルは異なるため、それぞれ正しいセクションにアップロードしてください。

### Q7: 複数のアプリで同じ認証情報を使用できますか？

**A**: はい、同じApp Store Connect API KeyとIn-App Purchase Keyを複数のアプリで使用できます。ただし、App-Specific Shared Secretはアプリごとに異なります。

### Q8: 認証情報を更新する必要がある場合はどうすればよいですか？

**A**: 
- App Store Connectで新しいキーを生成
- 新しいキーの情報をRevenueCatに再アップロード
- 古いキーは削除するか、無効化することを推奨します
- **注意**: 既存のキー（EAS Submit用など）を削除する必要はありません。複数のキーを同時に使用できます

---

## 参考資料

- [RevenueCat公式ドキュメント: App Store Connect API Key Configuration](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/app-store-connect-api-key-configuration)
- [RevenueCat公式ドキュメント: In-App Purchase Key Configuration](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration)
- [RevenueCat公式ドキュメント: App-Specific Shared Secret](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [RevenueCatダッシュボード](https://app.revenuecat.com/)

---

**最終更新**: 2025年1月29日  
**作成者**: AIエージェント協働チーム

