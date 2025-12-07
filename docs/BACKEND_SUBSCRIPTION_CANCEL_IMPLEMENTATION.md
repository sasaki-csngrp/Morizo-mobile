# バックエンド実装: 既存サブスクリプションのキャンセル機能

**作成日**: 2025年12月7日  
**最終更新**: 2025年12月7日  
**状況**: ⚠️ Next.js APIルートの実装が必要

---

## 概要

アプリ側でアップグレード時に既存のサブスクリプションをキャンセルするため、バックエンド側に新しいエンドポイントを実装する必要があります。

---

## 背景

### 問題
- PROプランからULTIMATEプランにアップグレードした場合、両方のサブスクリプションが有効なままになる
- これにより、Google Playストアで両方のサブスクリプションが表示され、二重課金が発生する

### 原因
- `pro`と`ultimate`は**別々のエンタイトルメント**として設定されている
- RevenueCatでは、**異なるエンタイトルメント間のアップグレード**では、既存のサブスクリプションが自動的にキャンセルされない

### 解決策
- アプリ側で、アップグレード時に既存のサブスクリプションを確認
- バックエンドAPI経由で、Google Play Developer APIを使用して既存のサブスクリプションをキャンセル

---

## 実装要件

### エンドポイント

**⚠️ 重要**: Next.jsのAPIルート（`/api/subscription/cancel`）を実装する必要があります。

**URL**: `POST /api/subscription/cancel`（Next.jsのAPIルート）

**実装場所**: Next.jsのWebアプリ（`/app/api/subscription/cancel/route.ts` または `/pages/api/subscription/cancel.ts`）

**バックエンドAPI**: `POST /subscription/cancel`（Morizo AIバックエンド）

**リクエストボディ**:
```json
{
  "product_id": "morizo_pro_monthly",
  "platform": "android",
  "purchase_token": "購入トークン（Android用、オプション）",
  "receipt_data": "レシートデータ（iOS用、オプション）",
  "package_name": "jp.co.csngrp.morizo"
}
```

**⚠️ 重要な変更（2025年12月7日）**:
- `purchase_token`と`receipt_data`は**オプション**に変更
- RevenueCatのCustomerInfoから`purchase_token`を取得することはできないため、バックエンド側で`product_id`と`platform`から既存のサブスクリプション情報をデータベースから取得する必要がある

**レスポンス**:
```json
{
  "success": true,
  "error": null
}
```

または、エラーの場合:
```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

### 実装内容

1. **既存のサブスクリプション情報の取得**
   - `purchase_token`が提供されていない場合、`product_id`と`platform`から既存のサブスクリプション情報をデータベースから取得
   - ユーザーID（認証トークンから取得）と`product_id`、`platform`を使用して、既存のサブスクリプション情報を検索
   - データベースから`purchase_token`（Android）または`receipt_data`（iOS）を取得

2. **Google Play Developer APIの使用**
   - 取得した`purchase_token`を使用して、`purchases.subscriptions.cancel`メソッドを呼び出し
   - 既存のサブスクリプションをキャンセル

3. **認証**
   - Google Play Developer APIを使用するには、サービスアカウントの認証情報が必要
   - 既存の認証情報を使用するか、新規に設定する必要がある

4. **エラーハンドリング**
   - 既存のサブスクリプションが見つからない場合
   - 既にキャンセル済みの場合
   - API呼び出しエラーの場合
   - `purchase_token`が取得できない場合（データベースに存在しない場合など）

---

## アプリ側の実装（完了）

アプリ側では、以下の処理を実装しました：

1. **既存のサブスクリプションの確認**
   - `Purchases.getCustomerInfo()`を使用して、アクティブなサブスクリプションを確認
   - 既存のサブスクリプション情報（product_id）を取得

2. **バックエンドAPIの呼び出し**
   - アップグレード時に、既存のサブスクリプションをキャンセルするリクエストを送信
   - `product_id`と`platform`を送信（`purchase_token`は取得できないため、バックエンド側で取得する必要がある）
   - キャンセル成功後、新しいサブスクリプションの購入処理を続行

**⚠️ 重要な発見（2025年12月7日）**:
- RevenueCatのCustomerInfoから`purchase_token`を取得することはできない
- `activeEntitlement`には`purchaseToken`や`transactionId`などのフィールドが含まれていない
- そのため、バックエンド側で`product_id`と`platform`から既存のサブスクリプション情報をデータベースから取得する必要がある

---

## Next.js APIルートの実装

### 実装例（Next.js App Router）

`/app/api/subscription/cancel/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth'; // 認証トークンを取得する関数

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json();
    
    // 認証トークンを取得
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    // Morizo AIバックエンドにリクエストを転送
    const backendUrl = process.env.MORIZO_AI_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/subscription/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errorData.detail || errorData.error || 'Morizo AIとの通信に失敗しました' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Subscription cancel API error:', error);
    return NextResponse.json(
      { success: false, error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}
```

### 実装例（Next.js Pages Router）

`/pages/api/subscription/cancel.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthToken } from '@/lib/auth'; // 認証トークンを取得する関数

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    // 認証トークンを取得
    const token = await getAuthToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: '認証が必要です' });
    }
    
    // Morizo AIバックエンドにリクエストを転送
    const backendUrl = process.env.MORIZO_AI_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/subscription/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(req.body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        error: errorData.detail || errorData.error || 'Morizo AIとの通信に失敗しました'
      });
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Subscription cancel API error:', error);
    return res.status(500).json({ success: false, error: '内部サーバーエラー' });
  }
}
```

### 注意事項

- `/api/subscription/update`と同じパターンで実装してください
- 認証トークンの取得方法は、既存の実装に合わせてください
- 環境変数`MORIZO_AI_API_URL`が設定されていることを確認してください

---

## 参考資料

### Google Play Developer API

- **APIリファレンス**: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/cancel
- **認証**: サービスアカウントの認証情報が必要

### 実装例（Python）

```python
from google.oauth2 import service_account
from googleapiclient.discovery import build

# サービスアカウントの認証情報を読み込む
credentials = service_account.Credentials.from_service_account_file(
    'path/to/service-account-key.json',
    scopes=['https://www.googleapis.com/auth/androidpublisher']
)

# Android Publisher APIクライアントを作成
service = build('androidpublisher', 'v3', credentials=credentials)

# サブスクリプションをキャンセル
package_name = 'jp.co.csngrp.morizo'
subscription_id = 'morizo_pro_monthly'
token = '購入トークン'

service.purchases().subscriptions().cancel(
    packageName=package_name,
    subscriptionId=subscription_id,
    token=token
).execute()
```

---

## 実装の優先順位

1. **高**: テスト環境での実装とテスト
2. **高**: 本番環境へのデプロイ前の検証
3. **中**: エラーハンドリングの強化
4. **低**: ログの追加

---

## 注意事項

- Google Play Developer APIを使用するには、適切な権限が必要
- サービスアカウントの認証情報は、安全に管理する必要がある
- テスト環境と本番環境で、異なる認証情報を使用する可能性がある

---

## 質問・確認事項

1. 既存のGoogle Play Developer APIの認証情報は設定済みですか？
2. サービスアカウントの権限は適切に設定されていますか？
3. テスト環境と本番環境で、異なる認証情報を使用しますか？

---

**最終更新**: 2025年12月7日  
**作成者**: AIエージェント協働チーム

