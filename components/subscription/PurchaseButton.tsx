import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { PlanType, PLAN_DISPLAY_NAMES } from '../../config/subscription';
import { RevenueCatClient } from '../../lib/subscription/revenue-cat-client';

interface PurchaseButtonProps {
  selectedPlan: PlanType;
  isPurchasing: boolean;
  onPress: () => void;
}

export function PurchaseButton({
  selectedPlan,
  isPurchasing,
  onPress,
}: PurchaseButtonProps) {
  const revenueCatClient = RevenueCatClient.getInstance();
  const isExpoGo = revenueCatClient.getIsExpoGo();
  const isRevenueCatAvailable = revenueCatClient.isAvailable();

  const getButtonText = () => {
    if (selectedPlan === 'free') {
      return '無料プランに変更';
    }
    if (isExpoGo && !isRevenueCatAvailable) {
      return `${PLAN_DISPLAY_NAMES[selectedPlan]}プランをテスト（Expo Go）`;
    }
    if (!isRevenueCatAvailable) {
      return `${PLAN_DISPLAY_NAMES[selectedPlan]}プランをテスト`;
    }
    return `${PLAN_DISPLAY_NAMES[selectedPlan]}プランを購入`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.purchaseButton,
        isPurchasing && styles.purchaseButtonDisabled,
        selectedPlan === 'free' && styles.downgradeButton,
      ]}
      onPress={onPress}
      disabled={isPurchasing}
    >
      {isPurchasing ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text
          style={[
            styles.purchaseButtonText,
            selectedPlan === 'free' && styles.downgradeButtonText,
          ]}
        >
          {getButtonText()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#6B7280',
  },
  downgradeButtonText: {
    color: '#FFFFFF',
  },
});

