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
import { SubscriptionHeader } from '../components/subscription/SubscriptionHeader';
import { CurrentPlanSection } from '../components/subscription/CurrentPlanSection';
import { UsageInfoSection } from '../components/subscription/UsageInfoSection';
import { PlanSelectionSection } from '../components/subscription/PlanSelectionSection';
import { PurchaseButton } from '../components/subscription/PurchaseButton';
import { InfoBox } from '../components/subscription/InfoBox';

interface SubscriptionScreenProps {
  onClose?: () => void;
}

export default function SubscriptionScreen({ onClose }: SubscriptionScreenProps = {}) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const revenueCatClient = RevenueCatClient.getInstance();
  
  // サブスクリプションデータ管理フック
  const { currentPlan, usageInfo, isLoading, loadSubscriptionData, setCurrentPlan } = useSubscription();
  
  // 購入処理フック
  const { isPurchasing, handlePurchase } = usePurchase({
    currentPlan,
    selectedPlan,
    setSelectedPlan,
    onPurchaseSuccess: (plan) => setCurrentPlan(plan),
    onLoadSubscriptionData: loadSubscriptionData,
  });

  // 初期化
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
              onPress={handlePurchase}
            />
          )}
          
          <InfoBox />

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
});

