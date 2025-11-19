import { Platform } from 'react-native';

/**
 * API URL設定を管理する共通モジュール
 * 
 * 環境変数からAPI URLを取得し、プラットフォームに応じたURLを返す
 * 
 * 動作:
 * - 本番ビルド（__DEV__ === false）: EXPO_PUBLIC_API_URL を使用（/api は自動追加）
 * - 開発環境（__DEV__ === true）:
 *   - Web版: EXPO_PUBLIC_API_URL_WEB または EXPO_PUBLIC_API_URL（本番URL）またはデフォルト
 *   - モバイル版: EXPO_PUBLIC_API_URL_MOBILE が設定されている場合はそれを使用
 *                 未設定の場合は EXPO_PUBLIC_API_URL（本番URL）を優先使用
 *                 どちらも未設定の場合はデフォルトのローカル開発環境
 * 
 * 環境変数:
 * - EXPO_PUBLIC_API_URL: 本番環境のAPI URL（例: https://morizo.csngrp.co.jp）
 *   ※ /api は自動的に追加されるため、ベースURLのみ指定
 *   ※ 開発環境でも、EXPO_PUBLIC_API_URL_MOBILE が未設定の場合は優先的に使用される
 * - EXPO_PUBLIC_API_URL_WEB: Web版開発環境のAPI URL（オプション）
 *   ※ 未設定の場合は EXPO_PUBLIC_API_URL またはデフォルトを使用
 * - EXPO_PUBLIC_API_URL_MOBILE: モバイル版開発環境のAPI URL（オプション）
 *   ※ 特別な不具合調査時のみ設定（設定するとローカル開発環境を使用）
 *   ※ 未設定の場合は EXPO_PUBLIC_API_URL（本番URL）を自動的に使用
 */
export function getApiUrl(): string {
  // 本番環境のURL（環境変数から取得）
  const productionUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // 開発環境の場合
  if (__DEV__) {
    if (Platform.OS === 'web') {
      // Web版開発環境
      // EXPO_PUBLIC_API_URL_WEB が設定されていない場合は、本番URLを優先
      const webUrl = process.env.EXPO_PUBLIC_API_URL_WEB || 
                     (productionUrl ? (productionUrl.endsWith('/api') ? productionUrl : `${productionUrl}/api`) : 'http://localhost:3000/api');
      console.log('🔍 [getApiUrl] Web開発環境:', { 
        webUrl: process.env.EXPO_PUBLIC_API_URL_WEB, 
        productionUrl, 
        selected: webUrl 
      });
      return webUrl;
    } else {
      // モバイル版開発環境
      // EXPO_PUBLIC_API_URL_MOBILE が設定されていない場合は、本番URLを優先
      // 特別な不具合調査時のみ EXPO_PUBLIC_API_URL_MOBILE を設定してローカル環境を使用
      if (process.env.EXPO_PUBLIC_API_URL_MOBILE) {
        console.log('🔍 [getApiUrl] モバイル開発環境（ローカル）:', process.env.EXPO_PUBLIC_API_URL_MOBILE);
        return process.env.EXPO_PUBLIC_API_URL_MOBILE;
      }
      // 本番URLが設定されている場合はそれを使用
      if (productionUrl) {
        const finalUrl = productionUrl.endsWith('/api') ? productionUrl : `${productionUrl}/api`;
        console.log('🔍 [getApiUrl] モバイル開発環境（本番URL使用）:', { productionUrl, finalUrl });
        return finalUrl;
      }
      // フォールバック: デフォルトのローカル開発環境
      console.log('🔍 [getApiUrl] モバイル開発環境（デフォルト）: http://192.168.1.12:3000/api');
      return 'http://192.168.1.12:3000/api';
    }
  }
  
  // 本番環境（__DEV__ === false）
  if (productionUrl) {
    // 環境変数に /api が含まれていない場合は追加
    const finalUrl = productionUrl.endsWith('/api') ? productionUrl : `${productionUrl}/api`;
    console.log('🔍 [getApiUrl] 本番環境:', { productionUrl, finalUrl });
    return finalUrl;
  }
  
  // フォールバック（本番環境のデフォルト）
  console.log('🔍 [getApiUrl] 本番環境（デフォルト）: https://morizo-web.vercel.app/api');
  return 'https://morizo-web.vercel.app/api';
}

