/**
 * サブスクリプション商品IDの設定
 * 
 * このファイルには、Google Play Console / App Store Connectで登録した
 * 商品IDを定義します。
 * 
 * 重要: 商品IDは変更が困難なため、慎重に決定してください。
 * ストア設定完了後、このファイルを更新してください。
 */

export const SUBSCRIPTION_PRODUCTS = {
  PRO_MONTHLY: 'morizo_pro_monthly',
  PRO_YEARLY: 'morizo_pro_yearly',
  ULTIMATE_MONTHLY: 'morizo_ultimate_monthly',
  ULTIMATE_YEARLY: 'morizo_ultimate_yearly',
} as const;

/**
 * プランタイプ
 */
export type PlanType = 'free' | 'pro' | 'ultimate';

/**
 * プランタイプから商品IDへのマッピング（デフォルトは月額）
 */
export const PLAN_TO_PRODUCT_ID: Record<PlanType, string> = {
  free: '', // 無料プランには商品IDなし
  pro: SUBSCRIPTION_PRODUCTS.PRO_MONTHLY,
  ultimate: SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY,
};

/**
 * 商品IDからプランタイプへのマッピング
 */
export const PRODUCT_ID_TO_PLAN: Record<string, PlanType> = {
  [SUBSCRIPTION_PRODUCTS.PRO_MONTHLY]: 'pro',
  [SUBSCRIPTION_PRODUCTS.PRO_YEARLY]: 'pro',
  [SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY]: 'ultimate',
  [SUBSCRIPTION_PRODUCTS.ULTIMATE_YEARLY]: 'ultimate',
};

/**
 * プラン制限の定義
 */
export const PLAN_LIMITS: Record<PlanType, {
  menu_bulk: number;  // 献立一括提案: 回/日
  menu_step: number;  // 段階的提案: 回/日
  ocr: number;        // OCR読み取り: 回/日
}> = {
  free: {
    menu_bulk: 1,
    menu_step: 3,
    ocr: 1,
  },
  pro: {
    menu_bulk: 10,
    menu_step: 30,
    ocr: 10,
  },
  ultimate: {
    menu_bulk: 100,
    menu_step: 300,
    ocr: 100,
  },
};

/**
 * プラン名の表示用テキスト
 */
export const PLAN_DISPLAY_NAMES: Record<PlanType, string> = {
  free: '無料プラン',
  pro: 'PRO',
  ultimate: 'ULTIMATE',
};

