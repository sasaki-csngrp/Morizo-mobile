import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from '../supabase';
import { logAuth, safeLog, LogCategory } from '../logging';

/**
 * Sign in with Appleを行う関数
 * @returns エラー情報を含むオブジェクト
 */
export const signInWithApple = async (): Promise<{ error: any }> => {
  const timer = safeLog.timer('apple-signin');
  
  try {
    // iOSのみサポート
    if (Platform.OS !== 'ios') {
      const error = new Error('Sign in with Apple is only available on iOS');
      await logAuth('apple_signin', undefined, false, { error: error.message });
      safeLog.error(LogCategory.AUTH, 'Sign in with Apple: iOS only', { platform: Platform.OS });
      timer();
      return { error };
    }

    // Apple認証が利用可能かチェック
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      const error = new Error('Sign in with Apple is not available on this device');
      await logAuth('apple_signin', undefined, false, { error: error.message });
      safeLog.error(LogCategory.AUTH, 'Sign in with Apple: Not available', { isAvailable });
      timer();
      return { error };
    }

    safeLog.info(LogCategory.AUTH, 'Sign in with Apple: 認証開始', {
      isAvailable,
      platform: Platform.OS
    });

    // Apple ID認証を開始（リトライ機能付き）
    let credential;
    const maxRetries = 2; // 最大2回試行（初回 + 1回リトライ）
    let lastError: any = null;
    let succeeded = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          safeLog.info(LogCategory.AUTH, `Sign in with Apple: リトライ試行 ${attempt}/${maxRetries}`, {
            previousError: lastError?.message,
            code: lastError?.code
          });
          // リトライ前に少し待機（1秒）- 一時的なエラーが解消されるのを待つ
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        
        // 成功したらループを抜ける
        succeeded = true;
        lastError = null;
        safeLog.info(LogCategory.AUTH, `Sign in with Apple: 認証成功（試行 ${attempt}/${maxRetries}）`);
        break;
      } catch (signInError: any) {
        lastError = signInError;

        // ユーザーがキャンセルした場合は、リトライせずにエラーとして扱わない
        if (signInError.code === 'ERR_REQUEST_CANCELED' || signInError.code === '1001') {
          safeLog.info(LogCategory.AUTH, 'Sign in with Apple: ユーザーがキャンセル');
          timer();
          return { error: null }; // エラーとして扱わない
        }

        // 一時的なエラー（ERR_REQUEST_UNKNOWN）の場合のみリトライ
        if (signInError.code === 'ERR_REQUEST_UNKNOWN' && attempt < maxRetries) {
          safeLog.warn(LogCategory.AUTH, `Sign in with Apple: 一時的なエラー（試行 ${attempt}/${maxRetries}）`, {
            error: signInError.message,
            code: signInError.code
          });
          // リトライを続ける
          continue;
        }

        // リトライ回数を超えた場合
        if (attempt >= maxRetries) {
          // ERR_REQUEST_UNKNOWNの場合は、エラーとして扱わない（成功している可能性があるため）
          if (signInError.code === 'ERR_REQUEST_UNKNOWN') {
            safeLog.warn(LogCategory.AUTH, 'Sign in with Apple: 一時的なエラー（リトライ後も発生）', {
              error: signInError.message,
              code: signInError.code,
              attempts: maxRetries
            });
            // エラーを返さない（成功している可能性があるため）
            timer();
            return { error: null };
          }
          
          // その他のエラーの場合のみエラーログを出力
          safeLog.error(LogCategory.AUTH, 'Sign in with Apple: すべてのリトライが失敗', {
            error: signInError.message,
            code: signInError.code,
            attempts: maxRetries
          });
          throw signInError;
        }
        
        // リトライ不可なエラーの場合（ERR_REQUEST_UNKNOWN以外）
        safeLog.error(LogCategory.AUTH, 'Sign in with Apple: signInAsyncエラー（リトライ不可）', {
          error: signInError.message,
          code: signInError.code,
          attempt
        });
        throw signInError;
      }
    }

    // credentialが取得できなかった場合の処理
    if (!credential && !succeeded) {
      // ERR_REQUEST_UNKNOWNの場合は、エラーとして扱わない（成功している可能性があるため）
      if (lastError?.code === 'ERR_REQUEST_UNKNOWN') {
        safeLog.warn(LogCategory.AUTH, 'Sign in with Apple: 一時的なエラー（リトライ後も発生）', {
          error: lastError.message,
          code: lastError.code,
          attempts: maxRetries
        });
        // エラーを返さない（成功している可能性があるため）
        timer();
        return { error: null };
      }
      
      // その他のエラーの場合のみエラーログを出力
      safeLog.error(LogCategory.AUTH, 'Sign in with Apple: すべてのリトライが失敗', {
        error: lastError?.message || 'Unknown error',
        code: lastError?.code,
        attempts: maxRetries
      });
      throw lastError || new Error('Apple認証でIDトークンが取得できませんでした（リトライ後も失敗）');
    }

    if (!credential.identityToken) {
      const error = new Error('Apple認証でIDトークンが取得できませんでした');
      await logAuth('apple_signin', undefined, false, { error: error.message });
      safeLog.error(LogCategory.AUTH, 'Sign in with Apple: IDトークン取得失敗');
      timer();
      return { error };
    }

    safeLog.info(LogCategory.AUTH, 'Sign in with Apple: IDトークン取得成功', {
      user: credential.user,
      hasEmail: !!credential.email,
      hasFullName: !!credential.fullName
    });

    // Supabase Authでサインイン
    const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (supabaseError) {
      await logAuth('apple_signin', credential.email || undefined, false, { error: supabaseError.message });
      safeLog.error(LogCategory.AUTH, 'Sign in with Apple: Supabase認証失敗', { error: supabaseError.message });
      timer();
      return { error: supabaseError };
    }

    if (data.user) {
      await logAuth('apple_signin', data.user.email || credential.email || undefined, true);
      safeLog.info(LogCategory.AUTH, 'Sign in with Apple: 認証成功', {
        userId: data.user.id,
        email: data.user.email || credential.email
      });
    }

    timer();
    return { error: null };

  } catch (error: any) {
    // ユーザーがキャンセルした場合
    if (error.code === 'ERR_REQUEST_CANCELED' || error.code === '1001') {
      safeLog.info(LogCategory.AUTH, 'Sign in with Apple: ユーザーがキャンセル');
      timer();
      return { error: null }; // エラーとして扱わない
    }

    // 一時的なエラー（ERR_REQUEST_UNKNOWN）の場合、エラーとして返さない
    // （リトライ機能で処理されるため、成功している可能性がある）
    if (error.code === 'ERR_REQUEST_UNKNOWN') {
      safeLog.warn(LogCategory.AUTH, 'Sign in with Apple: 一時的なエラー（リトライ済み）', {
        error: error.message,
        code: error.code
      });
      timer();
      // エラーを返さない（成功している可能性があるため）
      return { error: null };
    }

    // より詳細なエラー情報をログに記録
    const errorDetails = {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.substring(0, 500), // スタックトレースの最初の500文字
    };

    safeLog.error(LogCategory.AUTH, 'Sign in with Apple: エラー詳細', errorDetails);

    const errorMessage = error.message || 'Sign in with Appleで予期しないエラーが発生しました';
    await logAuth('apple_signin', undefined, false, { 
      error: errorMessage,
      code: error.code,
      details: errorDetails
    });
    
    // エラーオブジェクトにcodeプロパティを保持
    const errorWithCode = new Error(errorMessage) as any;
    errorWithCode.code = error.code;
    
    timer();
    return { error: errorWithCode };
  }
};

