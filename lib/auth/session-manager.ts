import { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { logSession, logStorage, safeLog, LogCategory } from '../logging';

/**
 * セッションの有効性をチェック
 * @param session チェックするセッション
 * @returns セッションが有効な場合true
 */
export const isSessionValid = (session: Session | null): boolean => {
  if (!session?.access_token || !session?.expires_at) return false;
  
  // 有効期限チェック（5分のマージンを設ける）
  const now = Date.now() / 1000;
  const expiresAt = session.expires_at;
  const margin = 5 * 60; // 5分
  
  const isValid = expiresAt > (now + margin);
  
  // ログ出力
  safeLog.debug(LogCategory.AUTH, 'セッション有効性チェック', { 
    expiresAt, 
    now, 
    margin, 
    isValid 
  });
  
  return isValid;
};

/**
 * 無効なセッションをクリア
 * 注意: この関数は状態更新を行わないため、呼び出し元で状態を更新する必要があります
 */
export const clearInvalidSession = async (): Promise<void> => {
  safeLog.info(LogCategory.AUTH, '無効セッションをクリアします');
  try {
    await supabase.auth.signOut();
    await logSession('clear_invalid_session');
  } catch (error: any) {
    safeLog.error(LogCategory.AUTH, 'セッションクリアエラー', { error: error.message });
  }
};

/**
 * セッションを強制クリア（デバッグ用）
 * 注意: この関数は状態更新を行わないため、呼び出し元で状態を更新する必要があります
 */
export const clearSession = async (): Promise<void> => {
  safeLog.info(LogCategory.AUTH, 'セッションを強制クリアします');
  
  // Supabaseのサインアウトを実行
  try {
    await supabase.auth.signOut();
  } catch (error: any) {
    safeLog.warn(LogCategory.AUTH, 'Supabaseサインアウトエラー（続行）', { error: error.message });
  }
  
  // プラットフォーム対応のストレージクリア
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // すべてのSupabase関連キーを削除
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth-token'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      safeLog.debug(LogCategory.AUTH, 'localStorageからキーを削除', { key: key.replace(/token|key|password/gi, '***') });
    });
    
    await logStorage('clear_localStorage', 'all-auth-keys');
    safeLog.info(LogCategory.AUTH, 'localStorageからすべての認証キーをクリアしました', { count: keysToRemove.length });
  } else {
    // モバイル版ではAsyncStorageをクリア
    try {
      // すべてのキーを取得してSupabase関連のものを削除
      const allKeys = await AsyncStorage.getAllKeys();
      const supabaseKeys = allKeys.filter(key => 
        key.includes('supabase') || 
        key.includes('sb-') || 
        key.includes('auth-token') ||
        key.includes('loputwcsrmwgkeydxcba') // プロジェクトIDを含むキー
      );
      
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
        supabaseKeys.forEach(key => {
          safeLog.debug(LogCategory.AUTH, 'AsyncStorageからキーを削除', { key: key.replace(/token|key|password/gi, '***') });
        });
      }
      
      await logStorage('clear_AsyncStorage', 'all-auth-keys');
      safeLog.info(LogCategory.AUTH, 'AsyncStorageからすべての認証キーをクリアしました', { count: supabaseKeys.length });
    } catch (error: any) {
      safeLog.error(LogCategory.AUTH, 'AsyncStorageクリアエラー', { error: error.message });
    }
  }
  
  // セッションが完全にクリアされたことを確認
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    safeLog.warn(LogCategory.AUTH, 'セッションがまだ残っています。再度クリアを試みます');
    // 再度サインアウトを試みる
    await supabase.auth.signOut();
  } else {
    safeLog.info(LogCategory.AUTH, 'セッションが完全にクリアされました');
  }
};

