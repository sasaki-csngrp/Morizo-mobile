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
      // RevenueCatのAPIキーは環境変数から取得
      // 優先順位: プラットフォーム固有 > テストストア用
      // 開発ビルドではプラットフォーム固有のAPIキーを使用（test_storeエラーを回避）
      const revenueCatApiKey = 
        Platform.select({
          ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
          android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
        }) || 
        process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY; // テストストア用（フォールバック）

      if (!revenueCatApiKey) {
        safeLog.warn(LogCategory.API, 'RevenueCat APIキーが設定されていません');
        return false;
      }

      // Expo Go環境でも初期化を試みる（エラーが発生する可能性があるが、テストのため）
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
      // オファリングを取得（Expo Go環境ではエラーが発生する可能性がある）
      const offeringsData = await this.Purchases.getOfferings();
      if (offeringsData.current) {
        this.currentOffering = {
          identifier: offeringsData.current.identifier,
          availablePackages: offeringsData.current.availablePackages || [],
        };
        
        // デバッグ用: 利用可能なパッケージをログ出力
        const availablePackages = this.currentOffering.availablePackages;
        safeLog.info(LogCategory.API, 'オファリング取得成功', { 
          isExpoGo: this.isExpoGo,
          offeringIdentifier: this.currentOffering.identifier,
          packageCount: availablePackages.length,
          packages: availablePackages.map((pkg: any) => ({
            packageId: pkg.identifier,
            productId: pkg.product?.identifier,
            productTitle: pkg.product?.title,
          }))
        });
        
        return this.currentOffering;
      } else {
        safeLog.warn(LogCategory.API, 'オファリングが空です（currentオファリングが設定されていません）', { isExpoGo: this.isExpoGo });
        return null;
      }
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
   * Package IDまたはProduct IDで検索
   * 注意: Play Storeの商品をインポートした場合、Product IDは「商品ID:ストア内の商品ID」形式になる
   * 例: "morizo_pro_monthly:morizo-pro-monthly"
   */
  public findPackage(productId: string): RevenueCatPackage | null {
    if (!this.currentOffering) {
      return null;
    }

    const availablePackages = this.currentOffering.availablePackages;
    
    // デバッグ用: 利用可能なパッケージをログ出力
    safeLog.info(LogCategory.API, 'パッケージ検索開始', {
      searchedProductId: productId,
      availablePackages: availablePackages.map((pkg: any) => ({
        packageId: pkg.identifier,
        productId: pkg.product?.identifier,
        productTitle: pkg.product?.title,
      })),
      isExpoGo: this.isExpoGo
    });

    const packageToPurchase = availablePackages.find(
      (pkg: any) => {
        // Package IDで検索
        if (pkg.identifier === productId) {
          return true;
        }
        // Product IDで検索（完全一致または「商品ID:」で始まる場合）
        const pkgProductId = pkg.product?.identifier;
        if (pkgProductId === productId) {
          return true;
        }
        // Product IDが「商品ID:」で始まる場合（Play Storeインポート形式）
        if (pkgProductId && pkgProductId.startsWith(productId + ':')) {
          return true;
        }
        return false;
      }
    );

    if (packageToPurchase) {
      safeLog.info(LogCategory.API, '商品が見つかりました', {
        packageId: packageToPurchase.identifier,
        productId: packageToPurchase.product?.identifier,
        productTitle: packageToPurchase.product?.title,
        selectedProductId: productId,
        isExpoGo: this.isExpoGo
      });
    } else {
      safeLog.error(LogCategory.API, '商品が見つかりません', {
        searchedProductId: productId,
        availablePackages: availablePackages.map((pkg: any) => ({
          packageId: pkg.identifier,
          productId: pkg.product?.identifier,
          productTitle: pkg.product?.title,
        })),
        isExpoGo: this.isExpoGo,
        suggestion: 'RevenueCatダッシュボードで、オファリングのパッケージにPlay Storeの商品が正しく選択されているか確認してください。パッケージのProduct IDが「' + productId + '」と一致している必要があります。'
      });
    }

    return packageToPurchase || null;
  }

  /**
   * パッケージの購入
   */
  public async purchasePackage(packageToPurchase: RevenueCatPackage): Promise<RevenueCatCustomerInfo> {
    if (!this.Purchases) {
      throw new Error('RevenueCat SDKが利用できません');
    }

    try {
      // Expo Go環境でも購入処理を試みる（エラーハンドリングでテスト可能）
      const purchaseResult = await this.Purchases.purchasePackage(packageToPurchase);
      safeLog.info(LogCategory.API, 'RevenueCat購入処理成功', { isExpoGo: this.isExpoGo });
      
      // purchaseResultの構造を確認（CustomerInfoオブジェクトまたはラップされた構造の可能性）
      const customerInfo = purchaseResult.customerInfo || purchaseResult;
      safeLog.info(LogCategory.API, '購入結果の構造確認', {
        hasCustomerInfo: !!purchaseResult.customerInfo,
        purchaseResultKeys: Object.keys(purchaseResult),
        customerInfoKeys: customerInfo ? Object.keys(customerInfo) : []
      });
      
      return customerInfo;
    } catch (error: any) {
      // Expo Go環境では、ネイティブモジュールのエラーが発生する可能性がある
      if (error.userCancelled) {
        throw new Error('USER_CANCELLED');
      }
      
      safeLog.warn(LogCategory.API, 'RevenueCat購入処理エラー（Expo Go環境の可能性）', { 
        error: error.message,
        isExpoGo: this.isExpoGo 
      });
      throw error;
    }
  }

  /**
   * 初期化エラーのハンドリング
   */
  private handleInitializationError(error: any): void {
    // test_storeエラーの場合は、プラットフォーム固有のAPIキーを使用する必要がある
    const isTestStoreError = error.message?.includes('test_store') || 
                             error.message?.includes('Store does not contain element');
    
    if (isTestStoreError) {
      safeLog.error(LogCategory.API, 'RevenueCat初期化エラー: test_storeエラー', { 
        error: error.message,
        isExpoGo: this.isExpoGo,
        suggestion: '開発ビルドでは、プラットフォーム固有のAPIキー（EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEYまたはEXPO_PUBLIC_REVENUECAT_IOS_API_KEY）を使用してください'
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
    // test_storeエラーの場合は、プラットフォーム固有のAPIキーを使用する必要がある
    const isTestStoreError = error.message?.includes('test_store') || 
                             error.message?.includes('Store does not contain element');
    
    // ConfigurationError: オファリングに商品が登録されていない場合
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
      // オファリングに商品が登録されていない場合
      // エラーメッセージにも「If you don't want to use the offerings system, you can safely ignore this message.」とあるため、警告として記録する
      safeLog.warn(LogCategory.API, 'オファリング設定エラー: RevenueCatダッシュボードでオファリングに商品を登録してください', { 
        error: error.message,
        isExpoGo: this.isExpoGo,
        suggestion: 'RevenueCatダッシュボード > Offerings > defaultオファリング > パッケージに商品を追加してください。または、プラットフォーム（Android/iOS）に商品を連携してください。',
        reference: 'https://rev.cat/how-to-configure-offerings'
      });
      // このエラーは無視して続行（オファリングシステムを使用しない場合は問題ない）
    } else {
      safeLog.warn(LogCategory.API, 'オファリング取得エラー（Expo Go環境の可能性）', { 
        error: error.message,
        isExpoGo: this.isExpoGo 
      });
    }
    // オファリング取得エラーでも続行（Expo Go環境など）
  }
}

