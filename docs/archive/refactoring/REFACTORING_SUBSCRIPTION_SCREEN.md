# SubscriptionScreen.tsx リファクタリング案

## 1. 現状分析

### 1.1 ファイルサイズ
- **総行数**: 1,160行
- **問題点**: 単一ファイルに複数の責任が混在

### 1.2 混在している責任

1. **RevenueCat SDK管理** (28-65行, 138-246行)
   - RevenueCat SDKのインポートと初期化
   - Expo Go環境の検出
   - オファリングの取得とエラーハンドリング

2. **データ取得と状態管理** (248-342行)
   - サブスクリプションデータの読み込み
   - 利用回数データの正規化
   - 状態管理（currentPlan, usageInfo, selectedPlan等）

3. **購入処理ロジック** (352-806行)
   - モック購入処理（Expo Go環境用）
   - プラン変更処理（アップグレード/ダウングレード）
   - RevenueCat経由の購入処理
   - バックエンドとの同期

4. **UI表示** (814-982行)
   - モーダル表示
   - プラン情報の表示
   - 利用回数情報の表示
   - プラン選択UI

5. **ユーティリティ関数** (75-120行)
   - リセット時刻の計算
   - 時刻のフォーマット

6. **スタイル定義** (984-1159行)
   - 175行のスタイル定義

---

## 2. リファクタリング戦略

### 2.1 責任の分離原則

各モジュールが**単一の責任**を持つように分割します：

- **RevenueCat SDK管理** → `lib/subscription/revenue-cat-client.ts`
- **サブスクリプションデータ管理** → `hooks/useSubscription.ts`
- **購入処理** → `hooks/usePurchase.ts`
- **UIコンポーネント** → 複数の小さなコンポーネントに分割
- **ユーティリティ関数** → `lib/subscription/utils.ts`
- **スタイル** → 各コンポーネントに分散、または `styles/subscription-screen.styles.ts`

---

## 3. 詳細なリファクタリングプラン

### 3.1 Phase 1: RevenueCat SDK管理の分離

#### 3.1.1 目的
RevenueCat SDKの初期化と管理を専用のクライアントクラスに分離する。

#### 3.1.2 新しいファイル構造

**ファイル**: `lib/subscription/revenue-cat-client.ts`

```typescript
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { safeLog, LogCategory } from '../logging';

// RevenueCatの型定義
export interface RevenueCatPackage {
  identifier: string;
  product?: {
    identifier: string;
    title?: string;
  };
}

export interface RevenueCatOffering {
  identifier: string;
  availablePackages: RevenueCatPackage[];
}

export interface RevenueCatCustomerInfo {
  originalAppUserId?: string;
  entitlements?: {
    active?: Record<string, any>;
  };
}

/**
 * RevenueCat SDKクライアント
 * RevenueCat SDKの初期化、オファリング取得、購入処理を管理
 */
export class RevenueCatClient {
  private static instance: RevenueCatClient | null = null;
  private Purchases: any = null;
  private CustomerInfo: any = null;
  private PurchasesOffering: any = null;
  private PurchasesPackage: any = null;
  private isExpoGo: boolean = false;
  private isInitialized: boolean = false;
  private currentOffering: RevenueCatOffering | null = null;

  private constructor() {
    this.detectExpoGo();
    this.importRevenueCat();
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): RevenueCatClient {
    if (!RevenueCatClient.instance) {
      RevenueCatClient.instance = new RevenueCatClient();
    }
    return RevenueCatClient.instance;
  }

  /**
   * Expo Go環境の検出
   */
  private detectExpoGo(): void {
    try {
      if (Constants.ExecutionEnvironment && Constants.executionEnvironment !== undefined) {
        this.isExpoGo = Constants.executionEnvironment === Constants.ExecutionEnvironment.StoreClient;
      } else {
        this.isExpoGo = false;
      }
    } catch (error) {
      this.isExpoGo = false;
    }
  }

  /**
   * RevenueCat SDKのインポート
   */
  private importRevenueCat(): void {
    try {
      const purchasesModule = require('react-native-purchases');
      this.Purchases = purchasesModule.default;
      this.CustomerInfo = purchasesModule.CustomerInfo;
      this.PurchasesOffering = purchasesModule.PurchasesOffering;
      this.PurchasesPackage = purchasesModule.PurchasesPackage;
    } catch (error) {
      console.warn('[RevenueCatClient] react-native-purchasesが見つかりません。Expo Go環境の可能性があります。');
    }
  }

  /**
   * RevenueCat SDKが利用可能かどうか
   */
  public isAvailable(): boolean {
    return this.Purchases !== null;
  }

  /**
   * Expo Go環境かどうか
   */
  public getIsExpoGo(): boolean {
    return this.isExpoGo;
  }

  /**
   * RevenueCat SDKの初期化
   */
  public async initialize(): Promise<boolean> {
    if (!this.Purchases) {
      if (this.isExpoGo) {
        safeLog.info(LogCategory.API, 'RevenueCatはExpo Go環境では使用できません。バックエンドAPI連携のみ動作します。');
      } else {
        safeLog.warn(LogCategory.API, 'RevenueCat SDKが利用できません');
      }
      return false;
    }

    try {
      const revenueCatApiKey = 
        Platform.select({
          ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
          android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
        }) || 
        process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;

      if (!revenueCatApiKey) {
        safeLog.warn(LogCategory.API, 'RevenueCat APIキーが設定されていません');
        return false;
      }

      await this.Purchases.configure({ apiKey: revenueCatApiKey });
      safeLog.info(LogCategory.API, 'RevenueCat初期化成功', { isExpoGo: this.isExpoGo });
      this.isInitialized = true;

      // オファリングを取得
      await this.loadOfferings();
      return true;
    } catch (error: any) {
      this.handleInitializationError(error);
      return false;
    }
  }

  /**
   * オファリングの取得
   */
  public async loadOfferings(): Promise<RevenueCatOffering | null> {
    if (!this.isInitialized || !this.Purchases) {
      return null;
    }

    try {
      const offeringsData = await this.Purchases.getOfferings();
      if (offeringsData.current) {
        this.currentOffering = {
          identifier: offeringsData.current.identifier,
          availablePackages: offeringsData.current.availablePackages || [],
        };
        return this.currentOffering;
      }
      return null;
    } catch (error: any) {
      this.handleOfferingsError(error);
      return null;
    }
  }

  /**
   * 現在のオファリングを取得
   */
  public getCurrentOffering(): RevenueCatOffering | null {
    return this.currentOffering;
  }

  /**
   * パッケージの検索
   */
  public findPackage(productId: string): RevenueCatPackage | null {
    if (!this.currentOffering) {
      return null;
    }

    return this.currentOffering.availablePackages.find(
      (pkg) => {
        if (pkg.identifier === productId) return true;
        const pkgProductId = pkg.product?.identifier;
        if (pkgProductId === productId) return true;
        if (pkgProductId && pkgProductId.startsWith(productId + ':')) return true;
        return false;
      }
    ) || null;
  }

  /**
   * パッケージの購入
   */
  public async purchasePackage(packageToPurchase: RevenueCatPackage): Promise<RevenueCatCustomerInfo> {
    if (!this.Purchases) {
      throw new Error('RevenueCat SDKが利用できません');
    }

    try {
      const purchaseResult = await this.Purchases.purchasePackage(packageToPurchase);
      return purchaseResult.customerInfo || purchaseResult;
    } catch (error: any) {
      if (error.userCancelled) {
        throw new Error('USER_CANCELLED');
      }
      throw error;
    }
  }

  /**
   * 初期化エラーのハンドリング
   */
  private handleInitializationError(error: any): void {
    const isTestStoreError = error.message?.includes('test_store') || 
                             error.message?.includes('Store does not contain element');
    
    if (isTestStoreError) {
      safeLog.error(LogCategory.API, 'RevenueCat初期化エラー: test_storeエラー', { 
        error: error.message,
        isExpoGo: this.isExpoGo,
        suggestion: '開発ビルドでは、プラットフォーム固有のAPIキーを使用してください'
      });
    } else {
      safeLog.error(LogCategory.API, 'RevenueCat初期化エラー', { 
        error: error.message,
        isExpoGo: this.isExpoGo 
      });
    }
  }

  /**
   * オファリング取得エラーのハンドリング
   */
  private handleOfferingsError(error: any): void {
    const isTestStoreError = error.message?.includes('test_store') || 
                             error.message?.includes('Store does not contain element');
    const isConfigurationError = error.code === 'ConfigurationError' ||
                                 error.message?.includes('no products registered') ||
                                 error.message?.includes('There are no products registered');
    
    if (isTestStoreError) {
      safeLog.error(LogCategory.API, 'test_storeエラー: プラットフォーム固有のAPIキーを使用してください', { 
        error: error.message,
        isExpoGo: this.isExpoGo,
        suggestion: 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEYまたはEXPO_PUBLIC_REVENUECAT_IOS_API_KEYを設定してください'
      });
    } else if (isConfigurationError) {
      safeLog.warn(LogCategory.API, 'オファリング設定エラー: RevenueCatダッシュボードでオファリングに商品を登録してください', { 
        error: error.message,
        isExpoGo: this.isExpoGo,
        suggestion: 'RevenueCatダッシュボード > Offerings > defaultオファリング > パッケージに商品を追加してください。',
        reference: 'https://rev.cat/how-to-configure-offerings'
      });
    } else {
      safeLog.warn(LogCategory.API, 'オファリング取得エラー（Expo Go環境の可能性）', { 
        error: error.message,
        isExpoGo: this.isExpoGo 
      });
    }
  }
}
```

#### 3.1.3 期待される効果
- **行数削減**: 約200行 → SubscriptionScreenから削除
- **再利用性**: 他の画面でもRevenueCat SDKを使用可能
- **テスタビリティ**: RevenueCat SDKの動作を独立してテスト可能

---

### 3.2 Phase 2: サブスクリプションデータ管理の分離

#### 3.2.1 目的
サブスクリプションデータの取得と状態管理をカスタムフックに分離する。

#### 3.2.2 新しいファイル構造

**ファイル**: `hooks/useSubscription.ts`

```typescript
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
      
      // 利用回数データの正規化
      const normalizedUsageData = normalizeUsageData(usageData, planData?.plan_type || 'free');
      setUsageInfo(normalizedUsageData);
    } catch (error: any) {
      safeLog.error(LogCategory.API, 'サブスクリプションデータ取得エラー', { 
        error: error.message 
      });
      showErrorAlert('プラン情報の取得に失敗しました');
      
      // エラー時はデフォルト値を設定
      const currentPlanType = currentPlan?.plan_type || 'free';
      setUsageInfo(createDefaultUsageInfo(currentPlanType));
    } finally {
      setIsLoading(false);
    }
  }, [currentPlan?.plan_type]);

  /**
   * 利用回数データの正規化
   */
  const normalizeUsageData = (
    usageData: any,
    planType: string
  ): UsageLimitInfo => {
    if (!usageData) {
      return createDefaultUsageInfo(planType);
    }

    // データ構造が既に期待通り（menu_bulk, menu_step, ocrがオブジェクト）の場合
    if (usageData.menu_bulk && typeof usageData.menu_bulk === 'object' && 'current' in usageData.menu_bulk && 'limit' in usageData.menu_bulk) {
      return usageData as UsageLimitInfo;
    }

    // データ構造が異なる場合（フラットな構造など）の処理
    const limits = PLAN_LIMITS[planType];
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
  };

  /**
   * デフォルトの利用回数情報を作成
   */
  const createDefaultUsageInfo = (planType: string): UsageLimitInfo => {
    const limits = PLAN_LIMITS[planType];
    return {
      menu_bulk: { current: 0, limit: limits.menu_bulk },
      menu_step: { current: 0, limit: limits.menu_step },
      ocr: { current: 0, limit: limits.ocr },
      reset_at: getNextResetTime(),
    };
  };

  // 初期化時にデータを読み込む
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  return {
    currentPlan,
    usageInfo,
    isLoading,
    loadSubscriptionData,
    setCurrentPlan, // 購入成功時に更新するため
  };
}
```

#### 3.2.3 期待される効果
- **行数削減**: 約100行 → SubscriptionScreenから削除
- **再利用性**: 他の画面でもサブスクリプションデータを使用可能
- **テスタビリティ**: データ取得ロジックを独立してテスト可能

---

### 3.3 Phase 3: 購入処理の分離

#### 3.3.1 目的
購入処理ロジックをカスタムフックに分離する。

#### 3.3.2 新しいファイル構造

**ファイル**: `hooks/usePurchase.ts`

```typescript
import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import { PlanType, PLAN_DISPLAY_NAMES, SUBSCRIPTION_PRODUCTS } from '../config/subscription';
import { updateSubscription } from '../api/subscription-api';
import { safeLog, LogCategory } from '../lib/logging';
import { showErrorAlert, showSuccessAlert } from '../utils/alert';
import { RevenueCatClient } from '../lib/subscription/revenue-cat-client';
import { PlanInfo } from '../api/subscription-api';

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
        throw new Error('オファリングが取得できません');
      }

      const packageToPurchase = revenueCatClient.findPackage(productId);
      if (!packageToPurchase) {
        throw new Error(`商品が見つかりません: ${productId}`);
      }

      // 購入処理
      const customerInfo = await revenueCatClient.purchasePackage(packageToPurchase);
      
      // バックエンドに同期
      await syncPurchaseWithBackend(customerInfo, productId);
    } catch (error: any) {
      if (error.message === 'USER_CANCELLED') {
        setIsPurchasing(false);
        return;
      }

      // Expo Go環境などでRevenueCatの購入処理が失敗した場合、モック処理にフォールバック
      if (isExpoGo || error.message?.includes('Native module') || error.message?.includes('not available')) {
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
      
      // レシート情報を取得
      let purchaseToken: string | undefined;
      let receiptData: string | undefined;

      if (!customerInfo) {
        throw new Error('購入情報を取得できませんでした');
      }

      const entitlements = customerInfo.entitlements;
      if (!entitlements) {
        // エンタイトルメントがない場合のフォールバック
        if (platform === 'android') {
          purchaseToken = customerInfo.originalAppUserId || `android_token_${Date.now()}`;
        } else {
          receiptData = customerInfo.originalAppUserId || `ios_receipt_${Date.now()}`;
        }
      } else {
        const activeEntitlements = entitlements.active || {};
        const activeEntitlement = activeEntitlements[planType];

        if (platform === 'android') {
          purchaseToken = activeEntitlement?.latestPurchaseDate 
            ? customerInfo.originalAppUserId || `android_token_${Date.now()}`
            : customerInfo.originalAppUserId || `android_token_${Date.now()}`;
        } else {
          receiptData = activeEntitlement?.latestPurchaseDate
            ? customerInfo.originalAppUserId || `ios_receipt_${Date.now()}`
            : customerInfo.originalAppUserId || `ios_receipt_${Date.now()}`;
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
```

#### 3.3.3 期待される効果
- **行数削減**: 約450行 → SubscriptionScreenから削除
- **再利用性**: 他の画面でも購入処理を使用可能
- **テスタビリティ**: 購入処理ロジックを独立してテスト可能

---

### 3.4 Phase 4: UIコンポーネントの分割

#### 3.4.1 目的
UI表示部分を複数の小さなコンポーネントに分割する。

#### 3.4.2 新しいコンポーネント構造

**1. `components/subscription/SubscriptionHeader.tsx`**
- 責任: ヘッダー表示
- 行数: 約30行

**2. `components/subscription/CurrentPlanSection.tsx`**
- 責任: 現在のプラン情報表示
- 行数: 約20行

**3. `components/subscription/UsageInfoSection.tsx`**
- 責任: 利用回数情報表示
- 行数: 約50行

**4. `components/subscription/PlanSelectionSection.tsx`**
- 責任: プラン選択UI
- 行数: 約40行

**5. `components/subscription/PurchaseButton.tsx`**
- 責任: 購入ボタン表示
- 行数: 約30行

**6. `components/subscription/InfoBox.tsx`**
- 責任: 情報表示ボックス
- 行数: 約20行

#### 3.4.3 期待される効果
- **行数削減**: 約170行 → SubscriptionScreenから削除
- **再利用性**: 各コンポーネントを他の画面でも使用可能
- **保守性**: 各コンポーネントの変更が他に影響しない

---

### 3.5 Phase 5: ユーティリティ関数の分離

#### 3.5.1 目的
ユーティリティ関数を専用ファイルに分離する。

#### 3.5.2 新しいファイル構造

**ファイル**: `lib/subscription/utils.ts`

```typescript
/**
 * 次のリセット時刻（明朝0:00 JST）を取得
 * @returns ISO 8601形式の文字列
 */
export function getNextResetTime(): string {
  const jstOffset = 9 * 60; // JSTはUTC+9
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const jst = new Date(utc + (jstOffset * 60000));
  
  const today = new Date(jst);
  today.setHours(0, 0, 0, 0);
  
  if (jst >= today) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
  }
  
  return today.toISOString();
}

/**
 * リセット時刻をフォーマット（明朝0:00 JST形式で表示）
 * @param resetAt ISO 8601形式の文字列
 * @returns フォーマットされた文字列
 */
export function formatResetTime(resetAt: string): string {
  try {
    const date = new Date(resetAt);
    const jstOffset = 9 * 60; // JSTはUTC+9
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const jst = new Date(utc + (jstOffset * 60000));
    
    const year = jst.getFullYear();
    const month = String(jst.getMonth() + 1).padStart(2, '0');
    const day = String(jst.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day} 0:00:00`;
  } catch (error) {
    return resetAt;
  }
}
```

#### 3.5.3 期待される効果
- **行数削減**: 約45行 → SubscriptionScreenから削除
- **再利用性**: 他の画面でも時刻処理を使用可能
- **テスタビリティ**: ユーティリティ関数を独立してテスト可能

---

## 4. リファクタリング後のSubscriptionScreen.tsx

### 4.1 期待される構造

```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSubscription } from '../hooks/useSubscription';
import { usePurchase } from '../hooks/usePurchase';
import { RevenueCatClient } from '../lib/subscription/revenue-cat-client';
import { SubscriptionHeader } from '../components/subscription/SubscriptionHeader';
import { CurrentPlanSection } from '../components/subscription/CurrentPlanSection';
import { UsageInfoSection } from '../components/subscription/UsageInfoSection';
import { PlanSelectionSection } from '../components/subscription/PlanSelectionSection';
import { PurchaseButton } from '../components/subscription/PurchaseButton';
import { InfoBox } from '../components/subscription/InfoBox';
import { PlanType } from '../config/subscription';

interface SubscriptionScreenProps {
  onClose?: () => void;
}

export default function SubscriptionScreen({ onClose }: SubscriptionScreenProps = {}) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const revenueCatClient = RevenueCatClient.getInstance();
  
  const { currentPlan, usageInfo, isLoading, loadSubscriptionData, setCurrentPlan } = useSubscription();
  const { isPurchasing, handlePurchase } = usePurchase({
    currentPlan,
    selectedPlan,
    setSelectedPlan,
    onPurchaseSuccess: (plan) => setCurrentPlan(plan),
    onLoadSubscriptionData: loadSubscriptionData,
  });

  // RevenueCatの初期化
  useEffect(() => {
    revenueCatClient.initialize();
  }, []);

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
            <SubscriptionHeader onClose={onClose} />
            
            {currentPlan && (
              <CurrentPlanSection currentPlan={currentPlan} />
            )}
            
            {usageInfo && (
              <UsageInfoSection usageInfo={usageInfo} />
            )}
            
            <PlanSelectionSection
              currentPlan={currentPlan}
              selectedPlan={selectedPlan}
              onPlanSelect={setSelectedPlan}
            />
            
            {selectedPlan && selectedPlan !== currentPlan?.plan_type && (
              <PurchaseButton
                selectedPlan={selectedPlan}
                isPurchasing={isPurchasing}
                isExpoGo={revenueCatClient.getIsExpoGo()}
                isRevenueCatAvailable={revenueCatClient.isAvailable()}
                onPress={handlePurchase}
              />
            )}
            
            <InfoBox />
            
            {revenueCatClient.getIsExpoGo() && (
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
  // 最小限のスタイルのみ
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  expoGoNotice: { marginTop: 16, padding: 16, backgroundColor: '#FEF3C7', borderRadius: 8, borderWidth: 1, borderColor: '#FCD34D' },
  expoGoNoticeText: { fontSize: 14, color: '#92400E', lineHeight: 20 },
});
```

### 4.2 期待される行数
- **リファクタリング後**: 約100-150行
- **削減率**: 約87-91%削減

---

## 5. リファクタリングの実施順序

### Phase 1: RevenueCat SDK管理の分離
1. `lib/subscription/revenue-cat-client.ts` を作成
2. SubscriptionScreenからRevenueCat関連コードを移動
3. 動作確認

### Phase 2: ユーティリティ関数の分離
1. `lib/subscription/utils.ts` を作成
2. SubscriptionScreenからユーティリティ関数を移動
3. 動作確認

### Phase 3: サブスクリプションデータ管理の分離
1. `hooks/useSubscription.ts` を作成
2. SubscriptionScreenからデータ取得ロジックを移動
3. 動作確認

### Phase 4: 購入処理の分離
1. `hooks/usePurchase.ts` を作成
2. SubscriptionScreenから購入処理ロジックを移動
3. 動作確認

### Phase 5: UIコンポーネントの分割
1. 各UIコンポーネントを作成
2. SubscriptionScreenからUIコードを移動
3. 動作確認

---

## 6. 期待される効果まとめ

### 6.1 コード品質の向上
- **可読性**: 各ファイルが単一の責任を持つため、理解しやすくなる
- **保守性**: 変更時の影響範囲が明確になる
- **テスタビリティ**: 各モジュールを独立してテスト可能

### 6.2 再利用性の向上
- RevenueCat SDK管理を他の画面でも使用可能
- サブスクリプションデータ管理を他の画面でも使用可能
- 購入処理を他の画面でも使用可能

### 6.3 開発効率の向上
- バグ修正時の影響範囲が明確
- 新機能追加時の影響範囲が明確
- コードレビューが容易

---

## 7. 注意事項

### 7.1 段階的な実施
- 一度にすべてをリファクタリングせず、Phaseごとに実施
- 各Phase完了後に動作確認を実施

### 7.2 テストの重要性
- 各Phase完了後に既存機能が正常に動作することを確認
- 特に購入処理は慎重にテスト

### 7.3 ドキュメント更新
- リファクタリング完了後、関連ドキュメントを更新
- 新しいファイル構造をドキュメント化

---

**作成日**: 2025年1月23日  
**対象ファイル**: `screens/SubscriptionScreen.tsx` (1,160行)  
**目標**: 責任の分離による保守性向上

