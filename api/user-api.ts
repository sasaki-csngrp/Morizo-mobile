import { authenticatedFetch } from './recipe-api';
import { getApiUrl } from '../lib/api-config';
import { safeLog, LogCategory } from '../lib/logging';

/**
 * アカウント削除API呼び出し
 * @returns 削除結果を含むオブジェクト
 */
export const deleteUserAccount = async (): Promise<{ success: boolean; error?: string }> => {
  const timer = safeLog.timer('delete-user-account');
  try {
    safeLog.info(LogCategory.AUTH, 'アカウント削除API呼び出し開始');
    
    const apiUrl = `${getApiUrl()}/user/account`;
    
    const response = await authenticatedFetch(apiUrl, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.details || `HTTP error! status: ${response.status}`;
      safeLog.error(LogCategory.AUTH, 'アカウント削除API呼び出し失敗', { 
        status: response.status, 
        error: errorMessage 
      });
      timer();
      return { success: false, error: errorMessage };
    }
    
    const data = await response.json();
    safeLog.info(LogCategory.AUTH, 'アカウント削除API呼び出し成功', { 
      success: data.success 
    });
    
    timer();
    return { success: data.success || true, error: undefined };
  } catch (error: any) {
    const errorMessage = error.message || '不明なエラー';
    safeLog.error(LogCategory.AUTH, 'アカウント削除API呼び出しエラー', { 
      error: errorMessage 
    });
    timer();
    return { success: false, error: errorMessage };
  }
};

