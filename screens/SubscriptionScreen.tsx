import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PlanCard } from '../components/PlanCard';
import { 
  getCurrentPlan, 
  getTodayUsage, 
  updateSubscription,
  PlanInfo,
  UsageLimitInfo 
} from '../api/subscription-api';
import { PlanType, PLAN_DISPLAY_NAMES, SUBSCRIPTION_PRODUCTS } from '../config/subscription';
import { showErrorAlert, showSuccessAlert } from '../utils/alert';
import { safeLog, LogCategory } from '../lib/logging';
import Constants from 'expo-constants';

// RevenueCatのインポート（Expo Go環境では使用不可）
let Purchases: any = null;
let CustomerInfo: any = null;
let PurchasesOffering: any = null;
let PurchasesPackage: any = null;

// Expo Go環境の検出（安全な方法）
// ExecutionEnvironmentが存在しない場合（Expo Go環境など）は、常にExpo Goとみなす
let isExpoGo = false;
try {
  // ExecutionEnvironmentが存在するかチェック
  if (Constants.ExecutionEnvironment && Constants.executionEnvironment) {
    isExpoGo = Constants.executionEnvironment === Constants.ExecutionEnvironment.StoreClient;
  } else {
    // ExecutionEnvironmentが存在しない場合は、Expo Go環境とみなす
    isExpoGo = true;
  }
} catch (error) {
  // エラーが発生した場合は、Expo Go環境とみなす
  isExpoGo = true;
}

// Expo Go環境でない場合のみインポートを試みる
if (!isExpoGo) {
  try {
    const purchasesModule = require('react-native-purchases');
    Purchases = purchasesModule.default;
    CustomerInfo = purchasesModule.CustomerInfo;
    PurchasesOffering = purchasesModule.PurchasesOffering;
    PurchasesPackage = purchasesModule.PurchasesPackage;
  } catch (error) {
    // モジュールが見つからない場合は無視（Expo Go環境など）
    // safeLogはまだ初期化されていない可能性があるため、console.logを使用
    console.warn('[SubscriptionScreen] react-native-purchasesが見つかりません。Expo Go環境の可能性があります。');
    isExpoGo = true; // モジュールが見つからない場合はExpo Goとみなす
  }
}

interface SubscriptionScreenProps {
  onClose?: () => void;
}

export default function SubscriptionScreen({ onClose }: SubscriptionScreenProps = {}) {
  const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageLimitInfo | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [isRevenueCatAvailable, setIsRevenueCatAvailable] = useState(!isExpoGo && Purchases !== null);

  // 初期化とデータ取得
  useEffect(() => {
    initializePurchases();
    loadSubscriptionData();
  }, []);

  // RevenueCatの初期化
  const initializePurchases = async () => {
    // Expo Go環境ではRevenueCatを使用できない
    if (isExpoGo || !Purchases) {
      safeLog.info(LogCategory.API, 'RevenueCatはExpo Go環境では使用できません。バックエンドAPI連携のみ動作します。');
      setIsRevenueCatAvailable(false);
      return;
    }

    try {
      // RevenueCatのAPIキーは環境変数から取得
      // 優先順位: テストストア用 > プラットフォーム固有
      const revenueCatApiKey = 
        process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || // テストストア用（優先）
        Platform.select({
          ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
          android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
        });

      if (!revenueCatApiKey) {
        safeLog.warn(LogCategory.API, 'RevenueCat APIキーが設定されていません');
        setIsRevenueCatAvailable(false);
        return;
      }

      await Purchases.configure({ apiKey: revenueCatApiKey });
      safeLog.info(LogCategory.API, 'RevenueCat初期化成功');
      setIsRevenueCatAvailable(true);

      // オファリングを取得
      const offeringsData = await Purchases.getOfferings();
      if (offeringsData.current) {
        setOfferings(offeringsData.current);
      }
    } catch (error: any) {
      safeLog.error(LogCategory.API, 'RevenueCat初期化エラー', { error: error.message });
      setIsRevenueCatAvailable(false);
      // エラーが発生しても続行（オフライン環境など）
    }
  };

  // サブスクリプションデータの読み込み
  const loadSubscriptionData = async () => {
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
        
        // データ構造が期待通りでない場合のフォールバック
        // バックエンドから返ってくるデータ構造に応じて処理
        let normalizedUsageData: UsageLimitInfo;
        
        // データ構造が既に期待通り（menu_bulk, menu_step, ocrがオブジェクト）の場合
        if (usageData.menu_bulk && typeof usageData.menu_bulk === 'object' && 'current' in usageData.menu_bulk && 'limit' in usageData.menu_bulk) {
          // 既に正しい構造の場合
          normalizedUsageData = usageData as UsageLimitInfo;
        } else {
          // データ構造が異なる場合（フラットな構造など）の処理
          // 例: { menu_bulk_count: 0, menu_step_count: 0, ocr_count: 0, ... }
          const currentPlanType = planData?.plan_type || 'free';
          const { PLAN_LIMITS } = require('../config/subscription');
          const limits = PLAN_LIMITS[currentPlanType];
          
          // フラットな構造から取得を試みる
          const menuBulkCount = (usageData as any).menu_bulk_count ?? (usageData as any).menu_bulk?.current ?? 0;
          const menuStepCount = (usageData as any).menu_step_count ?? (usageData as any).menu_step?.current ?? 0;
          const ocrCount = (usageData as any).ocr_count ?? (usageData as any).ocr?.current ?? 0;
          
          normalizedUsageData = {
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
            reset_at: (usageData as any).reset_at || new Date().toISOString(),
          };
          
          safeLog.info(LogCategory.API, '利用回数データ正規化', { 
            normalized: normalizedUsageData 
          });
        }
        
        setUsageInfo(normalizedUsageData);
      } else {
        // usageDataがnull/undefinedの場合
        safeLog.warn(LogCategory.API, '利用回数データがnull/undefinedです');
        const currentPlanType = planData?.plan_type || 'free';
        const { PLAN_LIMITS } = require('../config/subscription');
        const limits = PLAN_LIMITS[currentPlanType];
        
        setUsageInfo({
          menu_bulk: { current: 0, limit: limits.menu_bulk },
          menu_step: { current: 0, limit: limits.menu_step },
          ocr: { current: 0, limit: limits.ocr },
          reset_at: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      safeLog.error(LogCategory.API, 'サブスクリプションデータ取得エラー', { 
        error: error.message 
      });
      showErrorAlert('プラン情報の取得に失敗しました');
      
      // エラー時は現在のプランに基づいてデフォルト値を設定
      const currentPlanType = currentPlan?.plan_type || 'free';
      const { PLAN_LIMITS } = require('../config/subscription');
      const limits = PLAN_LIMITS[currentPlanType];
      
      setUsageInfo({
        menu_bulk: { current: 0, limit: limits.menu_bulk },
        menu_step: { current: 0, limit: limits.menu_step },
        ocr: { current: 0, limit: limits.ocr },
        reset_at: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // プラン選択
  const handlePlanSelect = (planType: PlanType) => {
    if (planType === currentPlan?.plan_type) {
      return; // 現在のプランは選択不可
    }
    setSelectedPlan(planType);
  };

  // 購入処理
  const handlePurchase = async () => {
    if (!selectedPlan || selectedPlan === 'free') {
      showErrorAlert('プランを選択してください');
      return;
    }

    // Expo Go環境では購入処理ができない
    if (!isRevenueCatAvailable || !Purchases) {
      showErrorAlert('購入機能はExpo Development Build環境でのみ利用できます。\nExpo Goでは動作しません。');
      return;
    }

    setIsPurchasing(true);
    try {
      // RevenueCatから商品を取得
      const productId = selectedPlan === 'pro' 
        ? SUBSCRIPTION_PRODUCTS.PRO_MONTHLY 
        : SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY;

      let purchaseResult: any = null;

      // オファリングからパッケージを取得
      if (offerings) {
        const packageToPurchase = offerings.availablePackages.find(
          (pkg: any) => pkg.identifier === productId
        );

        if (packageToPurchase) {
          purchaseResult = await Purchases.purchasePackage(packageToPurchase);
        } else {
          throw new Error('商品が見つかりません');
        }
      } else {
        // オファリングが取得できない場合、直接商品IDで購入を試みる
        // 注意: この方法は推奨されませんが、フォールバックとして使用
        throw new Error('オファリングが取得できません');
      }

      // 購入成功後、バックエンドにレシートを送信
      if (purchaseResult) {
        await syncPurchaseWithBackend(purchaseResult, productId);
      }
    } catch (error: any) {
      safeLog.error(LogCategory.API, '購入処理エラー', { error: error.message });
      
      // ユーザーがキャンセルした場合はエラーを表示しない
      if (error.userCancelled) {
        return;
      }

      showErrorAlert(`購入に失敗しました: ${error.message}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  // バックエンドとの同期
  const syncPurchaseWithBackend = async (
    customerInfo: any,
    productId: string
  ) => {
    try {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      
      // レシート情報を取得
      let purchaseToken: string | undefined;
      let receiptData: string | undefined;

      if (platform === 'android') {
        // Android: 購入トークンを取得
        const transaction = customerInfo.entitlements.active[productId];
        if (transaction?.originalPurchaseDate) {
          // RevenueCatから購入トークンを取得する方法
          // 実際の実装では、RevenueCatのSDKから適切に取得する必要があります
          purchaseToken = customerInfo.originalAppUserId; // 仮の実装
        }
      } else {
        // iOS: レシートデータを取得
        receiptData = customerInfo.originalAppUserId; // 仮の実装
        // 実際の実装では、App Storeのレシートデータを取得する必要があります
      }

      // バックエンドに送信
      const result = await updateSubscription({
        product_id: productId,
        platform,
        purchase_token: purchaseToken,
        receipt_data: receiptData,
        package_name: Platform.OS === 'android' ? 'jp.co.csngrp.morizo' : undefined,
      });

      if (result.success) {
        showSuccessAlert(`${PLAN_DISPLAY_NAMES[selectedPlan]}プランにアップグレードしました！`);
        setCurrentPlan(result.plan);
        setSelectedPlan(null);
        await loadSubscriptionData(); // データを再読み込み
      } else {
        showErrorAlert(result.error || 'プランの更新に失敗しました');
      }
    } catch (error: any) {
      safeLog.error(LogCategory.API, 'バックエンド同期エラー', { error: error.message });
      showErrorAlert(`プランの更新に失敗しました: ${error.message}`);
    }
  };

  // 復元処理
  const handleRestore = async () => {
    // Expo Go環境では復元処理ができない
    if (!isRevenueCatAvailable || !Purchases) {
      showErrorAlert('購入復元機能はExpo Development Build環境でのみ利用できます。\nExpo Goでは動作しません。');
      return;
    }

    try {
      setIsLoading(true);
      const customerInfo = await Purchases.restorePurchases();
      
      if (customerInfo.entitlements.active) {
        // アクティブなサブスクリプションがある場合、バックエンドと同期
        const activeEntitlement = Object.keys(customerInfo.entitlements.active)[0];
        const productId = activeEntitlement;
        
        await syncPurchaseWithBackend(customerInfo, productId);
        showSuccessAlert('購入を復元しました');
      } else {
        showErrorAlert('復元できる購入が見つかりませんでした');
      }
    } catch (error: any) {
      safeLog.error(LogCategory.API, '購入復元エラー', { error: error.message });
      showErrorAlert(`購入の復元に失敗しました: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        
        {isLoading && !currentPlan ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>サブスクリプション</Text>
            <Text style={styles.subtitle}>プランを選択して機能を拡張</Text>
          </View>
          {onClose && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 現在のプラン情報 */}
        {currentPlan && (
          <View style={styles.currentPlanSection}>
            <Text style={styles.sectionTitle}>現在のプラン</Text>
            <PlanCard
              planType={currentPlan.plan_type}
              isCurrentPlan={true}
              disabled={true}
            />
          </View>
        )}

        {/* 利用回数情報 */}
        {usageInfo && (
          <View style={styles.usageSection}>
            <Text style={styles.sectionTitle}>本日の利用状況</Text>
            <View style={styles.usageCard}>
              <View style={styles.usageItem}>
                <Text style={styles.usageLabel}>献立一括提案</Text>
                <Text style={styles.usageValue}>
                  {usageInfo.menu_bulk?.current ?? 0} / {usageInfo.menu_bulk?.limit ?? 0}
                </Text>
              </View>
              <View style={styles.usageItem}>
                <Text style={styles.usageLabel}>段階的提案</Text>
                <Text style={styles.usageValue}>
                  {usageInfo.menu_step?.current ?? 0} / {usageInfo.menu_step?.limit ?? 0}
                </Text>
              </View>
              <View style={styles.usageItem}>
                <Text style={styles.usageLabel}>OCR読み取り</Text>
                <Text style={styles.usageValue}>
                  {usageInfo.ocr?.current ?? 0} / {usageInfo.ocr?.limit ?? 0}
                </Text>
              </View>
              {usageInfo.reset_at && (
                <Text style={styles.resetInfo}>
                  リセット時刻: {new Date(usageInfo.reset_at).toLocaleString('ja-JP')}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* プラン選択 */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>プランを選択</Text>
          
          <PlanCard
            planType="free"
            isCurrentPlan={currentPlan?.plan_type === 'free'}
            isSelected={selectedPlan === 'free'}
            onSelect={() => handlePlanSelect('free')}
            disabled={currentPlan?.plan_type === 'free'}
          />
          
          <PlanCard
            planType="pro"
            isCurrentPlan={currentPlan?.plan_type === 'pro'}
            isSelected={selectedPlan === 'pro'}
            onSelect={() => handlePlanSelect('pro')}
            disabled={currentPlan?.plan_type === 'pro'}
          />
          
          <PlanCard
            planType="ultimate"
            isCurrentPlan={currentPlan?.plan_type === 'ultimate'}
            isSelected={selectedPlan === 'ultimate'}
            onSelect={() => handlePlanSelect('ultimate')}
            disabled={currentPlan?.plan_type === 'ultimate'}
          />
        </View>

        {/* 購入ボタン */}
        {selectedPlan && selectedPlan !== currentPlan?.plan_type && (
          <TouchableOpacity
            style={[styles.purchaseButton, (isPurchasing || !isRevenueCatAvailable) && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={isPurchasing || !isRevenueCatAvailable}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                {!isRevenueCatAvailable 
                  ? '購入機能はExpo Development Buildが必要です'
                  : `${PLAN_DISPLAY_NAMES[selectedPlan]}プランを購入`}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* 復元ボタン */}
        <TouchableOpacity
          style={[styles.restoreButton, !isRevenueCatAvailable && styles.restoreButtonDisabled]}
          onPress={handleRestore}
          disabled={!isRevenueCatAvailable}
        >
          <Text style={[styles.restoreButtonText, !isRevenueCatAvailable && styles.restoreButtonTextDisabled]}>
            購入を復元
          </Text>
        </TouchableOpacity>

        {/* Expo Go環境での注意メッセージ */}
        {isExpoGo && (
          <View style={styles.expoGoNotice}>
            <Text style={styles.expoGoNoticeText}>
              ⚠️ Expo Go環境では購入機能は使用できません。{'\n'}
              バックエンドAPI連携（プラン情報・利用回数の表示）のみ動作します。
            </Text>
          </View>
        )}
        </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  closeButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  currentPlanSection: {
    marginBottom: 24,
  },
  usageSection: {
    marginBottom: 24,
  },
  usageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  usageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  usageLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resetInfo: {
    marginTop: 12,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  plansSection: {
    marginBottom: 24,
  },
  purchaseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  restoreButtonDisabled: {
    opacity: 0.5,
  },
  restoreButtonTextDisabled: {
    color: '#9CA3AF',
  },
  expoGoNotice: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  expoGoNoticeText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});

