import { Platform } from 'react-native';

/**
 * API URL設定を管理する共通モジュール
 * 
 * 環境変数からAPI URLを取得し、プラットフォームに応じたURLを返す
 * 
 * 環境変数:
 * - EXPO_PUBLIC_API_URL: 本番環境のAPI URL（例: https://morizo-web.vercel.app）
 * - EXPO_PUBLIC_API_URL_WEB: Web版開発環境のAPI URL（デフォルト: http://localhost:3000）
 * - EXPO_PUBLIC_API_URL_MOBILE: モバイル版開発環境のAPI URL（デフォルト: http://192.168.1.12:3000）
 */
export function getApiUrl(): string {
  // 本番環境のURL（環境変数から取得）
  const productionUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // 開発環境の場合
  if (__DEV__) {
    if (Platform.OS === 'web') {
      // Web版開発環境
      return process.env.EXPO_PUBLIC_API_URL_WEB || 'http://localhost:3000/api';
    } else {
      // モバイル版開発環境
      return process.env.EXPO_PUBLIC_API_URL_MOBILE || 'http://192.168.1.12:3000/api';
    }
  }
  
  // 本番環境
  if (productionUrl) {
    // 環境変数に /api が含まれていない場合は追加
    return productionUrl.endsWith('/api') ? productionUrl : `${productionUrl}/api`;
  }
  
  // フォールバック（本番環境のデフォルト）
  return 'https://morizo-web.vercel.app/api';
}

