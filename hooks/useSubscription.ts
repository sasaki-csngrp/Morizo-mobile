import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentPlan, 
  getTodayUsage, 
  PlanInfo,
  UsageLimitInfo 
} from '../api/subscription-api';
import { PLAN_LIMITS } from '../config/subscription';
import { safeLog, LogCategory } from '../lib/logging';
import { showErrorAlert } from '../utils/alert';
import { getNextResetTime } from '../lib/subscription/utils';

/**
 * サブスクリプションデータ管理フック
 * プラン情報と利用回数情報の取得・管理を担当
 */
export function useSubscription() {
  const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageLimitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 利用回数データの正規化
   */
  const normalizeUsageData = useCallback((
    usageData: any,
    planType: string
  ): UsageLimitInfo => {
    if (!usageData) {
      return createDefaultUsageInfo(planType);
    }

    // データ構造が既に期待通り（menu_bulk, menu_step, ocrがオブジェクト）の場合
    if (usageData.menu_bulk && typeof usageData.menu_bulk === 'object' && 'current' in usageData.menu_bulk && 'limit' in usageData.menu_bulk) {
      // 既に正しい構造の場合
      return usageData as UsageLimitInfo;
    }

    // データ構造が異なる場合（フラットな構造など）の処理
    // 例: { menu_bulk_count: 0, menu_step_count: 0, ocr_count: 0, ... }
    const limits = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS];
    
    // フラットな構造から取得を試みる
    const menuBulkCount = usageData.menu_bulk_count ?? usageData.menu_bulk?.current ?? 0;
    const menuStepCount = usageData.menu_step_count ?? usageData.menu_step?.current ?? 0;
    const ocrCount = usageData.ocr_count ?? usageData.ocr?.current ?? 0;
    
    return {
      menu_bulk: {
        current: menuBulkCount,
        limit: limits.menu_bulk,
      },
      menu_step: {
        current: menuStepCount,
        limit: limits.menu_step,
      },
      ocr: {
        current: ocrCount,
        limit: limits.ocr,
      },
      reset_at: usageData.reset_at || getNextResetTime(),
    };
  }, []);

  /**
   * デフォルトの利用回数情報を作成
   */
  const createDefaultUsageInfo = useCallback((planType: string): UsageLimitInfo => {
    const limits = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS];
    return {
      menu_bulk: { current: 0, limit: limits.menu_bulk },
      menu_step: { current: 0, limit: limits.menu_step },
      ocr: { current: 0, limit: limits.ocr },
      reset_at: getNextResetTime(),
    };
  }, []);

  /**
   * サブスクリプションデータの読み込み
   */
  const loadSubscriptionData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [planData, usageData] = await Promise.all([
        getCurrentPlan(),
        getTodayUsage(),
      ]);
      setCurrentPlan(planData);
      
      // データ構造を検証してから設定
      if (usageData) {
        // バックエンドから返ってくるデータ構造を確認
        safeLog.info(LogCategory.API, '利用回数データ取得', { 
          usageData: JSON.stringify(usageData),
          planType: planData?.plan_type 
        });
        
        // 利用回数データの正規化
        const normalizedUsageData = normalizeUsageData(usageData, planData?.plan_type || 'free');
        
        safeLog.info(LogCategory.API, '利用回数データ正規化', { 
          normalized: normalizedUsageData 
        });
        
        setUsageInfo(normalizedUsageData);
      } else {
        // usageDataがnull/undefinedの場合
        safeLog.warn(LogCategory.API, '利用回数データがnull/undefinedです');
        const currentPlanType = planData?.plan_type || 'free';
        const defaultUsageInfo = createDefaultUsageInfo(currentPlanType);
        setUsageInfo(defaultUsageInfo);
      }
    } catch (error: any) {
      safeLog.error(LogCategory.API, 'サブスクリプションデータ取得エラー', { 
        error: error.message 
      });
      showErrorAlert('プラン情報の取得に失敗しました');
      
      // エラー時はデフォルト値（freeプラン）を設定
      // 既存のcurrentPlanがある場合は維持し、usageInfoのみ更新
      setCurrentPlan((prevPlan) => {
        const currentPlanType = prevPlan?.plan_type || 'free';
        const defaultUsageInfo = createDefaultUsageInfo(currentPlanType);
        setUsageInfo(defaultUsageInfo);
        return prevPlan; // プラン情報は更新しない（既存の値を維持）
      });
    } finally {
      setIsLoading(false);
    }
  }, [normalizeUsageData, createDefaultUsageInfo]);

  // 初期化時にデータを読み込む
  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  return {
    currentPlan,
    usageInfo,
    isLoading,
    loadSubscriptionData,
    setCurrentPlan, // 購入成功時に更新するため
  };
}

