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
  try {
    safeLog.info(LogCategory.API, 'プラン情報取得API呼び出し開始');
    
    const apiUrl = `${getApiUrl()}/subscription/plan`;
    
    const response = await authenticatedFetch(apiUrl, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.error || `HTTP error! status: ${response.status}`;
      safeLog.error(LogCategory.API, 'プラン情報取得API呼び出し失敗', { 
        url: apiUrl,
        status: response.status, 
        error: errorMessage 
      });
      timer();
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    safeLog.info(LogCategory.API, 'プラン情報取得API呼び出し成功', { 
      plan: data.plan_type 
    });
    
    timer();
    return data;
  } catch (error: any) {
    const errorMessage = error.message || '不明なエラー';
    const apiUrl = `${getApiUrl()}/subscription/plan`;
    safeLog.error(LogCategory.API, 'プラン情報取得API呼び出しエラー', { 
      url: apiUrl,
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
  try {
    safeLog.info(LogCategory.API, '利用回数取得API呼び出し開始');
    
    const apiUrl = `${getApiUrl()}/subscription/usage`;
    
    const response = await authenticatedFetch(apiUrl, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.error || `HTTP error! status: ${response.status}`;
      safeLog.error(LogCategory.API, '利用回数取得API呼び出し失敗', { 
        url: apiUrl,
        status: response.status, 
        error: errorMessage 
      });
      timer();
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    safeLog.info(LogCategory.API, '利用回数取得API呼び出し成功', { 
      usage: data 
    });
    
    timer();
    return data;
  } catch (error: any) {
    const errorMessage = error.message || '不明なエラー';
    const apiUrl = `${getApiUrl()}/subscription/usage`;
    safeLog.error(LogCategory.API, '利用回数取得API呼び出しエラー', { 
      url: apiUrl,
      error: errorMessage 
    });
    timer();
    throw error;
  }
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
  try {
    safeLog.info(LogCategory.API, 'サブスクリプション更新API呼び出し開始', { 
      product_id: request.product_id,
      platform: request.platform 
    });
    
    const apiUrl = `${getApiUrl()}/subscription/update`;
    
    const response = await authenticatedFetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.error || `HTTP error! status: ${response.status}`;
      safeLog.error(LogCategory.API, 'サブスクリプション更新API呼び出し失敗', { 
        url: apiUrl,
        status: response.status, 
        error: errorMessage 
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
      plan: data.plan 
    });
    
    timer();
    return {
      success: true,
      plan: data.plan,
    };
  } catch (error: any) {
    const errorMessage = error.message || '不明なエラー';
    const apiUrl = `${getApiUrl()}/subscription/update`;
    safeLog.error(LogCategory.API, 'サブスクリプション更新API呼び出しエラー', { 
      url: apiUrl,
      error: errorMessage 
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

