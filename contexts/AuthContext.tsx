import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { safeLog, LogCategory } from '../lib/logging';
import { AuthContextType, AuthProviderProps } from '../lib/auth/types';
import { clearInvalidSession, clearSession as clearSessionStorage } from '../lib/auth/session-manager';
import { signIn as signInMethod, signUp as signUpMethod, signOut as signOutMethod } from '../lib/auth/auth-methods';
import { useAuthStateListener } from '../lib/auth/auth-state-listener';
import { useDeepLinkingHandler } from '../lib/auth/deep-linking-handler';
import { signInWithGoogle as signInWithGoogleMethod } from '../lib/auth/google-auth';
import { signInWithApple as signInWithAppleMethod } from '../lib/auth/apple-auth';
import { deleteUserAccount } from '../api/user-api';
import { supabase } from '../lib/supabase';

// WebBrowserをクリーンアップ（メモリリーク防止）
WebBrowser.maybeCompleteAuthSession();

// コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // ロギング初期化
  useEffect(() => {
    safeLog.info(LogCategory.AUTH, 'AuthProvider初期化開始');
  }, []);

  // 無効セッションクリア関数（状態更新を含む）- useCallbackでメモ化
  const handleClearInvalidSession = useCallback(async () => {
    setSession(null);
    setUser(null);
    await clearInvalidSession();
  }, []);

  // セッション強制クリア関数（デバッグ用、状態更新を含む）
  const clearSession = async () => {
    setSession(null);
    setUser(null);
    await clearSessionStorage();
  };

  // 認証状態の監視と初期セッション取得
  useAuthStateListener({
    setSession,
    setUser,
    setLoading,
    setInitialized,
    handleClearInvalidSession,
  });

  // Deep Linking処理
  useDeepLinkingHandler();

  // サインイン関数
  const signIn = async (email: string, password: string) => {
    return await signInMethod(email, password);
  };

  // サインアップ関数
  const signUp = async (email: string, password: string) => {
    return await signUpMethod(email, password);
  };

  // Google認証関数
  const signInWithGoogle = async () => {
    return await signInWithGoogleMethod();
  };

  // Apple認証関数
  const signInWithApple = async () => {
    return await signInWithAppleMethod();
  };

  // サインアウト関数
  const signOut = async () => {
    const userEmail = user?.email;
    
    // まず状態を即座にクリア（エラーが出てもログアウトを確実に実行）
    setSession(null);
    setUser(null);
    
    // サインアウト処理を実行
    try {
      await signOutMethod(userEmail);
      
      // セッションストレージも確実にクリア
      await clearSessionStorage();
      
      // 最終確認：セッションが完全にクリアされたことを確認
      const { data: { session: finalSession } } = await supabase.auth.getSession();
      if (finalSession) {
        safeLog.warn(LogCategory.AUTH, 'ログアウト後もセッションが残っています。強制クリアを実行します');
        // 強制的にストレージをクリア
        await clearSessionStorage();
        // 再度Supabaseのサインアウトを実行
        await supabase.auth.signOut();
      } else {
        safeLog.info(LogCategory.AUTH, 'ログアウトが完全に完了しました');
      }
    } catch (error: any) {
      safeLog.error(LogCategory.AUTH, 'サインアウト処理でエラー', { error: error.message });
      
      // エラーが出てもローカルストレージをクリア
      try {
        await clearSessionStorage();
        // Supabaseのサインアウトも試みる
        await supabase.auth.signOut();
      } catch (storageError: any) {
        safeLog.error(LogCategory.AUTH, 'ストレージクリアエラー', { error: storageError.message });
      }
    }
  };

  // アカウント削除関数
  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    safeLog.info(LogCategory.AUTH, 'アカウント削除処理開始');
    
    try {
      // API呼び出し
      const result = await deleteUserAccount();
      
      if (!result.success) {
        safeLog.error(LogCategory.AUTH, 'アカウント削除失敗', { error: result.error });
        return result;
      }
      
      // 削除成功後、ログアウト処理を実行
      safeLog.info(LogCategory.AUTH, 'アカウント削除成功、ログアウト処理を実行');
      await signOut();
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || '不明なエラー';
      safeLog.error(LogCategory.AUTH, 'アカウント削除処理でエラー', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    initialized,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    deleteAccount,
    clearSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
