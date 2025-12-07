# RevenueCat設定 - 引き継ぎ事項

**作成日**: 2025年12月7日  
**最終更新**: 2025年12月7日  
**状況**: ✅ PROプランの購入に成功

---

## 現在の状況

### 完了済み
1. ✅ **test_storeエラーの解決**
   - `SubscriptionScreen.tsx`のAPIキー優先順位を変更
   - プラットフォーム固有のAPIキー（Android用）を優先的に使用するように修正
   - エラーハンドリングを改善

2. ✅ **Product Catalogでの商品インポート**
   - RevenueCatダッシュボードで、Play Storeの商品をインポート済み
   - 以下の商品が「Morizo Mobile (Play Store)」セクションに表示されている：
     - `morizo_pro_monthly:morizo-pro-monthly` (Published)
     - `morizo_pro_yearly:morizo-pro-yearly` (Published)
     - `morizo_ultimate_monthly:morizo-ultimate-monthly` (Published)
     - `morizo_ultimate_yearly:morizo-ultimate-yearly` (Published)

3. ✅ **オファリング設定の完了**
   - オファリング編集画面で、Play Storeの商品をパッケージに選択済み
   - `pro_monthly`パッケージ: `morizo_pro_monthly:morizo-pro-monthly` (Play Store)
   - `ultimate_monthly`パッケージ: `morizo_ultimate_monthly:morizo-ultimate-monthly` (Play Store)

4. ✅ **エンタイトルメント設定の完了**
   - `pro`エンタイトルメントを作成し、`pro_monthly`パッケージに紐付け
   - `ultimate`エンタイトルメントを作成し、`ultimate_monthly`パッケージに紐付け

5. ✅ **PROプランの購入テスト成功**
   - RevenueCatでの購入処理成功
   - バックエンドAPIとの同期成功
   - プラン情報が`free`から`pro`に更新されたことを確認
   - 利用回数制限が`pro`プランに更新されたことを確認（menu_bulk: 10, menu_step: 30, ocr: 10）

### 解決済みの問題

1. ✅ **オファリング設定の問題** - 解決済み
   - オファリング編集画面で、Play Storeの商品をパッケージに選択

2. ✅ **エンタイトルメント設定の問題** - 解決済み
   - エンタイトルメントを作成し、オファリングのパッケージに紐付け

3. ✅ **商品検索の問題** - 解決済み
   - Product IDが`商品ID:ストア内の商品ID`形式の場合も検索できるように修正

4. ✅ **バックエンド同期の問題** - 解決済み
   - エンタイトルメント情報の取得処理を改善
   - 購入トークンの取得処理を改善

---

## 技術的な詳細

### 現在の設定

**環境変数**:
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` が設定済み（プラットフォーム固有のAPIキーを使用）

**RevenueCatダッシュボードの状態**:
- Test Store: 商品あり（`morizo_pro_monthly`, `morizo_ultimate_monthly`）
- Morizo Mobile (Play Store): 商品あり（インポート済み）
- Offerings: `default`オファリングが存在
- パッケージ: `pro_monthly`, `ultimate_monthly`が存在

### コードの変更履歴

**`screens/SubscriptionScreen.tsx`**:
- APIキーの優先順位を変更（プラットフォーム固有 > テストストア用）
- `ConfigurationError`のエラーハンドリングを追加
- `test_store`エラーの検出と適切なメッセージ表示を実装

---

## 次のステップ（推奨）

### 1. RevenueCatダッシュボードでの確認

**確認事項**:
1. オファリングのパッケージ設定を確認
   - 左メニュー → 「Product catalog」→ 「Offerings」を選択
   - `default`オファリングをクリック
   - パッケージ（`pro_monthly`, `ultimate_monthly`）の「Product」欄を確認
   - 現在、どの商品が選択されているか確認

2. パッケージの編集画面を確認
   - パッケージをクリック（または編集ボタンをクリック）
   - 「Product」ドロップダウンに、Play Storeの商品が表示されているか確認
   - もし表示されていない場合、別の方法を検討する必要がある

### 2. エンタイトルメントの設定（必須）

**重要**: エンタイトルメントは必須です。エンタイトルメントがないと、購入後にバックエンド同期が失敗します。

#### 2.1 エンタイトルメントの作成

1. **RevenueCatダッシュボードにログイン**
   - [RevenueCatダッシュボード](https://app.revenuecat.com/)にアクセス
   - プロジェクト「Morizo Mobile」を選択

2. **エンタイトルメントを作成**
   - 左メニュー → 「Product catalog」→ 「Entitlements」を選択
   - 「Create entitlement」をクリック

3. **エンタイトルメント1: PRO**
   - **Entitlement ID**: `pro`
   - **Display Name**: `PRO Plan`
   - **Description**: `PROプランのエンタイトルメント`
   - 「Save」をクリック

4. **エンタイトルメント2: ULTIMATE**
   - 「Create entitlement」をクリック
   - **Entitlement ID**: `ultimate`
   - **Display Name**: `ULTIMATE Plan`
   - **Description**: `ULTIMATEプランのエンタイトルメント`
   - 「Save」をクリック

#### 2.2 オファリングのパッケージにエンタイトルメントを紐付ける

1. **オファリング詳細ページに移動**
   - 左メニュー → 「Product catalog」→ 「Offerings」を選択
   - `default`オファリングをクリック

2. **オファリング編集画面を開く**
   - **右上の「Edit」ボタンをクリック**（重要！）
   - オファリング編集画面が開きます

3. **パッケージの設定を確認・変更**
   - `pro_monthly`パッケージ:
     - **Product**: `morizo_pro_monthly:morizo-pro-monthly`（Play Store）
     - **Entitlement**: `pro`（上記で作成したエンタイトルメント）
   - `ultimate_monthly`パッケージ:
     - **Product**: `morizo_ultimate_monthly:morizo-ultimate-monthly`（Play Store）
     - **Entitlement**: `ultimate`（上記で作成したエンタイトルメント）

4. **保存**
   - オファリング編集画面の「**Save**」ボタンをクリック

**注意事項**:
- エンタイトルメントIDは、プランタイプ（`pro`、`ultimate`）と一致させる必要があります
- パッケージにエンタイトルメントを紐付けないと、購入後に`customerInfo.entitlements`が`undefined`になり、バックエンド同期が失敗します

### 3. 代替案（パッケージ編集画面で変更できない場合のみ）

**案1: パッケージを削除して再作成**
- 既存のパッケージ（`pro_monthly`, `ultimate_monthly`）を削除
- 新規にパッケージを作成
- 作成時にPlay Storeの商品を選択

**案2: RevenueCatサポートに問い合わせ**
- RevenueCatのサポートに問い合わせて、オファリングのパッケージにPlay Storeの商品を選択する方法を確認
- 特に、パッケージ編集画面の「Product」ドロップダウンにPlay Storeの商品が表示されない場合

### 4. 一時的な回避策

**オファリングシステムを使用しない**:
- エラーメッセージに「If you don't want to use the offerings system, you can safely ignore this message.」とある
- オファリングシステムを使用しない場合は、直接商品IDで購入処理を実行する方法を検討
- ただし、これは推奨されない方法

---

## 参考ドキュメント

### 関連ドキュメント
- `docs/MONETIZATION_ROADMAP.md` - 収益化機能実装ロードマップ
  - セクション4.5: プラットフォーム固有APIキー使用時の商品連携
  - セクション4.5.1.1: トラブルシューティング

### RevenueCat公式ドキュメント
- https://rev.cat/how-to-configure-offerings
- https://rev.cat/why-are-offerings-empty

### コードファイル
- `screens/SubscriptionScreen.tsx` - サブスクリプション画面
- `config/subscription.ts` - 商品ID設定

---

## 重要なポイント

1. **Product Catalogに商品を追加しただけでは不十分**
   - オファリングのパッケージにPlay Storeの商品を選択する必要がある

2. **プラットフォーム固有のAPIキーを使用している**
   - テストストア用APIキーではなく、Android用APIキーを使用
   - そのため、Play Storeの商品をオファリングに登録する必要がある

3. **現在のエラーは設定の問題**
   - コードの問題ではなく、RevenueCatダッシュボードでの設定の問題

4. **オファリング編集画面で商品を変更可能**
   - オファリング詳細ページの右上にある「Edit」ボタンを押して、オファリング編集画面を開く
   - オファリング編集画面内で、パッケージの「Product」ドロップダウンからPlay Storeの商品を直接選択できます
   - パッケージを削除して再作成する必要はありません
   - パッケージを個別にクリックすると商品詳細ページに遷移してしまうため、オファリング編集画面内でドロップダウンから直接選択してください

---

## トラブルシューティング

### 問題: 購入時に「商品が見つかりません」エラーが発生する

**エラーメッセージ**:
```
ERROR - ❌ 購入処理エラー | Data: {"error":"商品が見つかりません: morizo_pro_monthly","isExpoGo":false}
```

**原因**:
- オファリングにパッケージが含まれていない
- パッケージのProduct IDが`morizo_pro_monthly`と一致していない
- オファリングが「Current」に設定されていない

**確認手順**:

1. **RevenueCatダッシュボードでオファリングを確認**
   - 左メニュー → 「Product catalog」→ 「Offerings」を選択
   - `default`オファリングをクリック
   - パッケージ一覧で、`pro_monthly`と`ultimate_monthly`が表示されているか確認
   - 各パッケージのProduct IDが`morizo_pro_monthly`、`morizo_ultimate_monthly`と一致しているか確認

2. **オファリングが「Current」に設定されているか確認**
   - オファリング一覧で、`default`オファリングの右側に「Current」バッジが表示されているか確認
   - 表示されていない場合、「Set as current」をクリック

3. **アプリのログを確認**
   - アプリ起動時のログで、オファリング取得時のパッケージ情報を確認
   - 購入ボタンを押した時のログで、利用可能なパッケージの一覧を確認
   - ログに表示されているProduct IDと、RevenueCatダッシュボードで設定したProduct IDが一致しているか確認

4. **パッケージのProduct IDが一致しない場合**
   - オファリング編集画面で、パッケージの「Product」ドロップダウンから正しいPlay Storeの商品を選択
   - 保存後、アプリを再起動して再度試す

## 次のセッションで確認すべきこと

1. **アプリのログ出力**
   - オファリング取得時のログ（利用可能なパッケージの一覧）
   - 購入ボタン押下時のログ（検索対象のProduct IDと利用可能なパッケージの一覧）

2. **RevenueCatダッシュボードの設定**
   - オファリングが「Current」に設定されているか
   - パッケージのProduct IDが正しいか（`morizo_pro_monthly`、`morizo_ultimate_monthly`）

3. **エラーメッセージの全文（もし変更があれば）**

---

## テスト購入のキャンセル方法

### 問題: `ITEM_ALREADY_OWNED`エラーが発生する

**エラーメッセージ**:
```
ERROR [RevenueCat] 🤖‼️ PurchasesError(code=ProductAlreadyPurchasedError, underlyingErrorMessage=Error updating purchases. DebugMessage: . ErrorCode: ITEM_ALREADY_OWNED., message='This product is already active for the user.')
```

**原因**:
- 既に購入済みの商品を再度購入しようとした場合に発生
- テスト購入が中途半端な状態で残っている場合に発生

### 解決方法

#### 方法1: Google Play Consoleでテスト購入をキャンセル（推奨）

1. **Google Play Consoleにログイン**
   - [Google Play Console](https://play.google.com/console/)にアクセス
   - アプリを選択

2. **テスト購入の確認**
   - 左メニュー → 「収益化」→ 「サブスクリプション」を選択
   - テスト購入を行った商品（`morizo_pro_monthly`など）を選択
   - 「テスト購入」セクションで、テスト購入履歴を確認

3. **テスト購入のキャンセル**
   - テスト購入を行ったGoogleアカウントで、Google Playストアアプリを開く
   - 「アカウント」→ 「購入とサブスクリプション」→ 「サブスクリプション」を選択
   - テスト購入したサブスクリプションを選択
   - 「キャンセル」をクリック

**注意**: テスト購入は通常、24時間後に自動的にキャンセルされますが、手動でキャンセルすることもできます。

#### 方法2: RevenueCatダッシュボードで購入履歴を確認

1. **RevenueCatダッシュボードにログイン**
   - [RevenueCatダッシュボード](https://app.revenuecat.com/)にアクセス
   - プロジェクト「Morizo Mobile」を選択

2. **顧客情報を確認**
   - 左メニュー → 「Customers」を選択
   - テスト購入を行ったユーザー（`originalAppUserId`）を検索
   - 購入履歴、エンタイトルメント、サブスクリプションステータスを確認

3. **購入履歴の削除**
   - RevenueCatダッシュボードでは、購入履歴を直接削除することはできません
   - Google Play Consoleでキャンセルする必要があります

#### 方法3: アプリを再インストール（開発環境のみ）

**注意**: この方法は開発環境でのみ使用してください。本番環境では使用しないでください。

1. **アプリをアンインストール**
   - デバイスからアプリを完全に削除

2. **アプリを再インストール**
   - 開発ビルドを再インストール
   - 新しい`originalAppUserId`が生成されるため、以前の購入履歴とは別のユーザーとして扱われます

**注意**: この方法は、RevenueCatの`originalAppUserId`がリセットされるため、以前の購入履歴とは別のユーザーとして扱われます。本番環境では使用しないでください。

### 今後のテスト購入の注意点

1. **テスト購入前に確認**
   - 既に購入済みの商品を再度購入しようとしていないか確認
   - エラーメッセージ「This product is already active for the user.」が表示された場合は、既に購入済みです

2. **テスト購入の管理**
   - テスト購入は24時間後に自動的にキャンセルされます
   - 手動でキャンセルする場合は、Google Playストアアプリからキャンセルしてください

3. **購入状態の確認**
   - RevenueCatダッシュボードの「Customers」セクションで、購入状態を確認できます
   - アプリ内で「購入を復元」ボタンを押すと、現在の購入状態を確認できます

## 成功した購入フローの確認

### ログから確認できたこと

1. **オファリング取得成功**
   - `default`オファリングが正しく取得できている
   - 2つのパッケージ（`pro_monthly`、`ultimate_monthly`）が含まれている

2. **商品検索成功**
   - `morizo_pro_monthly`で検索し、正しいパッケージが見つかった
   - Product IDが`morizo_pro_monthly:morizo-pro-monthly`形式でも検索できている

3. **RevenueCat購入処理成功**
   - `purchasePackage`が成功
   - `customerInfo`に`entitlements`が含まれている

4. **バックエンド同期成功**
   - 購入トークンが正しく取得できている（`$RCAnonymousID:9f011...`）
   - サブスクリプション更新APIが成功
   - プラン情報が`free`から`pro`に更新された
   - 利用回数制限が`pro`プランに更新された（menu_bulk: 10, menu_step: 30, ocr: 10）

### 重要な注意事項

#### 二重課金の防止（⚠️ 問題確認済み - 要対応）

**問題**: proプランを購入した後、ultimateプランにアップグレードした場合、Play Storeで両方のサブスクリプションが表示される可能性があります。

**⚠️ 確認済み（2025年12月7日）**: 
- **実際にGoogle Playストアの「定期購入」画面で、PROとULTIMATEの両方が表示されていることを確認**
- スクリーンショットで確認:
  - テスト: Morizo AI (PRO Plan) - ¥100 (次回のお支払い: 2025年12月7日 午後3:15 JST)
  - テスト: Morizo AI (ULTIMATE Plan) - ¥500 (次回のお支払い: 2025年12月7日 午後3:17 JST)
- **これは二重課金の問題が実際に発生していることを示している**

**現状**:
- ユーザーが実際にGoogle Play Consoleを確認したところ、サブスクリプショングループの設定が見当たらない
- AIエージェントが提供した「サブスクリプショングループの設定手順」は誤りだった可能性が高い
- 個別のサブスクリプション詳細ページ（「定期購入の詳細を編集」ページ）には、グループ設定の項目が見当たらない
- **Google Play Consoleの現在のUIでは、サブスクリプショングループの設定機能が存在しない**

**確認済み（2025年12月7日）**:
1. ✅ **Google Play Consoleの実際のUIを確認** - 完了
   - 「定期購入」一覧ページのスクリーンショットを取得済み
   - 確認できた定期購入プラン:
     - `morizo_pro_monthly` - Morizo PRO（月額）
     - `morizo_pro_yearly` - Morizo PRO（年額）
     - `morizo_ultimate_monthly` - Morizo ULTIMATE（月額）
     - `morizo_ultimate_yearly` - Morizo ULTIMATE（年額）
   - 各プランに1つのアクティブな基本プランが設定されている
   - ✅ **サブスクリプショングループの設定は、一覧ページにも詳細ページにも存在しないことを確認済み**

2. ✅ **お支払いプロファイルの問題について**
   - 状況: 銀行口座の登録確認待ち（総務部の対応待ち、対応予定: 明日）
   - **RevenueCatテストへの影響: なし**（テスト環境では実際の課金は発生しない）

---

## 定期購入一覧の確認結果（2025年12月7日）

### スクリーンショットから確認できたこと

1. **定期購入プランの存在確認**
   - ✅ `morizo_pro_monthly` - Morizo PRO（月額）
   - ✅ `morizo_pro_yearly` - Morizo PRO（年額）
   - ✅ `morizo_ultimate_monthly` - Morizo ULTIMATE（月額）
   - ✅ `morizo_ultimate_yearly` - Morizo ULTIMATE（年額）
   - すべてのプランに1つのアクティブな基本プランが設定されている

2. **サブスクリプショングループの設定について**
   - ✅ **確認済み**: 定期購入一覧ページには、サブスクリプショングループの設定は表示されていない
   - ✅ **確認済み**: 各定期購入の詳細ページ（「定期購入の詳細を編集」ページ）にもグループ設定は存在しない
   - **結論**: Google Play Consoleの現在のUIでは、サブスクリプショングループの設定機能が存在しない、または別の方法で管理されている可能性がある
   - **対応**: 二重課金の防止は、RevenueCat側で管理する方法を検討する必要がある

3. **警告メッセージ（お支払いプロファイルの問題）**
   - ⚠️ 「お支払いプロファイルに問題があります」という警告が表示されている
   - **状況**: 銀行口座の登録確認待ち（総務部の対応待ち、対応予定: 明日）
   - **RevenueCatテストへの影響**: **影響なし**
     - RevenueCatのテストストアでは、実際の課金は発生しない
     - プラットフォーム固有のAPIキーを使ったテストでも、サンドボックス環境では実際の課金は発生しない
     - お支払いプロファイルの問題は、実際の課金処理（本番環境）にのみ影響する
     - したがって、RevenueCatでのテスト中は影響しない

---

## 📋 次のアクション（今すぐやること）

### ✅ 今すぐやる必要があること: **なし**

現在の状況:
- ✅ RevenueCatでのテストは問題なく続行可能（お支払いプロファイルの問題は影響しない）
- ✅ お支払いプロファイルの問題は明日対応予定（総務部の対応待ち）
- ✅ サブスクリプショングループの設定は存在しないことを確認済み

### ⚠️ 緊急対応が必要な問題

1. **二重課金の問題（確認済み）**
   - ✅ **確認済み**: pro → ultimateにアップグレードした場合、Play Storeで両方が表示される
   - ✅ **確認済み**: Google Playストアの「定期購入」画面で、PROとULTIMATEの両方が表示されている
   - **対応が必要**: この問題を解決する方法を検討する必要がある
   - **影響**: ユーザーが両方のプランに対して課金される可能性がある

### 🔄 今後のテストで確認すべきこと

1. **二重課金の防止の動作確認**（テスト時に確認）
   - ✅ **確認済み**: 実際にpro → ultimateにアップグレードした場合、Play Storeで両方が表示される
   - **要確認**: 実際に両方に対して課金が発生するかどうか
   - **要確認**: アプリ側の確認ダイアログが正しく表示されるか確認
   - **要確認**: RevenueCat側で、同じエンタイトルメントに紐づく複数のサブスクリプションを管理する方法

2. **ULTIMATEプランの購入テスト**
   - ULTIMATEプランの購入も同様に動作するか確認
   - アップグレード時に既存のサブスクリプションが正しくキャンセルされるか確認

3. **利用回数制限のテスト**
   - PROプランの制限（menu_bulk: 10, menu_step: 30, ocr: 10）が正しく適用されているか確認
   - ULTIMATEプランの制限（menu_bulk: 100, menu_step: 300, ocr: 100）が正しく適用されているか確認

4. **日次リセット機能のテスト**
   - 翌日の0:00 JSTに利用回数がリセットされるか確認

### 📝 まとめ

**現在の状況**:
- ⚠️ **重要**: 二重課金の問題が確認済み（PROとULTIMATEの両方がPlay Storeに表示されている）
- RevenueCatでのテストは問題なく続行可能
- お支払いプロファイルの問題は明日対応予定（影響なし）
- サブスクリプショングループの設定は存在しない（Google Play Consoleの現在のUIでは設定できない）

**次にやること**:
- ⚠️ **優先**: 二重課金の問題を解決する方法を検討する必要がある
  - **詳細な調査は別ドキュメントで進行中**: `docs/MONETIZATION_DOUBLE_BILLING_INVESTIGATION.md`を参照
  - 調査タスク:
    1. RevenueCat側での対応方法の調査
    2. アプリ側での対応方法の調査
    3. Google Play Console側での対応方法の調査
  - 実際に両方に対して課金が発生するかどうかを確認

---

**最終更新**: 2025年12月7日  
**作成者**: AIエージェント協働チーム  
**確認済み事項**:
- ✅ 定期購入一覧ページのスクリーンショットを確認済み
- ✅ サブスクリプショングループの設定は、一覧ページにも詳細ページにも存在しないことを確認済み
- ✅ お支払いプロファイルの問題は、RevenueCatテストには影響しないことを確認済み（テスト環境では実際の課金は発生しない）
- ⚠️ **重要**: 二重課金の問題が確認済み（Google Playストアの「定期購入」画面で、PROとULTIMATEの両方が表示されている）

