import { authenticatedFetch } from './recipe-api';
import { getApiUrl } from '../lib/api-config';
import { safeLog, LogCategory } from '../lib/logging';
import { PlanType } from '../config/subscription';

/**
 * プラン情報の型定義
 */
export interface PlanInfo {
  plan_type: PlanType;
  subscription_status: 'active' | 'expired' | 'cancelled';
  subscription_id?: string;
  platform?: 'ios' | 'android';
  purchased_at?: string;
  expires_at?: string;
}

/**
 * 利用回数の型定義
 */
export interface UsageInfo {
  menu_bulk_count: number;
  menu_step_count: number;
  ocr_count: number;
  date: string; // YYYY-MM-DD形式
}

/**
 * 利用回数制限情報の型定義
 */
export interface UsageLimitInfo {
  menu_bulk: {
    current: number;
    limit: number;
  };
  menu_step: {
    current: number;
    limit: number;
  };
  ocr: {
    current: number;
    limit: number;
  };
  reset_at: string; // リセット時刻（ISO 8601形式）
}

/**
 * サブスクリプション更新リクエストの型定義
 */
export interface SubscriptionUpdateRequest {
  product_id: string;
  platform: 'ios' | 'android';
  purchase_token?: string; // Android用
  receipt_data?: string;   // iOS用（Base64エンコード）
  package_name?: string;    // Android用
}

/**
 * サブスクリプション更新レスポンスの型定義
 */
export interface SubscriptionUpdateResponse {
  success: boolean;
  plan: PlanInfo;
  error?: string;
}

/**
 * 現在のプラン情報を取得
 * @returns プラン情報
 */
export async function getCurrentPlan(): Promise<PlanInfo> {
  const timer = safeLog.timer('get-current-plan');
  const apiUrl = `${getApiUrl()}/subscription/plan`;
  try {
    safeLog.info(LogCategory.API, 'プラン情報取得API呼び出し開始', { 
      url: apiUrl,
      method: 'GET'
    });
    
    const response = await authenticatedFetch(apiUrl, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.error || `HTTP error! status: ${response.status}`;
      safeLog.error(LogCategory.API, 'プラン情報取得API呼び出し失敗', { 
        url: apiUrl,
        method: 'GET',
        status: response.status, 
        error: errorMessage 
      });
      timer();
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    safeLog.info(LogCategory.API, 'プラン情報取得API呼び出し成功', { 
      url: apiUrl,
      method: 'GET',
      status: response.status,
      plan: data.plan_type 
    });
    
    timer();
    return data;
  } catch (error: any) {
    const errorMessage = error.message || '不明なエラー';
    safeLog.error(LogCategory.API, 'プラン情報取得API呼び出しエラー', { 
      url: apiUrl,
      method: 'GET',
      error: errorMessage 
    });
    timer();
    throw error;
  }
}

/**
 * 本日の利用回数を取得
 * @returns 利用回数情報
 */
export async function getTodayUsage(): Promise<UsageLimitInfo> {
  const timer = safeLog.timer('get-today-usage');
  const apiUrl = `${getApiUrl()}/subscription/usage`;
  try {
    safeLog.info(LogCategory.API, '利用回数取得API呼び出し開始', { 
      url: apiUrl,
      method: 'GET'
    });
    
    const response = await authenticatedFetch(apiUrl, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.error || `HTTP error! status: ${response.status}`;
      safeLog.error(LogCategory.API, '利用回数取得API呼び出し失敗', { 
        url: apiUrl,
        method: 'GET',
        status: response.status, 
        error: errorMessage 
      });
      timer();
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    safeLog.info(LogCategory.API, '利用回数取得API呼び出し成功', { 
      url: apiUrl,
      method: 'GET',
      status: response.status,
      usage: data 
    });
    
    timer();
    return data;
  } catch (error: any) {
    const errorMessage = error.message || '不明なエラー';
    safeLog.error(LogCategory.API, '利用回数取得API呼び出しエラー', { 
      url: apiUrl,
      method: 'GET',
      error: errorMessage 
    });
    timer();
    throw error;
  }
}

/**
 * 機密情報をマスクしてログ出力用の文字列を生成
 * @param value マスクする値
 * @param showLength 長さを表示するか
 * @returns マスクされた文字列
 */
function maskSensitiveValue(value: string | undefined, showLength: boolean = true): string {
  if (!value) return 'undefined';
  if (value.length <= 30) return value.substring(0, 20) + '...';
  const prefix = value.substring(0, 20);
  const suffix = value.substring(value.length - 10);
  return showLength 
    ? `${prefix}...${suffix} (length: ${value.length})`
    : `${prefix}...${suffix}`;
}

/**
 * サブスクリプションを更新（レシート検証含む）
 * @param request サブスクリプション更新リクエスト
 * @returns 更新結果
 */
export async function updateSubscription(
  request: SubscriptionUpdateRequest
): Promise<SubscriptionUpdateResponse> {
  const timer = safeLog.timer('update-subscription');
  const apiUrl = `${getApiUrl()}/subscription/update`;
  try {
    // リクエストボディ全体をログ出力（機密情報はマスク）
    const requestLog = {
      url: apiUrl,
      method: 'POST',
      request_body: {
        product_id: request.product_id,
        platform: request.platform,
        purchase_token: request.purchase_token 
          ? maskSensitiveValue(request.purchase_token)
          : undefined,
        receipt_data: request.receipt_data 
          ? maskSensitiveValue(request.receipt_data)
          : undefined,
        package_name: request.package_name,
        // plan_typeは送信されていないことを明示
        plan_type: undefined,
      },
      // 送信フィールドの有無を明示
      fields_sent: {
        product_id: !!request.product_id,
        platform: !!request.platform,
        purchase_token: !!request.purchase_token,
        receipt_data: !!request.receipt_data,
        package_name: !!request.package_name,
        plan_type: false, // モバイル側はplan_typeを送信していない
      }
    };
    
    safeLog.info(LogCategory.API, 'サブスクリプション更新API呼び出し開始', requestLog);
    
    const response = await authenticatedFetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.error || `HTTP error! status: ${response.status}`;
      safeLog.error(LogCategory.API, 'サブスクリプション更新API呼び出し失敗', { 
        url: apiUrl,
        method: 'POST',
        status: response.status, 
        error: errorMessage,
        request_body: {
          product_id: request.product_id,
          platform: request.platform,
          purchase_token: request.purchase_token 
            ? maskSensitiveValue(request.purchase_token)
            : undefined,
          receipt_data: request.receipt_data 
            ? maskSensitiveValue(request.receipt_data)
            : undefined,
          package_name: request.package_name,
          plan_type: undefined,
        },
        fields_sent: {
          product_id: !!request.product_id,
          platform: !!request.platform,
          purchase_token: !!request.purchase_token,
          receipt_data: !!request.receipt_data,
          package_name: !!request.package_name,
          plan_type: false, // モバイル側はplan_typeを送信していない
        }
      });
      timer();
      return { 
        success: false, 
        error: errorMessage,
        plan: {
          plan_type: 'free',
          subscription_status: 'expired',
        }
      };
    }
    
    const data = await response.json();
    safeLog.info(LogCategory.API, 'サブスクリプション更新API呼び出し成功', { 
      url: apiUrl,
      method: 'POST',
      status: response.status,
      request_body: {
        product_id: request.product_id,
        platform: request.platform,
        purchase_token: request.purchase_token 
          ? maskSensitiveValue(request.purchase_token)
          : undefined,
        receipt_data: request.receipt_data 
          ? maskSensitiveValue(request.receipt_data)
          : undefined,
        package_name: request.package_name,
        plan_type: undefined,
      },
      fields_sent: {
        product_id: !!request.product_id,
        platform: !!request.platform,
        purchase_token: !!request.purchase_token,
        receipt_data: !!request.receipt_data,
        package_name: !!request.package_name,
        plan_type: false, // モバイル側はplan_typeを送信していない
      },
      response_plan: data.plan 
    });
    
    timer();
    return {
      success: true,
      plan: data.plan,
    };
  } catch (error: any) {
    const errorMessage = error.message || '不明なエラー';
    safeLog.error(LogCategory.API, 'サブスクリプション更新API呼び出しエラー', { 
      url: apiUrl,
      method: 'POST',
      error: errorMessage,
      request_body: {
        product_id: request.product_id,
        platform: request.platform,
        purchase_token: request.purchase_token 
          ? maskSensitiveValue(request.purchase_token)
          : undefined,
        receipt_data: request.receipt_data 
          ? maskSensitiveValue(request.receipt_data)
          : undefined,
        package_name: request.package_name,
        plan_type: undefined,
      },
      fields_sent: {
        product_id: !!request.product_id,
        platform: !!request.platform,
        purchase_token: !!request.purchase_token,
        receipt_data: !!request.receipt_data,
        package_name: !!request.package_name,
        plan_type: false, // モバイル側はplan_typeを送信していない
      }
    });
    timer();
    return { 
      success: false, 
      error: errorMessage,
      plan: {
        plan_type: 'free',
        subscription_status: 'expired',
      }
    };
  }
}


