import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import { PlanType, PLAN_DISPLAY_NAMES, SUBSCRIPTION_PRODUCTS } from '../config/subscription';
import { updateSubscription, PlanInfo } from '../api/subscription-api';
import { safeLog, LogCategory } from '../lib/logging';
import { showErrorAlert, showSuccessAlert } from '../utils/alert';
import { RevenueCatClient } from '../lib/subscription/revenue-cat-client';

interface UsePurchaseProps {
  currentPlan: PlanInfo | null;
  selectedPlan: PlanType | null;
  setSelectedPlan: (plan: PlanType | null) => void;
  onPurchaseSuccess: (plan: PlanInfo) => void;
  onLoadSubscriptionData: () => Promise<void>;
}

/**
 * 購入処理フック
 * プラン購入、アップグレード、ダウングレードの処理を担当
 */
export function usePurchase({
  currentPlan,
  selectedPlan,
  setSelectedPlan,
  onPurchaseSuccess,
  onLoadSubscriptionData,
}: UsePurchaseProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const revenueCatClient = RevenueCatClient.getInstance();

  /**
   * プラン購入処理のエントリーポイント
   */
  const handlePurchase = async () => {
    if (!selectedPlan) {
      showErrorAlert('プランを選択してください');
      return;
    }

    // 無料プランへのダウングレード処理
    if (selectedPlan === 'free') {
      handleDowngradeToFree();
      return;
    }

    // RevenueCatが利用できない場合は、モック処理でテスト
    // ただし、EASビルド環境では通常のエラーメッセージを表示する
    const isRevenueCatAvailable = revenueCatClient.isAvailable();
    const isExpoGo = revenueCatClient.getIsExpoGo();
    if (!isRevenueCatAvailable) {
      if (isExpoGo) {
        // Expo Go環境: モック処理でバックエンドAPIのみテスト
        await handleMockPurchase();
        return;
      } else {
        // EASビルド環境: RevenueCatが利用できない場合はエラーを表示
        showErrorAlert('RevenueCatが利用できません。アプリを再起動してください。');
        return;
      }
    }

    // 既存のサブスクリプションがある場合の確認
    if (currentPlan && currentPlan.plan_type !== 'free' && currentPlan.subscription_status === 'active') {
      if (selectedPlan === 'ultimate' && currentPlan.plan_type === 'pro') {
        showUpgradeConfirmation();
        return;
      }
      if (selectedPlan === 'pro' && currentPlan.plan_type === 'ultimate') {
        showDowngradeConfirmation();
        return;
      }
      if (selectedPlan === currentPlan.plan_type) {
        showErrorAlert(`既に${PLAN_DISPLAY_NAMES[currentPlan.plan_type]}プランがアクティブです`);
        setSelectedPlan(null);
        return;
      }
    }

    await proceedWithPurchase();
  };

  /**
   * 無料プランへのダウングレード処理
   */
  const handleDowngradeToFree = () => {
    if (currentPlan?.plan_type === 'free') {
      showErrorAlert('すでに無料プランです');
      return;
    }

    const platformName = Platform.OS === 'ios' ? 'App Store' : 'Google Playストア';
    Alert.alert(
      'プランを無料プランに変更',
      `現在のサブスクリプションを無料プランに変更するには、${platformName}でサブスクリプションを解約する必要があります。\n\n解約方法:\n1. ${platformName}アプリを開く\n2. 「アカウント」→「購入とサブスクリプション」→「サブスクリプション」を選択\n3. 現在のサブスクリプションを選択して「キャンセル」をクリック\n\n解約後、次回の更新日から無料プランに戻ります。`,
      [{ text: '了解', style: 'default' }]
    );
    setSelectedPlan(null);
  };

  /**
   * アップグレード確認ダイアログ
   */
  const showUpgradeConfirmation = () => {
    const platformName = Platform.OS === 'ios' ? 'App Store' : 'Google Playストア';
    const currentPlanName = PLAN_DISPLAY_NAMES[currentPlan!.plan_type];
    const newPlanName = PLAN_DISPLAY_NAMES[selectedPlan!];
    
    Alert.alert(
      'プランをアップグレード',
      `${currentPlanName}プランから${newPlanName}プランにアップグレードします。\n\n既存の${currentPlanName}プランは自動的にキャンセルされ、${newPlanName}プランに置き換えられます。\n\n二重課金を防ぐため、${platformName}で既存のサブスクリプションが正しくキャンセルされているか確認してください。`,
      [
        { text: 'キャンセル', style: 'cancel', onPress: () => setSelectedPlan(null) },
        { text: 'アップグレード', onPress: proceedWithPurchase },
      ]
    );
  };

  /**
   * ダウングレード確認ダイアログ
   */
  const showDowngradeConfirmation = () => {
    const platformName = Platform.OS === 'ios' ? 'App Store' : 'Google Playストア';
    const currentPlanName = PLAN_DISPLAY_NAMES[currentPlan!.plan_type];
    const newPlanName = PLAN_DISPLAY_NAMES[selectedPlan!];
    
    Alert.alert(
      'プランをダウングレード',
      `${currentPlanName}プランから${newPlanName}プランにダウングレードします。\n\n既存の${currentPlanName}プランは自動的にキャンセルされ、${newPlanName}プランに置き換えられます。\n\n二重課金を防ぐため、${platformName}で既存のサブスクリプションが正しくキャンセルされているか確認してください。`,
      [
        { text: 'キャンセル', style: 'cancel', onPress: () => setSelectedPlan(null) },
        { text: 'ダウングレード', onPress: proceedWithPurchase },
      ]
    );
  };

  /**
   * 実際の購入処理
   */
  const proceedWithPurchase = async () => {
    if (!selectedPlan) return;

    const isExpoGo = revenueCatClient.getIsExpoGo();
    const isRevenueCatAvailable = revenueCatClient.isAvailable();

    // RevenueCatが利用できない場合の処理
    if (!isRevenueCatAvailable) {
      if (isExpoGo) {
        await handleMockPurchase();
        return;
      } else {
        showErrorAlert('RevenueCatが利用できません。アプリを再起動してください。');
        return;
      }
    }

    setIsPurchasing(true);
    try {
      const productId = selectedPlan === 'pro' 
        ? SUBSCRIPTION_PRODUCTS.PRO_MONTHLY 
        : SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY;

      // オファリングからパッケージを取得
      const offering = revenueCatClient.getCurrentOffering();
      if (!offering) {
        safeLog.warn(LogCategory.API, 'オファリングが取得できません', { isExpoGo });
        throw new Error('オファリングが取得できません');
      }

      // パッケージを検索
      const packageToPurchase = revenueCatClient.findPackage(productId);
      if (!packageToPurchase) {
        // Expo Go環境でプレビュー用のパッケージしかない場合、早期にモック処理にフォールバック
        const hasOnlyPreviewPackages = offering.availablePackages.every(
          (pkg: any) => 
            pkg.identifier === 'preview-package-id' || 
            pkg.product?.identifier === 'preview-product-id'
        );
        
        if (isExpoGo && hasOnlyPreviewPackages) {
          safeLog.info(LogCategory.API, 'Expo Go環境でプレビュー用パッケージのみのため、モック処理にフォールバック', { isExpoGo });
          setIsPurchasing(false);
          await handleMockPurchase();
          return;
        }
        
        throw new Error(`商品が見つかりません: ${productId}`);
      }

      // 購入処理
      const customerInfo = await revenueCatClient.purchasePackage(packageToPurchase);
      
      // バックエンドに同期
      await syncPurchaseWithBackend(customerInfo, productId);
    } catch (error: any) {
      safeLog.error(LogCategory.API, '購入処理エラー', { 
        error: error.message,
        isExpoGo: revenueCatClient.getIsExpoGo()
      });
      
      // ユーザーがキャンセルした場合はエラーを表示しない
      if (error.message === 'USER_CANCELLED' || error.userCancelled) {
        setIsPurchasing(false);
        return;
      }

      // Expo Go環境などでRevenueCatの購入処理が失敗した場合、モック処理にフォールバック
      if (isExpoGo || error.message?.includes('Native module') || error.message?.includes('not available') || error.message?.includes('商品が見つかりません')) {
        if (isExpoGo) {
          safeLog.info(LogCategory.API, 'Expo Go環境ではRevenueCatの購入機能は使用できません。モック処理にフォールバックします。', { isExpoGo });
        } else {
          safeLog.info(LogCategory.API, 'RevenueCat購入処理が失敗したため、モック処理にフォールバック', { isExpoGo });
        }
        setIsPurchasing(false);
        await handleMockPurchase();
        return;
      }

      showErrorAlert(`購入に失敗しました: ${error.message}`);
      setIsPurchasing(false);
    }
  };

  /**
   * モック購入処理（Expo Go環境用）
   */
  const handleMockPurchase = async () => {
    if (!selectedPlan || selectedPlan === 'free') return;

    setIsPurchasing(true);
    try {
      const dialogTitle = revenueCatClient.getIsExpoGo() ? 'テストモード（Expo Go）' : 'テストモード';
      const dialogMessage = revenueCatClient.getIsExpoGo()
        ? `Expo Go環境では実際の購入処理はできませんが、バックエンドAPIのテストを実行します。\n\n${PLAN_DISPLAY_NAMES[selectedPlan]}プランに更新しますか？`
        : `RevenueCatが利用できないため、バックエンドAPIのテストを実行します。\n\n${PLAN_DISPLAY_NAMES[selectedPlan]}プランに更新しますか？`;
      
      Alert.alert(
        dialogTitle,
        dialogMessage,
        [
          { text: 'キャンセル', style: 'cancel', onPress: () => setIsPurchasing(false) },
          { text: 'テスト実行', onPress: async () => {
            try {
              const productId = selectedPlan === 'pro' 
                ? SUBSCRIPTION_PRODUCTS.PRO_MONTHLY 
                : SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY;

              const platform = Platform.OS === 'ios' ? 'ios' : 'android';
              
              const result = await updateSubscription({
                product_id: productId,
                platform,
                purchase_token: `mock_token_${Date.now()}`,
                receipt_data: `mock_receipt_${Date.now()}`,
                package_name: Platform.OS === 'android' ? 'jp.co.csngrp.morizo' : undefined,
              });

              if (result.success) {
                showSuccessAlert(`${PLAN_DISPLAY_NAMES[selectedPlan]}プランに更新しました（テストモード）`);
                onPurchaseSuccess(result.plan);
                setSelectedPlan(null);
                await onLoadSubscriptionData();
              } else {
                showErrorAlert(result.error || 'プランの更新に失敗しました');
              }
            } catch (error: any) {
              safeLog.error(LogCategory.API, 'モック購入処理エラー', { error: error.message });
              showErrorAlert(`プランの更新に失敗しました: ${error.message}`);
            } finally {
              setIsPurchasing(false);
            }
          }},
        ]
      );
    } catch (error: any) {
      safeLog.error(LogCategory.API, 'モック購入処理エラー', { error: error.message });
      setIsPurchasing(false);
    }
  };

  /**
   * バックエンドとの同期
   */
  const syncPurchaseWithBackend = async (
    customerInfo: any,
    productId: string
  ) => {
    try {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const planType = selectedPlan || (productId.includes('pro') ? 'pro' : 'ultimate');
      const entitlementId = planType; // エンタイトルメントIDはプランタイプと同じ（pro/ultimate）
      
      // レシート情報を取得
      let purchaseToken: string | undefined;
      let receiptData: string | undefined;

      // customerInfoの構造を安全に確認
      if (!customerInfo) {
        safeLog.error(LogCategory.API, 'バックエンド同期エラー: customerInfoがnull/undefined', { productId });
        throw new Error('購入情報を取得できませんでした');
      }

      // エンタイトルメント情報を安全に取得
      const entitlements = customerInfo.entitlements;
      if (!entitlements) {
        // エンタイトルメントが設定されていない場合のフォールバック
        safeLog.warn(LogCategory.API, 'エンタイトルメントが設定されていません。RevenueCatダッシュボードでエンタイトルメントを設定してください。', { 
          productId,
          customerInfoKeys: Object.keys(customerInfo),
          suggestion: 'RevenueCatダッシュボード > Product catalog > Entitlements でエンタイトルメントを作成し、オファリングのパッケージに紐付けてください。'
        });
        
        // エンタイトルメントがない場合でも、購入情報をバックエンドに送信
        // バックエンド側でレシート検証を行う
        if (platform === 'android') {
          purchaseToken = customerInfo.originalAppUserId || `android_token_${Date.now()}`;
        } else {
          receiptData = customerInfo.originalAppUserId || `ios_receipt_${Date.now()}`;
        }
        
        safeLog.info(LogCategory.API, 'エンタイトルメントなしでバックエンドに送信', {
          platform,
          purchaseToken: purchaseToken?.substring(0, 20) + '...',
          receiptData: receiptData?.substring(0, 20) + '...'
        });
      } else {
        const activeEntitlements = entitlements.active || {};
        const activeEntitlement = activeEntitlements[entitlementId];

        if (platform === 'android') {
          // Android: 購入トークンを取得
          if (activeEntitlement) {
            // RevenueCatのCustomerInfoから購入トークンを取得
            // latestPurchaseDateが存在する場合、購入が成功している
            if (activeEntitlement.latestPurchaseDate) {
              // RevenueCatのSDKから購入トークンを取得
              // 注意: 実際の実装では、RevenueCatのSDKから適切に取得する必要があります
              // 現在は、originalAppUserIdを仮のトークンとして使用
              purchaseToken = customerInfo.originalAppUserId || `android_token_${Date.now()}`;
              safeLog.info(LogCategory.API, 'Android購入トークン取得', { 
                purchaseToken: purchaseToken.substring(0, 20) + '...',
                entitlementId 
              });
            }
          } else {
            safeLog.warn(LogCategory.API, 'アクティブなエンタイトルメントが見つかりません（Android）', { 
              entitlementId,
              availableEntitlements: Object.keys(activeEntitlements)
            });
            // エンタイトルメントがない場合でも、購入トークンを設定
            purchaseToken = customerInfo.originalAppUserId || `android_token_${Date.now()}`;
          }
        } else {
          // iOS: レシートデータを取得
          if (activeEntitlement) {
            // RevenueCatのSDKからレシートデータを取得
            // 注意: 実際の実装では、RevenueCatのSDKから適切に取得する必要があります
            // 現在は、originalAppUserIdを仮のレシートとして使用
            receiptData = customerInfo.originalAppUserId || `ios_receipt_${Date.now()}`;
            safeLog.info(LogCategory.API, 'iOSレシートデータ取得', { 
              receiptData: receiptData.substring(0, 20) + '...',
              entitlementId 
            });
          } else {
            safeLog.warn(LogCategory.API, 'アクティブなエンタイトルメントが見つかりません（iOS）', { 
              entitlementId,
              availableEntitlements: Object.keys(activeEntitlements)
            });
            // エンタイトルメントがない場合でも、レシートデータを設定
            receiptData = customerInfo.originalAppUserId || `ios_receipt_${Date.now()}`;
          }
        }
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
        showSuccessAlert(`${PLAN_DISPLAY_NAMES[selectedPlan!]}プランにアップグレードしました！`);
        onPurchaseSuccess(result.plan);
        setSelectedPlan(null);
        await onLoadSubscriptionData();
      } else {
        showErrorAlert(result.error || 'プランの更新に失敗しました');
      }
    } catch (error: any) {
      safeLog.error(LogCategory.API, 'バックエンド同期エラー', { error: error.message });
      showErrorAlert(`プランの更新に失敗しました: ${error.message}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  return {
    isPurchasing,
    handlePurchase,
  };
}

