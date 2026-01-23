import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PlanType } from '../config/subscription';
import { RevenueCatClient } from '../lib/subscription/revenue-cat-client';
import { useSubscription } from '../hooks/useSubscription';
import { usePurchase } from '../hooks/usePurchase';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionHeader } from '../components/subscription/SubscriptionHeader';
import { CurrentPlanSection } from '../components/subscription/CurrentPlanSection';
import { UsageInfoSection } from '../components/subscription/UsageInfoSection';
import { PlanSelectionSection } from '../components/subscription/PlanSelectionSection';
import { PurchaseButton } from '../components/subscription/PurchaseButton';
import { InfoBox } from '../components/subscription/InfoBox';
import { PurchaseInfoSection } from '../components/subscription/PurchaseInfoSection';
import { BillingPeriodToggle, BillingPeriod } from '../components/subscription/BillingPeriodToggle';
import { showAlert } from '../utils/alert';
import { PRODUCT_ID_TO_PLAN } from '../config/subscription';

interface SubscriptionScreenProps {
  onClose?: () => void;
}

export default function SubscriptionScreen({ onClose }: SubscriptionScreenProps = {}) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const revenueCatClient = RevenueCatClient.getInstance();
  const { user } = useAuth();
  
  // サブスクリプションデータ管理フック
  const { currentPlan, usageInfo, isLoading, loadSubscriptionData, setCurrentPlan } = useSubscription();
  
  // 購入処理フック
  const { isPurchasing, handlePurchase } = usePurchase({
    currentPlan,
    selectedPlan,
    setSelectedPlan,
    billingPeriod,
    onPurchaseSuccess: (plan) => setCurrentPlan(plan),
    onLoadSubscriptionData: loadSubscriptionData,
  });

  // 初期化（Supabaseのuser.idをappUserIDとして設定）
  useEffect(() => {
    if (user?.id) {
      // Supabaseのuser_idをappUserIDとして設定
      revenueCatClient.initialize(user.id);
    } else {
      revenueCatClient.initialize();
    }
  }, [user]);

  // 診断情報を表示（課金状態とDB状態の不整合を調査）
  const showDiagnostics = async () => {
    try {
      const diagnostics = await revenueCatClient.getCustomerInfoDiagnostics();
      
      // バックエンドのプラン情報
      const backendPlan = currentPlan?.plan_type || '取得できませんでした';
      const backendStatus = currentPlan?.subscription_status || '取得できませんでした';
      
      // RevenueCatのアクティブなサブスクリプションからプランタイプを推定
      let revenueCatPlan = 'なし';
      if (diagnostics.activeSubscriptions.length > 0) {
        const firstSub = diagnostics.activeSubscriptions[0];
        // 商品IDからプランタイプを取得
        revenueCatPlan = PRODUCT_ID_TO_PLAN[firstSub] || `不明 (${firstSub})`;
      }
      
      // エンタイトルメント情報
      let entitlementInfo = 'なし';
      const entitlementDetails: string[] = [];
      if (diagnostics.entitlements.pro?.isActive) {
        entitlementDetails.push(`PRO (商品ID: ${diagnostics.entitlements.pro.productId || '不明'}, 識別子: ${diagnostics.entitlements.pro.identifier || 'pro'})`);
      }
      if (diagnostics.entitlements.ultimate?.isActive) {
        entitlementDetails.push(`ULTIMATE (商品ID: ${diagnostics.entitlements.ultimate.productId || '不明'}, 識別子: ${diagnostics.entitlements.ultimate.identifier || 'ultimate'})`);
      }
      if (entitlementDetails.length > 0) {
        entitlementInfo = entitlementDetails.join('\n');
      }
      
      // 不整合の検出
      const hasActiveSubscriptions = diagnostics.activeSubscriptions.length > 0;
      const isBackendActive = backendStatus === 'active';
      const isBackendExpired = backendStatus === 'expired' || backendStatus === 'cancelled';
      
      const mismatches: string[] = [];
      
      // 1. プランタイプの不一致
      if (backendPlan !== revenueCatPlan && revenueCatPlan !== 'なし' && backendPlan !== '取得できませんでした') {
        mismatches.push(`プランタイプ: バックエンド(${backendPlan}) vs RevenueCat(${revenueCatPlan})`);
      }
      
      // 2. ステータスの不一致: バックエンドがexpiredなのにRevenueCatにアクティブなサブスクリプションがある
      if (isBackendExpired && hasActiveSubscriptions) {
        mismatches.push(`ステータス: バックエンド(${backendStatus})なのに、RevenueCatにアクティブなサブスクリプションがあります`);
      }
      
      // 3. ステータスの不一致: バックエンドがactiveなのにRevenueCatにアクティブなサブスクリプションがない
      if (isBackendActive && !hasActiveSubscriptions) {
        mismatches.push(`ステータス: バックエンド(${backendStatus})なのに、RevenueCatにアクティブなサブスクリプションがありません`);
      }
      
      const mismatchMessage = mismatches.length > 0
        ? `⚠️ 以下の不整合が見つかりました:\n${mismatches.map(m => `  • ${m}`).join('\n')}`
        : '✅ 不整合は見つかりませんでした';
      
      const message = [
        '【診断情報】',
        '',
        '【バックエンド（DB）】',
        `プランタイプ: ${backendPlan}`,
        `ステータス: ${backendStatus}`,
        '',
        '【RevenueCat（課金状態）】',
        `アクティブなサブスクリプション: ${diagnostics.activeSubscriptions.length > 0 ? diagnostics.activeSubscriptions.join(', ') : 'なし'}`,
        `推定プランタイプ: ${revenueCatPlan}`,
        `エンタイトルメント:`,
        entitlementInfo !== 'なし' ? entitlementInfo : '  なし',
        '',
        '【不整合の可能性】',
        mismatchMessage,
      ].join('\n');
      
      showAlert('診断情報', message);
    } catch (error: any) {
      showAlert('診断エラー', `診断情報の取得に失敗しました: ${error.message}`);
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
          
          {/* 月額・年額の切り替えUI（プランが選択されている場合のみ表示） */}
          {selectedPlan && selectedPlan !== 'free' && (
            <BillingPeriodToggle
              selectedPeriod={billingPeriod}
              onPeriodChange={setBillingPeriod}
            />
          )}
          
          {selectedPlan && (() => {
            // サブスクリプションが有効かどうかを判定
            const isActive = currentPlan?.subscription_status === 'active';
            // 有効なサブスクリプションで、かつ同じプランの場合は購入ボタンを非表示
            // 期限切れやキャンセル済みの場合は、同じプランでも再購入可能
            const shouldShowPurchaseButton = !isActive || selectedPlan !== currentPlan?.plan_type;
            
            return shouldShowPurchaseButton ? (
              <>
                {/* 購入ボタンの上に必須情報を表示（Android/iOS共通: 金額・期間・メッセージ、iOS専用: 利用規約・プライバシーポリシー） */}
                <PurchaseInfoSection 
                  selectedPlan={selectedPlan} 
                  billingPeriod={billingPeriod}
                />
                <PurchaseButton
                  selectedPlan={selectedPlan}
                  isPurchasing={isPurchasing}
                  onPress={handlePurchase}
                />
                <InfoBox />
              </>
            ) : (
              <InfoBox />
            );
          })()}
          
          {!selectedPlan && <InfoBox />}

        {/* 診断ボタン（開発用） */}
        <TouchableOpacity
          style={styles.diagnosticButton}
          onPress={showDiagnostics}
        >
          <Text style={styles.diagnosticButtonText}>🔍 診断情報を表示</Text>
        </TouchableOpacity>

        {/* Expo Go環境での注意メッセージ */}
        {revenueCatClient.getIsExpoGo() && (
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
  diagnosticButton: {
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  diagnosticButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
  },
});

