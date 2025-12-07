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
import { PlanType, PLAN_DISPLAY_NAMES, SUBSCRIPTION_PRODUCTS, PLAN_TO_PRODUCT_ID } from '../config/subscription';
import { showErrorAlert, showSuccessAlert } from '../utils/alert';
import { safeLog, LogCategory } from '../lib/logging';
import Constants from 'expo-constants';

// RevenueCatのインポート（Expo Go環境では使用不可）
let Purchases: any = null;
let CustomerInfo: any = null;
let PurchasesOffering: any = null;
let PurchasesPackage: any = null;

// Expo Go環境の検出（安全な方法）
// ExecutionEnvironmentがStoreClientの場合のみExpo Go環境と判定
let isExpoGo = false;
try {
  // ExecutionEnvironmentが存在するかチェック
  if (Constants.ExecutionEnvironment && Constants.executionEnvironment !== undefined) {
    // StoreClientの場合のみExpo Go環境
    isExpoGo = Constants.executionEnvironment === Constants.ExecutionEnvironment.StoreClient;
  } else {
    // ExecutionEnvironmentが存在しない場合は、スタンドアロンビルド（EASビルドなど）とみなす
    // Expo Goではない
    isExpoGo = false;
  }
} catch (error) {
  // エラーが発生した場合は、安全のためExpo Goではないとみなす
  // （スタンドアロンビルドの可能性が高い）
  isExpoGo = false;
}

// RevenueCatのインポートを試みる（Expo Go環境でも試行）
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
  // Expo Go環境でも、後でSDKの呼び出しを試みるため、ここではエラーを無視
}

interface SubscriptionScreenProps {
  onClose?: () => void;
}

/**
 * 次のリセット時刻（明朝0:00 JST）を取得
 * @returns ISO 8601形式の文字列
 */
function getNextResetTime(): string {
  // 日本時間（JST）のタイムゾーンを設定
  const jstOffset = 9 * 60; // JSTはUTC+9
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const jst = new Date(utc + (jstOffset * 60000));
  
  // 今日の0:00を取得
  const today = new Date(jst);
  today.setHours(0, 0, 0, 0);
  
  // 現在時刻が今日の0:00より後なら、明日の0:00を返す
  if (jst >= today) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
  }
  
  // 現在時刻が今日の0:00より前なら、今日の0:00を返す
  return today.toISOString();
}

/**
 * リセット時刻をフォーマット（明朝0:00 JST形式で表示）
 * @param resetAt ISO 8601形式の文字列
 * @returns フォーマットされた文字列
 */
function formatResetTime(resetAt: string): string {
  try {
    const date = new Date(resetAt);
    // 日本時間（JST）に変換
    const jstOffset = 9 * 60; // JSTはUTC+9
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const jst = new Date(utc + (jstOffset * 60000));
    
    // 明朝0:00の形式で表示
    const year = jst.getFullYear();
    const month = String(jst.getMonth() + 1).padStart(2, '0');
    const day = String(jst.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day} 0:00:00`;
  } catch (error) {
    // パースエラーの場合は元の文字列を返す
    return resetAt;
  }
}

export default function SubscriptionScreen({ onClose }: SubscriptionScreenProps = {}) {
  const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageLimitInfo | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [isRevenueCatAvailable, setIsRevenueCatAvailable] = useState(Purchases !== null);

  // 初期化とデータ取得
  useEffect(() => {
    initializePurchases();
    loadSubscriptionData();
  }, []);

  // RevenueCatの初期化
  const initializePurchases = async () => {
    // Purchasesが利用できない場合はスキップ
    if (!Purchases) {
      if (isExpoGo) {
        safeLog.info(LogCategory.API, 'RevenueCatはExpo Go環境では使用できません。バックエンドAPI連携のみ動作します。');
      } else {
        safeLog.warn(LogCategory.API, 'RevenueCat SDKが利用できません');
      }
      setIsRevenueCatAvailable(false);
      return;
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
        setIsRevenueCatAvailable(false);
        return;
      }

      // Expo Go環境でも初期化を試みる（エラーが発生する可能性があるが、テストのため）
      await Purchases.configure({ apiKey: revenueCatApiKey });
      safeLog.info(LogCategory.API, 'RevenueCat初期化成功', { isExpoGo });
      setIsRevenueCatAvailable(true);

      // オファリングを取得（Expo Go環境ではエラーが発生する可能性がある）
      try {
        const offeringsData = await Purchases.getOfferings();
        if (offeringsData.current) {
          setOfferings(offeringsData.current);
          // デバッグ用: 利用可能なパッケージをログ出力
          const availablePackages = offeringsData.current.availablePackages || [];
          safeLog.info(LogCategory.API, 'オファリング取得成功', { 
            isExpoGo,
            offeringIdentifier: offeringsData.current.identifier,
            packageCount: availablePackages.length,
            packages: availablePackages.map((pkg: any) => ({
              packageId: pkg.identifier,
              productId: pkg.product?.identifier,
              productTitle: pkg.product?.title,
            }))
          });
        } else {
          safeLog.warn(LogCategory.API, 'オファリングが空です（currentオファリングが設定されていません）', { isExpoGo });
        }
      } catch (offeringsError: any) {
        // test_storeエラーの場合は、プラットフォーム固有のAPIキーを使用する必要がある
        const isTestStoreError = offeringsError.message?.includes('test_store') || 
                               offeringsError.message?.includes('Store does not contain element');
        
        // ConfigurationError: オファリングに商品が登録されていない場合
        const isConfigurationError = offeringsError.code === 'ConfigurationError' ||
                                   offeringsError.message?.includes('no products registered') ||
                                   offeringsError.message?.includes('There are no products registered');
        
        if (isTestStoreError) {
          safeLog.error(LogCategory.API, 'test_storeエラー: プラットフォーム固有のAPIキーを使用してください', { 
            error: offeringsError.message,
            isExpoGo,
            suggestion: 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEYまたはEXPO_PUBLIC_REVENUECAT_IOS_API_KEYを設定してください'
          });
        } else if (isConfigurationError) {
          // オファリングに商品が登録されていない場合
          // エラーメッセージにも「If you don't want to use the offerings system, you can safely ignore this message.」とあるため、警告として記録する
          safeLog.warn(LogCategory.API, 'オファリング設定エラー: RevenueCatダッシュボードでオファリングに商品を登録してください', { 
            error: offeringsError.message,
            isExpoGo,
            suggestion: 'RevenueCatダッシュボード > Offerings > defaultオファリング > パッケージに商品を追加してください。または、プラットフォーム（Android/iOS）に商品を連携してください。',
            reference: 'https://rev.cat/how-to-configure-offerings'
          });
          // このエラーは無視して続行（オファリングシステムを使用しない場合は問題ない）
        } else {
          safeLog.warn(LogCategory.API, 'オファリング取得エラー（Expo Go環境の可能性）', { 
            error: offeringsError.message,
            isExpoGo 
          });
        }
        // オファリング取得エラーでも続行（Expo Go環境など）
      }
    } catch (error: any) {
      // test_storeエラーの場合は、プラットフォーム固有のAPIキーを使用する必要がある
      const isTestStoreError = error.message?.includes('test_store') || 
                               error.message?.includes('Store does not contain element');
      
      if (isTestStoreError) {
        safeLog.error(LogCategory.API, 'RevenueCat初期化エラー: test_storeエラー', { 
          error: error.message,
          isExpoGo,
          suggestion: '開発ビルドでは、プラットフォーム固有のAPIキー（EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEYまたはEXPO_PUBLIC_REVENUECAT_IOS_API_KEY）を使用してください'
        });
      } else {
        safeLog.error(LogCategory.API, 'RevenueCat初期化エラー', { 
          error: error.message,
          isExpoGo 
        });
      }
      setIsRevenueCatAvailable(false);
      // エラーが発生しても続行（Expo Go環境など）
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
            reset_at: (usageData as any).reset_at || getNextResetTime(),
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
          reset_at: getNextResetTime(),
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

  // モック購入処理（Expo Go環境用）
  const handleMockPurchase = async () => {
    if (!selectedPlan || selectedPlan === 'free') {
      return;
    }

    setIsPurchasing(true);
    try {
      // 確認ダイアログを表示
      const dialogTitle = isExpoGo ? 'テストモード（Expo Go）' : 'テストモード';
      const dialogMessage = isExpoGo
        ? `Expo Go環境では実際の購入処理はできませんが、バックエンドAPIのテストを実行します。\n\n${PLAN_DISPLAY_NAMES[selectedPlan]}プランに更新しますか？`
        : `RevenueCatが利用できないため、バックエンドAPIのテストを実行します。\n\n${PLAN_DISPLAY_NAMES[selectedPlan]}プランに更新しますか？`;
      
      Alert.alert(
        dialogTitle,
        dialogMessage,
        [
          {
            text: 'キャンセル',
            style: 'cancel',
            onPress: () => setIsPurchasing(false)
          },
          {
            text: 'テスト実行',
            onPress: async () => {
              try {
                const productId = selectedPlan === 'pro' 
                  ? SUBSCRIPTION_PRODUCTS.PRO_MONTHLY 
                  : SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY;

                const platform = Platform.OS === 'ios' ? 'ios' : 'android';
                
                // モックレシート情報でバックエンドAPIをテスト
                const result = await updateSubscription({
                  product_id: productId,
                  platform,
                  purchase_token: `mock_token_${Date.now()}`, // モックトークン
                  receipt_data: `mock_receipt_${Date.now()}`, // モックレシート
                  package_name: Platform.OS === 'android' ? 'jp.co.csngrp.morizo' : undefined,
                });

                if (result.success) {
                  showSuccessAlert(`${PLAN_DISPLAY_NAMES[selectedPlan]}プランに更新しました（テストモード）`);
                  setCurrentPlan(result.plan);
                  setSelectedPlan(null);
                  await loadSubscriptionData(); // データを再読み込み
                } else {
                  showErrorAlert(result.error || 'プランの更新に失敗しました');
                }
              } catch (error: any) {
                safeLog.error(LogCategory.API, 'モック購入処理エラー', { error: error.message });
                showErrorAlert(`プランの更新に失敗しました: ${error.message}`);
              } finally {
                setIsPurchasing(false);
              }
            }
          }
        ]
      );
    } catch (error: any) {
      safeLog.error(LogCategory.API, 'モック購入処理エラー', { error: error.message });
      setIsPurchasing(false);
    }
  };

  // プラン変更処理（購入・ダウングレード両方に対応）
  const handlePurchase = async () => {
    if (!selectedPlan) {
      showErrorAlert('プランを選択してください');
      return;
    }

    // 無料プランへのダウングレード処理
    if (selectedPlan === 'free') {
      if (currentPlan?.plan_type === 'free') {
        showErrorAlert('すでに無料プランです');
        return;
      }

      // 情報ダイアログを表示（ストアで解約する必要があることを明確に伝える）
      const platformName = Platform.OS === 'ios' ? 'App Store' : 'Google Playストア';
      Alert.alert(
        'プランを無料プランに変更',
        `現在のサブスクリプションを無料プランに変更するには、${platformName}でサブスクリプションを解約する必要があります。\n\n解約方法:\n1. ${platformName}アプリを開く\n2. 「アカウント」→「購入とサブスクリプション」→「サブスクリプション」を選択\n3. 現在のサブスクリプションを選択して「キャンセル」をクリック\n\n解約後、次回の更新日から無料プランに戻ります。`,
        [
          {
            text: '了解',
            style: 'default'
          }
        ]
      );
      setSelectedPlan(null); // 選択をリセット
      return;
    }

    // RevenueCatが利用できない場合は、モック処理でテスト
    // ただし、EASビルド環境では通常のエラーメッセージを表示する
    if (!isRevenueCatAvailable || !Purchases) {
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
      const platformName = Platform.OS === 'ios' ? 'App Store' : 'Google Playストア';
      const currentPlanName = PLAN_DISPLAY_NAMES[currentPlan.plan_type];
      const newPlanName = PLAN_DISPLAY_NAMES[selectedPlan];
      
      // アップグレードの場合（pro → ultimate）
      if (selectedPlan === 'ultimate' && currentPlan.plan_type === 'pro') {
        Alert.alert(
          'プランをアップグレード',
          `${currentPlanName}プランから${newPlanName}プランにアップグレードします。\n\n既存の${currentPlanName}プランは自動的にキャンセルされ、${newPlanName}プランに置き換えられます。\n\n二重課金を防ぐため、${platformName}で既存のサブスクリプションが正しくキャンセルされているか確認してください。`,
          [
            {
              text: 'キャンセル',
              style: 'cancel',
              onPress: () => setSelectedPlan(null)
            },
            {
              text: 'アップグレード',
              onPress: async () => {
                await proceedWithPurchase();
              }
            }
          ]
        );
        return;
      }
      
      // ダウングレードの場合（ultimate → pro）
      if (selectedPlan === 'pro' && currentPlan.plan_type === 'ultimate') {
        Alert.alert(
          'プランをダウングレード',
          `${currentPlanName}プランから${newPlanName}プランにダウングレードします。\n\n既存の${currentPlanName}プランは自動的にキャンセルされ、${newPlanName}プランに置き換えられます。\n\n二重課金を防ぐため、${platformName}で既存のサブスクリプションが正しくキャンセルされているか確認してください。`,
          [
            {
              text: 'キャンセル',
              style: 'cancel',
              onPress: () => setSelectedPlan(null)
            },
            {
              text: 'ダウングレード',
              onPress: async () => {
                await proceedWithPurchase();
              }
            }
          ]
        );
        return;
      }
      
      // 同じプランへの購入の場合
      if (selectedPlan === currentPlan.plan_type) {
        showErrorAlert(`既に${currentPlanName}プランがアクティブです`);
        setSelectedPlan(null);
        return;
      }
    }

    await proceedWithPurchase();
  };

  // 実際の購入処理
  const proceedWithPurchase = async () => {
    if (!selectedPlan) {
      return;
    }

    // RevenueCatが利用できない場合は、モック処理でテスト
    // ただし、EASビルド環境では通常のエラーメッセージを表示する
    if (!isRevenueCatAvailable || !Purchases) {
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

    // RevenueCatの購入処理を試みる（Expo Go環境でもエラーハンドリングでテスト可能）
    setIsPurchasing(true);
    try {
      // RevenueCatから商品を取得
      const productId = selectedPlan === 'pro' 
        ? SUBSCRIPTION_PRODUCTS.PRO_MONTHLY 
        : SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY;

      let purchaseResult: any = null;

      // オファリングからパッケージを取得
      if (offerings) {
        // デバッグ用: 利用可能なパッケージをログ出力
        const availablePackages = offerings.availablePackages || [];
        safeLog.info(LogCategory.API, 'パッケージ検索開始', {
          searchedProductId: productId,
          availablePackages: availablePackages.map((pkg: any) => ({
            packageId: pkg.identifier,
            productId: pkg.product?.identifier,
            productTitle: pkg.product?.title,
          })),
          isExpoGo
        });

        // Package IDまたはProduct IDで検索
        // 注意: Play Storeの商品をインポートした場合、Product IDは「商品ID:ストア内の商品ID」形式になる
        // 例: "morizo_pro_monthly:morizo-pro-monthly"
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
            isExpoGo
          });
          
          // Expo Go環境でも購入処理を試みる（エラーハンドリングでテスト可能）
          try {
            purchaseResult = await Purchases.purchasePackage(packageToPurchase);
            safeLog.info(LogCategory.API, 'RevenueCat購入処理成功', { isExpoGo });
          } catch (purchaseError: any) {
            // Expo Go環境では、ネイティブモジュールのエラーが発生する可能性がある
            safeLog.warn(LogCategory.API, 'RevenueCat購入処理エラー（Expo Go環境の可能性）', { 
              error: purchaseError.message,
              isExpoGo 
            });
            throw purchaseError; // エラーを再スローして、モック処理にフォールバック
          }
        } else {
          // デバッグ用: 利用可能なパッケージをログ出力（既に上で出力済み）
          safeLog.error(LogCategory.API, '商品が見つかりません', {
            searchedProductId: productId,
            availablePackages: availablePackages.map((pkg: any) => ({
              packageId: pkg.identifier,
              productId: pkg.product?.identifier,
              productTitle: pkg.product?.title,
            })),
            isExpoGo,
            suggestion: 'RevenueCatダッシュボードで、オファリングのパッケージにPlay Storeの商品が正しく選択されているか確認してください。パッケージのProduct IDが「' + productId + '」と一致している必要があります。'
          });
          
          // Expo Go環境でプレビュー用のパッケージしかない場合、早期にモック処理にフォールバック
          const hasOnlyPreviewPackages = offerings.availablePackages.every(
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
      } else {
        // オファリングが取得できない場合、直接商品IDで購入を試みる
        // 注意: この方法は推奨されませんが、フォールバックとして使用
        safeLog.warn(LogCategory.API, 'オファリングが取得できません', { isExpoGo });
        throw new Error('オファリングが取得できません');
      }

      // 購入成功後、バックエンドにレシートを送信
      if (purchaseResult) {
        // purchaseResultの構造を確認（CustomerInfoオブジェクトまたはラップされた構造の可能性）
        const customerInfo = purchaseResult.customerInfo || purchaseResult;
        safeLog.info(LogCategory.API, '購入結果の構造確認', {
          hasCustomerInfo: !!purchaseResult.customerInfo,
          purchaseResultKeys: Object.keys(purchaseResult),
          customerInfoKeys: customerInfo ? Object.keys(customerInfo) : []
        });
        await syncPurchaseWithBackend(customerInfo, productId);
      }
    } catch (error: any) {
      safeLog.error(LogCategory.API, '購入処理エラー', { 
        error: error.message,
        isExpoGo 
      });
      
      // ユーザーがキャンセルした場合はエラーを表示しない
      if (error.userCancelled) {
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

      // customerInfoの構造を安全に確認
      if (!customerInfo) {
        safeLog.error(LogCategory.API, 'バックエンド同期エラー: customerInfoがnull/undefined', { productId });
        throw new Error('購入情報を取得できませんでした');
      }

      // エンタイトルメントIDを取得（Product IDからプランタイプを推測）
      const planType = selectedPlan || (productId.includes('pro') ? 'pro' : 'ultimate');
      const entitlementId = planType; // エンタイトルメントIDはプランタイプと同じ（pro/ultimate）

      // エンタイトルメント情報を安全に取得
      const entitlements = customerInfo.entitlements;
      if (!entitlements) {
        // エンタイトルメントが設定されていない場合のフォールバック
        safeLog.warn(LogCategory.API, 'エンタイトルメントが設定されていません。RevenueCatダッシュボードでエンタイトルメントを設定してください。', { 
          productId,
          customerInfoKeys: Object.keys(customerInfo),
          suggestion: 'RevenueCatダッシュボード > Product catalog > Entitlements でエンタイトルメントを作成し、オファリングのパッケージに紐付けてください。'
        });
        
        // エンタイトルメントがなくても、購入は成功しているので、バックエンドに送信を試みる
        // ただし、購入トークンやレシートデータは取得できない可能性がある
        const activeEntitlements = {};
        const activeEntitlement = null;
        
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

  // 注意: 「購入を復元」機能は削除しました
  // 理由: RevenueCatは自動的に購入履歴を同期するため、手動での復元は不要です
  // - 別のデバイスで購入したサブスクリプションは、同じユーザーIDで自動的に同期されます
  // - アプリを再インストールした場合も、RevenueCatの初期化時に自動的に購入履歴が復元されます
  // - プランの切り替えは、通常の購入フローで行えます

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
                  リセット時刻: {formatResetTime(usageInfo.reset_at)}
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

        {/* 購入/変更ボタン */}
        {selectedPlan && selectedPlan !== currentPlan?.plan_type && (
          <TouchableOpacity
            style={[
              styles.purchaseButton, 
              isPurchasing && styles.purchaseButtonDisabled,
              selectedPlan === 'free' && styles.downgradeButton
            ]}
            onPress={handlePurchase}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.purchaseButtonText,
                selectedPlan === 'free' && styles.downgradeButtonText
              ]}>
                {selectedPlan === 'free'
                  ? '無料プランに変更'
                  : isExpoGo && !isRevenueCatAvailable
                  ? `${PLAN_DISPLAY_NAMES[selectedPlan]}プランをテスト（Expo Go）`
                  : !isRevenueCatAvailable
                  ? `${PLAN_DISPLAY_NAMES[selectedPlan]}プランをテスト`
                  : `${PLAN_DISPLAY_NAMES[selectedPlan]}プランを購入`}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* 注意: 購入履歴は自動的に同期されます */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            ℹ️ 購入履歴は自動的に同期されます。{'\n'}
            別のデバイスで購入したサブスクリプションや、アプリを再インストールした場合も、自動的に反映されます。
          </Text>
        </View>

        {/* Expo Go環境での注意メッセージ */}
        {isExpoGo && (
          <View style={styles.expoGoNotice}>
            <Text style={styles.expoGoNoticeText}>
              ⚠️ Expo Go環境では購入機能は使用できません。{'\n'}
              バックエンドAPI連携（プラン情報・利用回数の表示）のみ動作します。
            </Text>
          </View>
        )}

        {/* 閉じるボタン */}
        {onClose && (
          <TouchableOpacity
            style={styles.closeButtonBottom}
            onPress={onClose}
          >
            <Text style={styles.closeButtonBottomText}>閉じる</Text>
          </TouchableOpacity>
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
  downgradeButton: {
    backgroundColor: '#6B7280', // グレー（無料プランカードと同じ色）
  },
  downgradeButtonText: {
    color: '#FFFFFF',
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
  closeButtonBottom: {
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  closeButtonBottomText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  infoBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBoxText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});

