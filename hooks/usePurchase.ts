import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import { PlanType, PLAN_DISPLAY_NAMES, SUBSCRIPTION_PRODUCTS, PRODUCT_ID_TO_PLAN } from '../config/subscription';
import { updateSubscription, PlanInfo } from '../api/subscription-api';
import { safeLog, LogCategory } from '../lib/logging';
import { showErrorAlert, showSuccessAlert } from '../utils/alert';
import { RevenueCatClient } from '../lib/subscription/revenue-cat-client';
import { BillingPeriod } from '../components/subscription/BillingPeriodToggle';

interface UsePurchaseProps {
  currentPlan: PlanInfo | null;
  selectedPlan: PlanType | null;
  setSelectedPlan: (plan: PlanType | null) => void;
  billingPeriod: BillingPeriod;
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
  billingPeriod,
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
      // 選択された期間（月額/年額）に応じて適切な商品IDを選択
      const productId = billingPeriod === 'yearly'
        ? (selectedPlan === 'pro' 
            ? SUBSCRIPTION_PRODUCTS.PRO_YEARLY 
            : SUBSCRIPTION_PRODUCTS.ULTIMATE_YEARLY)
        : (selectedPlan === 'pro' 
            ? SUBSCRIPTION_PRODUCTS.PRO_MONTHLY 
            : SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY);

      // オファリングからパッケージを取得
      let offering = revenueCatClient.getCurrentOffering();
      if (!offering) {
        // オファリングが取得できていない場合、再取得を試みる
        safeLog.warn(LogCategory.API, 'オファリングが取得できません。再取得を試みます。', { isExpoGo });
        offering = await revenueCatClient.retryLoadOfferings();
        
        if (!offering) {
          // 再取得も失敗した場合、診断情報を取得してエラーメッセージに含める
          const diagnostics = revenueCatClient.getOfferingsDiagnostics();
          const errorDetails = [
            'オファリングが取得できませんでした。',
            '',
            '【診断情報】',
            `• RevenueCat初期化: ${diagnostics.isInitialized ? '完了' : '未完了'}`,
            `• RevenueCat利用可能: ${diagnostics.isRevenueCatAvailable ? 'はい' : 'いいえ'}`,
            `• オファリング存在: ${diagnostics.hasCurrentOffering ? 'はい' : 'いいえ'}`,
            diagnostics.hasCurrentOffering 
              ? `• オファリングID: ${diagnostics.offeringIdentifier || '不明'}`
              : '• オファリングID: なし',
            `• パッケージ数: ${diagnostics.packageCount}`,
            diagnostics.packageCount > 0
              ? `• 利用可能パッケージ: ${diagnostics.availablePackageIds.join(', ')}`
              : '• 利用可能パッケージ: なし',
            '',
            '【対処方法】',
            '1. アプリを再起動してください',
            '2. ネットワーク接続を確認してください',
            '3. RevenueCatダッシュボードでオファリングが正しく設定されているか確認してください',
          ].join('\n');
          
          safeLog.error(LogCategory.API, 'オファリング取得失敗（詳細）', { 
            isExpoGo,
            diagnostics 
          });
          throw new Error(errorDetails);
        }
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
        
        // 商品が見つからない場合、詳細情報を含めたエラーメッセージを作成
        const availablePackages = offering.availablePackages.map((pkg: any) => ({
          packageId: pkg.identifier,
          productId: pkg.product?.identifier,
          productTitle: pkg.product?.title,
        }));
        
        const errorDetails = [
          `商品が見つかりません: ${productId}`,
          '',
          '【検索した商品ID】',
          productId,
          '',
          '【利用可能なパッケージ】',
          availablePackages.length > 0
            ? availablePackages.map((pkg: any) => 
                `• ${pkg.packageId || '不明'} (商品ID: ${pkg.productId || '不明'})`
              ).join('\n')
            : '• パッケージがありません',
          '',
          '【対処方法】',
          '1. RevenueCatダッシュボードで、オファリングに該当商品が追加されているか確認してください',
          '2. 商品IDが正しいか確認してください',
          `3. 期待する商品ID: ${productId}`,
        ].join('\n');
        
        safeLog.error(LogCategory.API, '商品が見つかりません（詳細）', { 
          searchedProductId: productId,
          availablePackages,
          isExpoGo 
        });
        throw new Error(errorDetails);
      }

      // アップグレード/ダウングレード情報の作成
      // PRO→ULTIMATE（アップグレード）またはULTIMATE→PRO（ダウングレード）の場合
      let upgradeInfo: any = undefined;
      const isUpgrade = selectedPlan === 'ultimate' && currentPlan && currentPlan.plan_type === 'pro' && currentPlan.subscription_status === 'active';
      const isDowngrade = selectedPlan === 'pro' && currentPlan && currentPlan.plan_type === 'ultimate' && currentPlan.subscription_status === 'active';
      
      if (isUpgrade || isDowngrade) {
        // 現在アクティブなサブスクリプションのProduct IDを取得
        const customerInfoForUpgrade = await revenueCatClient.getCustomerInfo();
        let oldProductId: string | undefined;

        if (customerInfoForUpgrade && customerInfoForUpgrade.activeSubscriptions) {
          const activeSubs = customerInfoForUpgrade.activeSubscriptions;
          
          if (isUpgrade) {
            // PRO→ULTIMATE: アクティブなPROのIDを探す（月額・年額の両方を確認）
            const proMonthlyId = SUBSCRIPTION_PRODUCTS.PRO_MONTHLY;
            const proYearlyId = SUBSCRIPTION_PRODUCTS.PRO_YEARLY;

            if (activeSubs.some((subId: string) => subId === proMonthlyId || subId.startsWith(proMonthlyId + ':'))) {
              oldProductId = proMonthlyId;
            } else if (activeSubs.some((subId: string) => subId === proYearlyId || subId.startsWith(proYearlyId + ':'))) {
              oldProductId = proYearlyId;
            }
          } else if (isDowngrade) {
            // ULTIMATE→PRO: アクティブなULTIMATEのIDを探す（月額・年額の両方を確認）
            const ultimateMonthlyId = SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY;
            const ultimateYearlyId = SUBSCRIPTION_PRODUCTS.ULTIMATE_YEARLY;

            if (activeSubs.some((subId: string) => subId === ultimateMonthlyId || subId.startsWith(ultimateMonthlyId + ':'))) {
              oldProductId = ultimateMonthlyId;
            } else if (activeSubs.some((subId: string) => subId === ultimateYearlyId || subId.startsWith(ultimateYearlyId + ':'))) {
              oldProductId = ultimateYearlyId;
            }
          }
        }

        if (oldProductId) {
          upgradeInfo = {
            oldProductId: oldProductId,
            // IMMEDIATE_AND_CHARGE: 即座に変更し、日割りで差額を請求/返金（アップグレード・ダウングレード共通）
            googleMode: 'IMMEDIATE_AND_CHARGE' as const,
          };
          safeLog.info(LogCategory.API, isUpgrade ? 'アップグレード準備完了' : 'ダウングレード準備完了', {
            oldProductId: oldProductId,
            newProductId: productId,
            fromPlan: isUpgrade ? 'pro' : 'ultimate',
            toPlan: isUpgrade ? 'ultimate' : 'pro'
          });
        } else {
          safeLog.warn(LogCategory.API, `アクティブな${isUpgrade ? 'PRO' : 'ULTIMATE'}のProduct IDが見つかりませんでした。通常の購入として続行します。`, {
            activeSubscriptions: customerInfoForUpgrade?.activeSubscriptions || []
          });
        }
      }

      // 購入処理
      const purchaseResult = await revenueCatClient.purchasePackage(packageToPurchase, upgradeInfo);
      
      // PurchaseResult受け取り後のログ（RevenueCatダッシュボード確認用）
      const purchaseResultTimestamp = new Date().toISOString();
      const customerId = purchaseResult?.customerInfo?.originalAppUserId || 
                        purchaseResult?.originalAppUserId || 
                        '不明';
      
      safeLog.info(LogCategory.API, '購入処理完了（PurchaseResult受け取り）', {
        productId,
        purchaseResultProductId: purchaseResult?.productIdentifier || purchaseResult?.customerInfo?.activeSubscriptions?.[0] || '不明',
        timestamp: purchaseResultTimestamp,
        customerId,
        note: '⚠️ この時点でRevenueCatダッシュボードを確認してください（getCustomerInfo()呼び出し前）'
      });
      
      // 開発環境でのみ、RevenueCatダッシュボード確認用の一時停止
      // 環境変数で明示的に制御可能（デフォルトは開発環境で有効）
      const enableDashboardCheck = __DEV__ && 
        (process.env.EXPO_PUBLIC_ENABLE_DASHBOARD_CHECK !== 'false');
      
      if (enableDashboardCheck) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            'RevenueCatダッシュボード確認',
            `購入処理が完了しました。\n\n` +
            `この時点でRevenueCatダッシュボードを確認してください。\n\n` +
            `Customer ID: ${customerId}\n` +
            `Product ID: ${productId}\n` +
            `時刻: ${purchaseResultTimestamp}\n\n` +
            `確認後、「続行」を押してください。`,
            [
              {
                text: '続行',
                onPress: () => resolve(),
                style: 'default'
              }
            ],
            { cancelable: false }
          );
        });
      }
      
      // 購入直後はエンタイトルメントが反映されていない可能性があるため、
      // 最新の顧客情報を再取得してからバックエンドに同期
      safeLog.info(LogCategory.API, '購入処理完了、最新の顧客情報を取得中', { productId });
      const customerInfo = await revenueCatClient.getCustomerInfo() || purchaseResult;
      
      // デバッグ用: 購入後の状態を詳細にログ出力（バックエンド側のログ分析用）
      const activeSubscriptions = customerInfo.activeSubscriptions || [];
      const activeEntitlements = customerInfo.entitlements?.active 
        ? Object.keys(customerInfo.entitlements.active) 
        : [];
      const expectedEntitlement = ENTITLEMENT_ID_MAP[selectedPlan];
      
      safeLog.info(LogCategory.API, '購入後の状態（バックエンド分析用）', { 
        hasUpgradeInfo: !!upgradeInfo,
        activeSubscriptions,
        activeEntitlements,
        productId,
        expectedEntitlement,
        isUpgrade,
        isDowngrade,
        upgradeInfo: upgradeInfo ? {
          oldProductId: upgradeInfo.oldProductId,
          googleMode: upgradeInfo.googleMode
        } : undefined
      });
      
      // RevenueCatダッシュボードとの比較用の詳細ログ
      try {
        const diagnostics = await revenueCatClient.getCustomerInfoDiagnostics();
        safeLog.info(LogCategory.API, '購入後の詳細状態（RevenueCat比較用）', {
          // SDK側の情報
          sdk: {
            activeSubscriptions: customerInfo.activeSubscriptions,
            activeEntitlements: Object.keys(customerInfo.entitlements?.active || {}),
            originalAppUserId: customerInfo.originalAppUserId,
            rawCustomerInfo: diagnostics.rawCustomerInfo,
          },
          // 診断情報
          diagnostics: {
            hasCustomerInfo: diagnostics.hasCustomerInfo,
            activeSubscriptions: diagnostics.activeSubscriptions,
            entitlements: diagnostics.entitlements,
          },
          // 期待値
          expected: {
            productId,
            entitlementId: expectedEntitlement,
            planType: selectedPlan,
          },
          // 比較用のタイムスタンプ
          timestamp: new Date().toISOString(),
          note: 'RevenueCatダッシュボードと比較してください。Customer ID: ' + (customerInfo.originalAppUserId || '不明')
        });
      } catch (error: any) {
        safeLog.warn(LogCategory.API, '診断情報取得エラー（比較用ログ）', { 
          error: error.message 
        });
      }
      
      // バックエンドに同期
      await syncPurchaseWithBackend(customerInfo, productId, upgradeInfo);
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
              // 選択された期間（月額/年額）に応じて適切な商品IDを選択
              const productId = billingPeriod === 'yearly'
                ? (selectedPlan === 'pro' 
                    ? SUBSCRIPTION_PRODUCTS.PRO_YEARLY 
                    : SUBSCRIPTION_PRODUCTS.ULTIMATE_YEARLY)
                : (selectedPlan === 'pro' 
                    ? SUBSCRIPTION_PRODUCTS.PRO_MONTHLY 
                    : SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY);

              const platform = Platform.OS === 'ios' ? 'ios' : 'android';
              
              const mockRequestPayload = {
                product_id: productId,
                platform,
                purchase_token: `mock_token_${Date.now()}`,
                receipt_data: `mock_receipt_${Date.now()}`,
                package_name: Platform.OS === 'android' ? 'jp.co.csngrp.morizo' : undefined,
              };
              
              safeLog.info(LogCategory.API, 'モック購入処理: バックエンドに送信するリクエスト内容', {
                request_payload: {
                  ...mockRequestPayload,
                  plan_type: undefined, // モバイル側はplan_typeを送信していない
                },
                note: 'plan_typeは送信されません。バックエンド側でproduct_idからplan_typeを導出してください。'
              });
              
              const result = await updateSubscription(mockRequestPayload);

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
   * エンタイトルメントIDのマッピング
   * RevenueCatでは`morizo_pro`/`morizo_ultimate`が使用されているが、
   * コード内では`pro`/`ultimate`を使用するため、マッピングが必要
   */
  const ENTITLEMENT_ID_MAP: Record<PlanType, string> = {
    free: '',
    pro: 'morizo_pro',
    ultimate: 'morizo_ultimate',
  };

  /**
   * バックエンドとの同期
   */
  const syncPurchaseWithBackend = async (
    customerInfo: any,
    productId: string,
    upgradeInfo?: any
  ) => {
    try {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      
      // product_idから直接プランタイプを決定（確実性を優先）
      // selectedPlanは補助的に使用
      const planTypeFromProductId = PRODUCT_ID_TO_PLAN[productId];
      const planType = planTypeFromProductId || selectedPlan || (productId.includes('pro') ? 'pro' : 'ultimate');
      
      safeLog.info(LogCategory.API, 'プランタイプ決定', {
        productId,
        planTypeFromProductId,
        selectedPlan,
        finalPlanType: planType
      });
      
      // RevenueCatのエンタイトルメントIDを使用（morizo_pro/morizo_ultimate）
      const entitlementId = ENTITLEMENT_ID_MAP[planType];
      
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

      // バックエンドに送信するリクエスト内容をログ出力
      const requestPayload = {
        product_id: productId,
        platform,
        purchase_token: purchaseToken,
        receipt_data: receiptData,
        package_name: Platform.OS === 'android' ? 'jp.co.csngrp.morizo' : undefined,
      };
      
      safeLog.info(LogCategory.API, 'バックエンドに送信するリクエスト内容', {
        request_payload: {
          product_id: requestPayload.product_id,
          platform: requestPayload.platform,
          purchase_token: requestPayload.purchase_token 
            ? `${requestPayload.purchase_token.substring(0, 20)}... (length: ${requestPayload.purchase_token.length})`
            : undefined,
          receipt_data: requestPayload.receipt_data 
            ? `${requestPayload.receipt_data.substring(0, 20)}... (length: ${requestPayload.receipt_data.length})`
            : undefined,
          package_name: requestPayload.package_name,
          plan_type: undefined, // モバイル側はplan_typeを送信していない
        },
        plan_type_derived: {
          product_id: productId,
          plan_type_from_product_id: planTypeFromProductId,
          selected_plan: selectedPlan,
          final_plan_type: planType,
        },
        note: 'plan_typeは送信されません。バックエンド側でproduct_idからplan_typeを導出してください。'
      });

      // バックエンドに送信
      const result = await updateSubscription(requestPayload);

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

