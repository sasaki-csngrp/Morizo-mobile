# Android Play Service Credentials 設定手順

## 概要

RevenueCatがGoogle Playと連携するために必要なサービス認証情報の設定手順です。このプロセスは複数のステップに分かれており、Google Cloud ConsoleとGoogle Play Consoleの間を行き来する必要があります。

**所要時間**: 約30分〜1時間（設定作業のみ。認証情報の有効化には最大36時間かかる場合があります）

**作成日**: 2025年1月29日  
**バージョン**: 1.0

---

## 前提条件

- Google Play Consoleアカウント（開発者登録済み）
- Google Cloud Consoleアカウント（Googleアカウントと同じ）
- RevenueCatアカウント
- 対象のAndroidアプリがGoogle Play Consoleに登録されていること

---

## 全体の流れ

1. **Part 1**: Google Cloud Consoleでサービス認証情報を生成
2. **Part 2**: Google Play Consoleでアクセス権を付与し、RevenueCatに認証情報をアップロード
3. **Part 3**: 署名済みAPKまたはAndroid App Bundleをアップロード
4. **Part 4**: 認証情報のステータスを確認

---

## Part 1: サービス認証情報の生成

### 1.1 Google Developer and Reporting APIの有効化

**場所**: Google Cloud Console

**手順**:

1. **API Consoleにアクセス**
   - [Google Cloud Console](https://console.cloud.google.com/)にアクセス
   - Googleアカウントでログイン

2. **プロジェクトの選択または作成**
   - 左上のプロジェクトセレクタをクリック
   - 既存のプロジェクトを選択するか、新しいプロジェクトを作成
   - **重要**: このプロジェクトは、後でGoogle Play Consoleとリンクする必要があります

3. **Google Play Android Developer APIを有効化**
   - [Google Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com)のページにアクセス
   - 「**有効にする**」ボタンをクリック
   - 有効化後は「**管理**」と表示されます

4. **Google Play Developer Reporting APIを有効化**
   - [Google Play Developer Reporting API](https://console.cloud.google.com/apis/library/playdeveloperreporting.googleapis.com)のページにアクセス
   - 「**有効にする**」ボタンをクリック
   - 有効化後は「**管理**」と表示されます

**注意**: APIを有効化すると、認証情報の作成を促すメッセージが表示される場合があります。その場合は、次のステップに進みます。

---

### 1.2 サービスアカウントの作成

**場所**: Google Cloud Console

**手順**:

1. **サービスアカウントページにアクセス**
   - [Google Cloud Console](https://console.cloud.google.com/)にアクセス
   - 左側のナビゲーションメニューから「**IAMと管理**」→「**サービスアカウント**」を選択
   - または、直接[サービスアカウントページ](https://console.cloud.google.com/iam-admin/serviceaccounts)にアクセス

   **別の方法**: Google Play Consoleからもアクセス可能
   - Google Play Consoleの「ユーザーと権限」ページから「サービスアカウントの作成方法を学ぶ」をクリック
   - ポップアップから「Google Cloud Platform」を選択
   - これにより、正しいプロジェクトにいることを確認できます

2. **サービスアカウントの作成**
   - 「**サービスアカウントを作成**」ボタンをクリック
   - 以下の情報を入力:
     - **サービスアカウント名**: `revenuecat-service-account`（任意の名前でも可）
     - **サービスアカウントID**: 自動生成されますが、必要に応じて編集可能
     - **説明**: 「RevenueCat用サービスアカウント」など、任意の説明を入力
   - 「**作成して続行**」をクリック

3. **ロールの付与**

   **方法A: サービスアカウント作成時にロールを付与する場合**
   - 「**このサービスアカウントにプロジェクトへのアクセス権を付与**」ステップで、以下の2つのロールを追加:
     - **Pub/Sub Editor**（日本語: **Pub/Sub 編集者**） - プラットフォームサーバー通知を有効化するため
     - **Monitoring Viewer**（日本語: **モニタリング閲覧者**） - 通知キューの監視を許可するため

   **方法B: サービスアカウント作成後にロールを追加する場合**（推奨）
   
   サービスアカウントの詳細ページからロールを追加する手順:
   
   1. **サービスアカウントの詳細ページにアクセス**
      - 作成したサービスアカウント（`revenuecat-service-account`）をクリックして詳細ページを開く
   
   2. **「権限」タブをクリック**
      - サービスアカウントの詳細ページ上部にある「**権限**」タブをクリック
      - または、左側のメニューから「**IAMと管理**」→「**IAM**」を選択し、サービスアカウントのメールアドレスを検索
   
   3. **「アクセス権を付与」をクリック**
      - 「**アクセス権を付与**」または「**Grant Access**」ボタンをクリック
   
   4. **ロールを追加**
      - 「**新しいプリンシパル**」フィールドに、サービスアカウントのメールアドレスを入力
        - 例: `revenuecat-service-account@morizo-search.iam.gserviceaccount.com`
      - 「**ロールを選択**」をクリックして、以下の2つのロールを追加:
        - **Pub/Sub Editor**（日本語: **Pub/Sub 編集者**） - プラットフォームサーバー通知を有効化するため
        - **Monitoring Viewer**（日本語: **モニタリング閲覧者**） - 通知キューの監視を許可するため
      - 各ロールを選択したら、「**保存**」をクリック

   **ロールの検索方法**:
   - フィルターで名前検索をしても表示されない場合があります
   - リストをスクロールして、それぞれ「Pub/Sub」フォルダと「Monitoring」フォルダ内で見つけてください
   - **日本語表示の場合**: 「Pub/Sub 編集者」と「モニタリング閲覧者」で検索してください

   **トラブルシューティング**:
   - Pub/Sub Editor（Pub/Sub 編集者）で問題が発生する場合は、**Pub/Sub Admin**（**Pub/Sub 管理者**）ロールを試してください
   - 一部の開発者は、Pub/Sub Editorロールではトピック作成時に権限エラーが発生したと報告しています

4. **オプションステップをスキップ**（方法Aの場合のみ）
   - 3番目のオプションステップはスキップして、「**完了**」をクリック

---

### 1.3 秘密鍵の生成とダウンロード

**場所**: Google Cloud Console

**手順**:

1. **サービスアカウントのキー管理ページにアクセス**
   - 「**サービスアカウント**」セクションで、作成したサービスアカウントの行を確認
   - 右側の3つの点（アクションドロップダウンメニュー）をクリック
   - 「**キーを管理**」を選択

2. **新しいキーを作成**
   - 「**キーを追加**」をクリック
   - 「**新しいキーを作成**」を選択

3. **JSONキーをダウンロード**
   - ポップアップで「**JSON**」が選択されていることを確認
   - 「**作成**」をクリック
   - JSONファイルが自動的にダウンロードされます

4. **JSONファイルの保管**
   - ダウンロードしたJSONファイルを安全な場所に保管してください
   - このファイルは、次のステップでRevenueCatにアップロードします
   - **重要**: このファイルは機密情報を含むため、適切に管理してください

**注意事項**:

- **組織ポリシーの制約**: 2024年5月3日以降にGoogle Cloudで組織を作成した場合、サービスアカウントの作成と使用にデフォルトの制約が設定されている可能性があります
- エラー `iam.disableServiceAccountCreation` または `iam.disableServiceAccountKeyCreation` が表示される場合:
  - Google Cloud Console → プロジェクト → 「IAMと管理」→ 「組織ポリシー」
  - 「サービスアカウントの作成を無効化」または「サービスアカウントキーの作成を無効化」をオフにしてください

**オプション: Pub/Sub APIの有効化**

- この時点で、Google Real-Time Developer Notificationsの設定を先に進めることができます
- [Google Cloud Pub/Sub API](https://console.cloud.google.com/flows/enableapi?apiid=pubsub)を有効化しておくと、後で時間を節約できます

---

## Part 2: RevenueCatへのアクセス権付与

### 2.1 Google Play Consoleでサービスアカウントを追加

**場所**: Google Play Console

**手順**:

1. **ユーザーと権限ページにアクセス**
   - [Google Play Console](https://play.google.com/console/)にアクセス
   - 左側のメニューから「**ユーザーと権限**」を選択
   - または、直接[ユーザーと権限ページ](https://play.google.com/console/u/0/developers/users-and-permissions/invite)にアクセス

2. **ユーザーを招待**
   - 「**ユーザーを招待**」ボタンをクリック

3. **サービスアカウントのメールアドレスを入力**
   - 作成したサービスアカウントのメールアドレスを入力
   - サービスアカウントのメールアドレスは、Google Cloud Consoleのサービスアカウント一覧で確認できます
   - 形式: `サービスアカウント名@プロジェクトID.iam.gserviceaccount.com`

4. **アプリ権限の設定**
   - 「**アプリ権限**」セクションで、対象のアプリを追加
   - アプリを選択して、権限を付与するアプリを指定

5. **アカウント権限の設定**
   - 「**アカウント権限**」セクションで、以下の3つの権限を**必ず**付与:
     - ✅ **アプリ情報の閲覧（読み取り専用）**（英語: View app information and download bulk reports (read-only)）
     - ✅ **売上データの表示**（英語: View financial data, orders, and cancellation survey response）
     - ✅ **注文と定期購入の管理**（英語: Manage orders and subscriptions）

   **重要**: 上記の3つの権限は必須です。その他の権限は、必要に応じて選択してください。

   **注意**: Google Play Consoleの画面に表示される権限名は、日本語と英語で異なる場合があります。上記の日本語の権限名が表示されない場合は、英語の権限名で検索してください。

6. **招待を送信**
   - ページ下部の「**ユーザーを招待**」ボタンをクリック
   - 招待が送信され、「**ユーザーと権限**」ページにリダイレクトされます
   - 新しく作成したアカウントが「**アクティブ**」として表示されることを確認

---

### 2.2 RevenueCatに認証情報JSONファイルをアップロード

**場所**: RevenueCatダッシュボード

**手順**:

1. **RevenueCatダッシュボードにアクセス**
   - [RevenueCatダッシュボード](https://app.revenuecat.com/)にログイン
   - 対象のプロジェクトを選択

2. **Google Play App設定ページにアクセス**
   - 左側のメニューから「**Apps & providers**」を選択
   - 対象のAndroidアプリを選択
   - または、プロジェクトページ → 「**Google Play App Settings**」に直接アクセス

3. **JSONファイルをアップロード**
   - 「**Google Play Service Account Key**」セクションを探す
   - 「**ファイルを選択**」ボタンをクリック
   - Part 1.3でダウンロードしたJSONファイルを選択
   - または、JSONファイルをドラッグ&ドロップでアップロード

4. **変更を保存**
   - 「**保存**」ボタンをクリックして設定を完了

**重要**: 認証情報が有効になるまで、最大36時間かかる場合があります。この期間中は、「無効なPlayストア認証情報」エラー（503または521）が発生し、RevenueCatでの購入が正常に行えない場合があります。

**認証情報の有効化を早める方法（ワークアラウンド）**:

- Google Play Consoleで、アプリのダッシュボードを開く
- 「**収益化**」セクション → 「**商品**」→ 「**サブスクリプション/アプリ内商品**」に移動
- 任意の商品の説明を変更して保存
- 変更を元に戻す（オプション）
- これにより、認証情報がすぐに（または非常に短時間で）有効になる場合があります（保証はありません）

**次のステップ（オプション）**:

- 認証情報のアップロード後、[Google Real-Time Developer Notifications](https://www.revenuecat.com/docs/platform-resources/server-notifications/google-server-notifications)の設定を進めることができます
- Part 1.3でPub/Sub APIを有効化している場合は、[ステップ2](https://www.revenuecat.com/docs/platform-resources/server-notifications/google-server-notifications#2-choose-a-pubsub-topic-id)から開始できます

**Google Real-Time Developer Notificationsについて**:

- ⚠️ **必須ではありません**: RevenueCatはサービス認証情報だけでGoogleと通信できます
- ✅ **強く推奨されます**: リアルタイムサーバー通知の設定は、以下のメリットがあります:
  - **価格の正確性の向上**: リアルタイムで価格情報を取得
  - **Webhookと統合の配信時間の短縮**: 通知の受信が速くなる
  - **Chartsの遅延時間の削減**: ダッシュボードのデータ更新が速くなる
- 📅 **設定タイミング**: 認証情報のアップロード後、いつでも設定可能です（認証情報が有効になるまで最大36時間かかる場合があるため、その後に設定することを推奨）

---

## Part 3: 署名済みAPKまたはAndroid App Bundleのアップロード

**場所**: Google Play Console

**手順**:

1. **Google Play Consoleにアクセス**
   - [Google Play Console](https://play.google.com/console/)にアクセス
   - 対象のアプリを選択

2. **アプリバンドルまたはAPKをアップロード**
   - 「**リリース**」セクションに移動
   - 「**本番環境**」または「**内部テスト**」トラックを選択
   - 署名済みAPKまたはAndroid App Bundleをアップロード

3. **リリースを承認**
   - アップロード後、リリースを承認する必要があります
   - すべてのステップを完了して、リリースを承認してください

**重要**: 購入を開始するには、署名済みAPKまたはAndroid App Bundleをアップロードし、リリースを承認する必要があります。

**内部テストトラックでのアップロードについて**:
- 本番環境ではなく、**内部テスト**トラックでもアップロード可能です
- 内部テストトラックでも、サンドボックステストが可能です
- アプリがまだテスト段階の場合、内部テストトラックでのアップロードを推奨します

詳細については、[Google Play Storeサンドボックステストガイド](https://www.revenuecat.com/docs/test-and-launch/sandbox/google-play-store)を参照してください。

---

## Part 4: 認証情報のステータス確認

**場所**: RevenueCatダッシュボード

**手順**:

1. **RevenueCatダッシュボードにアクセス**
   - [RevenueCatダッシュボード](https://app.revenuecat.com/)にログイン
   - 対象のプロジェクトを選択
   - 「**Google Play App Settings**」ページに移動

2. **認証情報の検証を実行**
   - アップロードしたJSONファイルの横に「**検証を実行**」または「**Validate**」ボタンがある場合、クリックして検証を実行
   - または、認証情報を再アップロードすると、自動的に検証が実行されます

3. **検証結果の確認**
   - 検証結果のサマリーメッセージが表示されます
   - 認証情報が有効な場合、「**有効な認証情報**」メッセージが表示され、すべての権限にチェックマークが付きます

**注意**: 認証情報が有効になるまで、最大36時間かかる場合があります。

**検証結果の見方**:

- ✅ **すべての権限が成功（青☑）**: 認証情報が正常に設定されています
- ⚠️ **一部の権限が失敗（赤×）**: 以下のような状態が考えられます:
  - **subscriptions APIが失敗している場合**:
    - Part 3（APK/AABのアップロード）がまだ完了していない可能性があります
    - subscriptions APIの完全な検証には、署名済みAPKまたはAndroid App BundleをGoogle Play Consoleにアップロードし、リリースを承認する必要があります
    - **inappproducts API**と**monetization API**が成功していれば、基本的な認証情報は正しく設定されています
    - この状態でも、認証情報のアップロード自体は完了しています
  - **その他の権限が失敗している場合**:
    - Google Play Consoleでサービスアカウントに必要な権限が正しく付与されているか確認してください
    - 権限を追加・変更した場合は、最大36時間かかる場合があります

**このまま待っても大丈夫ですか？**

- ✅ **はい、大丈夫です**: 認証情報のアップロードは完了しています
- ⚠️ **subscriptions APIが失敗している場合**: Part 3（APK/AABのアップロード）を完了すると、subscriptions APIの検証も成功するようになります
- ⏳ **認証情報の反映**: 権限の変更や追加を行った場合、反映まで最大36時間かかる場合があります

**Part 3（APK/AABアップロード）なしでも実行可能**:
- Part 4の認証情報検証は、Part 3を完了していなくても実行できます
- ただし、以下の点に注意してください:
  - ✅ **inappproducts API**と**monetization API**の検証は、APK/AABなしでも可能
  - ⚠️ **subscriptions API**の完全な検証には、APK/AABのアップロードとリリース承認が必要
  - 実際の購入処理をテストするには、Part 3の完了が必要です

**推奨アプローチ**:
1. **まずPart 4を実行**: 基本的な認証情報の検証を確認
2. **Part 3は後回し可能**: アプリがまだテスト段階の場合、Part 3は後回しにしても問題ありません
3. **購入テスト前にPart 3を完了**: 実際の購入処理をテストする前に、内部テストトラックでAPK/AABをアップロードしてください

---

## トラブルシューティング

### チェックリストの確認

設定手順を完了した後、以下のチェックリストを確認してください:

- [ ] Google Cloud Consoleで、Google Play Android Developer APIが有効になっている
- [ ] Google Cloud Consoleで、Google Play Developer Reporting APIが有効になっている
- [ ] Google Cloud Consoleで、サービスアカウントが作成されている
- [ ] サービスアカウントに「Pub/Sub Editor」（日本語: 「Pub/Sub 編集者」、または「Pub/Sub Admin」/「Pub/Sub 管理者」）ロールが付与されている
- [ ] サービスアカウントに「Monitoring Viewer」（日本語: 「モニタリング閲覧者」）ロールが付与されている
- [ ] サービスアカウントのJSONキーがダウンロードされている
- [ ] Google Play Consoleで、サービスアカウントが招待されている
- [ ] Google Play Consoleで、サービスアカウントに必要な権限が付与されている
- [ ] RevenueCatにJSONファイルがアップロードされている
- [ ] 署名済みAPKまたはAndroid App Bundleがアップロードされている

詳細なチェックリストについては、[RevenueCatの公式チェックリスト](https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials/google-play-checklists)を参照してください。

---

### 認証情報が有効になっているか確認

**場所**: Google Cloud Console

**手順**:

1. [Google Cloud Consoleのサービスアカウントページ](https://console.cloud.google.com/iam-admin/serviceaccounts)にアクセス
2. 作成したRevenueCatサービスアカウントを確認
3. エントリが「**有効**」と表示されていることを確認

**注意**: アカウントが無効になっている場合、セキュリティリスクがあるため、再有効化は推奨されません。代わりに、このドキュメントの手順に従って新しい認証情報を生成してください。

---

### アップロードしたJSONファイルが正しいか確認

**場所**: RevenueCatダッシュボード

**手順**:

1. RevenueCatダッシュボードで、アップロードしたJSONファイルの横にある情報アイコンをクリック
2. 以下の情報を確認:
   - **Project ID**: Google Cloud ConsoleのプロジェクトIDと一致しているか
   - **Private Key ID**: ダウンロードしたJSONファイルの内容と一致しているか
   - **Client Email**: サービスアカウントのメールアドレスと一致しているか

---

### 認証情報の再アップロード

認証情報が正常に動作しない場合、以下の手順を試してください:

1. RevenueCatダッシュボードから、現在のJSONファイルを削除
2. Google Cloud Consoleで、新しいJSONキーを生成
3. 新しいJSONファイルをRevenueCatにアップロード

---

### 認証情報検証ツールのトラブルシューティング

認証情報検証ツールでエラーが表示される場合、以下の表を参照してください:

| 権限 | 合格しない理由 | 対処法 |
|------|---------------|--------|
| **subscriptions API** | GoogleのGET subscriptionsエンドポイントから応答を受信できません | ステップ2.1で以下の権限を付与してください:<br>- **売上データの表示**（英語: View financial data, orders, and cancellation survey response）<br>- **注文と定期購入の管理**（英語: Manage orders and subscriptions）<br><br>その後、サンドボックスユーザーでテスト購入を実行して、subscriptions APIへの接続が動作しているか確認してください。また、署名済みAPKまたはAndroid App Bundleをアップロードし、リリースを承認したことを確認してください。 |
| **inappproducts API** | GoogleのGET inappproductsエンドポイントから応答を受信できません | ステップ2.1で以下の権限を付与してください:<br>- **アプリ情報の閲覧（読み取り専用）**（英語: View app information and download bulk reports (read-only)） |
| **monetization API** | GoogleのLIST monetizationエンドポイントから応答を受信できません | ステップ2.1で以下の権限を付与してください:<br>- **売上データの表示**（英語: View financial data, orders, and cancellation survey response） |

**注意**: Google認証情報に変更を加えた後、変更がGoogleのサーバー全体に反映されるまで、24時間から最大36時間かかる場合があります。認証情報の有効化を早める方法については、Part 2.2の「認証情報の有効化を早める方法（ワークアラウンド）」を参照してください。

---

### エラーハンドリング

#### ダッシュボードエラー

| エラーメッセージ | 対処法 |
|----------------|--------|
| **"Your Google Service Account credentials do not have permissions to access the needed Google resources."** | Google Cloud Consoleで、サービスアカウントに以下のロールが付与されていることを確認してください:<br>- **Pub/Sub Editor**（日本語: **Pub/Sub 編集者**、または**Pub/Sub Admin**/**Pub/Sub 管理者**）<br>- **Monitoring Viewer**（日本語: **モニタリング閲覧者**）<br><br>ロールを変更または更新した場合は、JSONキーを再生成してRevenueCatに追加してください。 |
| **"The provided Google Service Account credentials JSON is invalid."** | Google Cloud ConsoleからJSONキーを再生成し、RevenueCatに再度アップロードしてください。同じエラーが発生する場合は、サービスアカウントを再作成してください。 |
| **"Google Play service account credentials must be set up before using this feature."** | このエラーは、サービス認証情報を設定する前に、Googleと通信するアクション（Android用の商品のインポートなど）を実行しようとした場合に発生します。まず、このドキュメントの手順に従ってサービス認証情報を設定してください。 |
| **"Account permissions are invalid for this request."** | RevenueCatのすべてのコラボレーターが同じ権限を持っているわけではありません。アプリの設定（サービス認証情報の作成など）を変更するには、ユーザーが「**管理者**」としてリストされている必要があります。 |
| **"Google Cloud Pub/Sub API must first be enabled."** | サービス認証情報の設定に使用したのと同じプロジェクトで、Google Cloud ConsoleでPub/Sub APIへのアクセスを有効にしてください。 |
| **"Your Google service account credentials do not have permissions to access the Google Cloud Pub/Sub API."** | Pub/Sub APIアクセスが有効になっていないか、サービスアカウントに追加されたPub/Subロールが管理者ロールではない可能性があります。サービスアカウントに正しいロールが付与されていることを確認し、変更した場合は、JSONキーを再生成してRevenueCatに再追加してください。 |

#### SDKエラー

| エラー | 基になるメッセージ | 対処法 |
|--------|------------------|--------|
| **InvalidCredentialsError** | "Invalid Play Store credentials." | このエラーは少し曖昧です。このドキュメントのすべてのステップが完了していることを確認してください。36時間以上待ってもこのエラーが続く場合は、最初からやり直してください。 |

---

## よくある質問

### Q1: 認証情報が有効になるまでどのくらいかかりますか？

**A**: 最大36時間かかります。通常は24時間以内に有効になりますが、場合によっては36時間かかることもあります。

### Q2: 認証情報の有効化を早める方法はありますか？

**A**: Part 2.2で説明したワークアラウンドを試してください。Google Play Consoleで任意の商品の説明を変更して保存すると、認証情報がすぐに有効になる場合があります（保証はありません）。

### Q3: サービスアカウントが無効になっている場合はどうすればよいですか？

**A**: セキュリティリスクがあるため、無効になったサービスアカウントを再有効化することは推奨されません。代わりに、このドキュメントの手順に従って新しい認証情報を生成してください。

### Q4: 複数のアプリで同じサービスアカウントを使用できますか？

**A**: はい、同じサービスアカウントを複数のアプリで使用できます。Google Play Consoleで、各アプリにサービスアカウントを追加し、必要な権限を付与してください。

### Q5: サービスアカウントのロールを変更した場合はどうすればよいですか？

**A**: ロールを変更した場合は、JSONキーを再生成してRevenueCatに再アップロードする必要があります。

### Q6: Part 3（APK/AABアップロード）を後回しにして、Part 4（認証情報のステータス確認）に進んでも大丈夫ですか？

**A**: はい、大丈夫です。Part 4はPart 3を完了していなくても実行できます。ただし、以下の点に注意してください:
- ✅ 基本的な認証情報の検証（inappproducts API、monetization API）は、APK/AABなしでも可能
- ⚠️ subscriptions APIの完全な検証には、APK/AABのアップロードが必要
- 実際の購入処理をテストするには、Part 3の完了が必要です

### Q7: 内部テストトラックでもアップロードすれば、サンドボックステストは可能ですか？

**A**: はい、可能です。本番環境ではなく、**内部テスト**トラックでもAPK/AABをアップロードすれば、サンドボックステストが可能です。アプリがまだテスト段階の場合、内部テストトラックでのアップロードを推奨します。

---

## 参考資料

- [RevenueCat公式ドキュメント: Creating Play Service Credentials](https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials)
- [RevenueCat公式チェックリスト](https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials/google-play-checklists)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Play Console](https://play.google.com/console/)
- [RevenueCatダッシュボード](https://app.revenuecat.com/)

---

**最終更新**: 2025年1月29日  
**作成者**: AIエージェント協働チーム

