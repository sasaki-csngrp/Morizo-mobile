# RevenueCat MCPサーバー セットアップガイド

## 概要

このガイドでは、RevenueCat MCP（Model Context Protocol）サーバーをローカル環境にセットアップし、Cursorで使用する方法を詳しく説明します。

**推奨**: ローカルインストール（stdio）が最も簡単で、開発・テストに適しています。

---

## MCPサーバーの2つのデプロイオプション

### 1. クラウドMCPサーバー
- **URL**: `https://mcp.revenuecat.ai/mcp`
- **用途**: チームでの共同作業、本番環境での使用
- **認証**: OAuth（推奨）またはAPI v2 Secret Key

### 2. ローカルMCP拡張機能（推奨）
- **用途**: 個人開発者、ローカルでの開発・テスト
- **利点**: 迅速なセットアップ、既存のCursor/VS Codeワークフローと統合
- **認証**: API v2 Secret Key

**このガイドでは、ローカルMCP拡張機能のセットアップに焦点を当てます。**

---

## 前提条件

- ✅ CursorまたはVS Codeがインストールされている
- ✅ RevenueCatアカウントを持っている
- ✅ RevenueCat API v2 Secret Keyを取得している

---

## ステップ1: RevenueCat API v2 Secret Keyの取得

1. [RevenueCatダッシュボード](https://app.revenuecat.com)にログイン
2. 左メニューから「**API keys**」を選択
3. 「**Generate a new secret API key**」または「**Create API Key**」をクリック
4. 以下の情報を入力：
   - **Name**: 任意の名前（例: "MCP Server Local"）
   - **API version**: **V2**を選択（⚠️ **重要**: MCPサーバーにはAPI v2が必要です）
5. **権限（Permissions）の設定**:
   
   API v2では、詳細な権限設定が表示されます。MCPサーバーが26種類の機能を提供するため、以下の権限を設定することを推奨します：

   | 権限カテゴリ | 推奨設定 | 理由 |
   |------------|---------|------|
   | **Charts metrics permissions** | **Read** | 分析データとチャートを取得するため |
   | **Customer information permissions** | **Read** または **Write** | 顧客情報を取得・管理するため |
   | **Customer lists permissions** | **Read** | 顧客リストを取得するため |
   | **Entitlements permissions** | **Read** または **Write** | エンタイトルメントを管理するため |
   | **Events permissions** | **Read** | イベントデータを取得するため |
   | **Offerings permissions** | **Read** または **Write** | オファリングを管理するため |
   | **Products permissions** | **Read** または **Write** | 製品情報を管理するため |
   | **Project configuration permissions** | **Read** | プロジェクト設定を取得するため |
   | **Subscriber attributes permissions** | **Read** または **Write** | サブスクライバー属性を管理するため |
   | **Subscription statuses permissions** | **Read** | サブスクリプションステータスを取得するため |
   | **Webhooks permissions** | **Read** | Webhook設定を取得するため |

   **開発・テスト環境の場合**:
   - 全ての権限を**Write**に設定することを推奨（MCPサーバーの全機能をテストできるため）
   
   **本番環境の場合**:
   - 必要最小限の権限を設定することを推奨
   - 読み取りのみで十分な場合は**Read**、変更が必要な場合のみ**Write**を設定

6. 「**Create**」または「**Generate**」をクリック
7. **Secret Keyをコピー**（この画面でしか表示されません）

⚠️ **重要**: 
- Secret Keyは安全に保管してください。このキーは後で使用します。
- **API v2を選択してください**。MCPサーバーはAPI v2のみをサポートしています。
- 権限は後から変更できないため、必要な権限を最初に設定してください。
- 開発環境では全て**Write**に設定することを推奨します。

---

## ステップ2: RevenueCat MCP拡張機能のインストール

### ⚠️ Cursorで拡張機能が見つからない場合

CursorはVS Codeのフォークですが、拡張機能マーケットプレイスへのアクセスが制限されている場合があります。以下の方法で対応できます：

#### 方法A: VSIXファイルを手動でインストール（推奨）

1. [VSIXファイルをダウンロード](https://drive.google.com/file/d/1VcyqirfdJtrAMuDnMTBkU8USCbdvMTMn/view?usp=share_link)
2. Cursorを開く
3. 拡張機能パネルを開く（`Ctrl+Shift+X` / `Cmd+Shift+X`）
4. 右上の「**...**」メニューをクリック
5. 「**Install from VSIX...**」を選択
6. ダウンロードしたVSIXファイルを選択

#### 方法B: 拡張機能なしでmcp.jsonを手動設定（stdio方式）

拡張機能をインストールしなくても、`mcp.json`を手動で設定すれば使用できます。詳細は「ステップ3: APIキーの設定」の「方法2」を参照してください。

### VS Codeの場合

1. VS Codeを開く
2. 拡張機能パネルを開く（`Ctrl+Shift+X` / `Cmd+Shift+X`）
3. 「**RevenueCat MCP**」を検索
4. 「**Install**」をクリック

または、[Visual Studio Marketplace](https://marketplace.visualstudio.com)から直接インストールすることもできます。

### Cursorで拡張機能が見つかる場合

1. Cursorを開く
2. 拡張機能パネルを開く（`Ctrl+Shift+X` / `Cmd+Shift+X`）
3. 「**RevenueCat MCP**」を検索
4. 「**Install**」をクリック

---

## ステップ3: APIキーの設定

### 方法1: VS Code拡張機能コマンドを使用（拡張機能がインストールされている場合）

1. Cursor/VS Codeで、コマンドパレットを開く（`Ctrl+Shift+P` / `Cmd+Shift+P`）
2. 「**RevenueCat: Set Project Secret Key**」を選択
3. プロンプトが表示されたら、先ほど取得したAPI v2 Secret Keyを貼り付け
4. Enterキーを押す

これにより、ワークスペースに`mcp.json`ファイルが作成されます。

### 方法2: 手動でmcp.jsonを作成（stdio方式 - 拡張機能なしでも動作）

**拡張機能がインストールできない場合でも、この方法で使用できます！**

プロジェクトのルートディレクトリに`mcp.json`ファイルを作成し、以下の内容を記述します：

```json
{
  "servers": {
    "revenuecat": {
      "command": "npx",
      "args": [
        "-y",
        "@revenuecat/mcp-server"
      ],
      "env": {
        "REVENUECAT_API_KEY": "YOUR_API_V2_SECRET_KEY_HERE"
      }
    }
  }
}
```

**stdio方式の説明**:
- `command`: `npx`を使用してMCPサーバーを実行
- `args`: `-y`フラグで確認なしでインストール、`@revenuecat/mcp-server`がMCPサーバーパッケージ
- `env`: 環境変数としてAPIキーを渡す
- この方式では、標準入力・出力（stdio）を通じてMCPサーバーと通信します
- **拡張機能がなくても動作します** - Cursorで拡張機能が見つからない場合でも、この方法で使用可能です

⚠️ **セキュリティ**: `mcp.json`ファイルを`.gitignore`に追加して、APIキーがコミットされないようにしてください。

```bash
# .gitignoreに追加
echo "mcp.json" >> .gitignore
```

---

## ステップ4: CursorでMCPを有効化

1. Cursorの設定を開く
   - `Ctrl+,` / `Cmd+,` で設定を開く
   - または、メニューから「**File** → **Preferences** → **Settings**」
2. 左メニューから「**MCP**」を選択
3. 「**Enable**」ボタンをクリック
4. 「**Refresh**」アイコンをクリックしてサーバーをアクティブ化

これで、RevenueCat MCPサーバーがCursorで利用可能になります。

---

## ステップ5: 動作確認

### コマンドパレットから確認

1. コマンドパレットを開く（`Ctrl+Shift+P` / `Cmd+Shift+P`）
2. 「**RevenueCat: Show your project secret key**」を選択
3. 現在設定されているAPIキー（マスク表示）が表示されれば成功

### AIアシスタントで確認

Cursorのチャットで、以下のように質問してみてください：

```
RevenueCatの現在のプロジェクト一覧を教えてください
```

MCPサーバーが正しく動作していれば、AIアシスタントがRevenueCatのデータを取得して回答します。

---

## VS Code拡張機能コマンド一覧

ローカル拡張機能は、以下のコマンドを提供します：

| コマンド | 説明 |
|---------|------|
| `RevenueCat: Set Project Secret Key` | APIキーを設定または更新 |
| `RevenueCat: Remove Project Secret Key` | 保存されているAPIキーを削除 |
| `RevenueCat: Show your project secret key` | 現在のAPIキーを表示（マスク表示） |

---

## クラウドMCPサーバーを使用する場合

ローカルではなく、クラウドMCPサーバーを使用する場合は、`mcp.json`に以下の設定を追加します：

```json
{
  "servers": {
    "revenuecat": {
      "url": "https://mcp.revenuecat.ai/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_V2_SECRET_KEY_HERE"
      }
    }
  }
}
```

### OAuth認証を使用する場合（Cursor/VS Codeのみ）

CursorとVS Codeでは、OAuth認証も利用可能です。この場合、APIキーを手動で管理する必要がありません。

1. Cursorの設定で「**MCP**」を開く
2. 「**Add Server**」をクリック
3. 「**RevenueCat**」を選択
4. OAuth認証フローが開始されます
5. ブラウザでRevenueCatにログインして認証を完了

---

## トラブルシューティング

### MCPサーバーが接続できない

1. **APIキーが正しいか確認**
   - コマンドパレットから「**RevenueCat: Show your project secret key**」を実行
   - APIキーが表示されない場合は、再設定してください

2. **mcp.jsonファイルの確認**
   - プロジェクトのルートディレクトリに`mcp.json`が存在するか確認
   - JSONの構文エラーがないか確認

3. **Cursorの再起動**
   - Cursorを完全に終了して再起動
   - MCP設定を再度有効化

### APIキーの権限エラー

- RevenueCatダッシュボードで、APIキーに適切な権限が付与されているか確認
- 必要に応じて、新しいAPIキーを作成してください

### 拡張機能がインストールされない

- Cursor/VS Codeを最新バージョンに更新
- 拡張機能マーケットプレイスから直接インストールを試す

---

## セキュリティのベストプラクティス

1. **APIキーの保護**
   - `mcp.json`を`.gitignore`に追加
   - APIキーを環境変数として管理することを検討
   - 本番環境と開発環境で異なるAPIキーを使用

2. **権限の最小化**
   - APIキーには、必要最小限の権限のみを付与
   - 定期的にAPIキーをローテーション

3. **設定ファイルの管理**
   - `mcp.json`をバージョン管理に含めない
   - チームで共有する場合は、環境変数を使用

---

## 次のステップ

MCPサーバーが正しく設定されたら、以下のことが可能になります：

1. **自然言語での操作**
   - 「現在のオファリングを確認して」
   - 「製品一覧を取得して」
   - 「エンタイトルメントを設定して」

2. **ドキュメントの自動参照**
   - RevenueCatのドキュメントを自動的に参照
   - 実装方法を質問すると、関連ドキュメントを取得

3. **26種類の機能を利用**
   - サブスクリプションアプリの管理
   - 製品、エンタイトルメント、オファリングの操作
   - 顧客情報の取得と管理

詳細な機能一覧については、[RevenueCat MCP Tools Reference](https://www.revenuecat.com/docs/tools/mcp/tools-reference)を参照してください。

---

## 参考資料

- [RevenueCat MCP Server Overview](https://www.revenuecat.com/docs/tools/mcp/overview)
- [RevenueCat MCP Server Setup](https://www.revenuecat.com/docs/tools/mcp/setup)
- [RevenueCat MCP Tools Reference](https://www.revenuecat.com/docs/tools/mcp/tools-reference)
- [RevenueCat MCP Usage Examples](https://www.revenuecat.com/docs/tools/mcp/usage-examples)
- [RevenueCat MCP Best Practices](https://www.revenuecat.com/docs/tools/mcp/best-practices-and-troubleshooting)

---

**最終更新**: 2025年12月10日  
**作成者**: AIエージェント

