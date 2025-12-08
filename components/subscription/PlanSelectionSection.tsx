import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlanCard } from '../PlanCard';
import { PlanType } from '../../config/subscription';
import { PlanInfo } from '../../api/subscription-api';

interface PlanSelectionSectionProps {
  currentPlan: PlanInfo | null;
  selectedPlan: PlanType | null;
  onPlanSelect: (planType: PlanType) => void;
}

export function PlanSelectionSection({
  currentPlan,
  selectedPlan,
  onPlanSelect,
}: PlanSelectionSectionProps) {
  // サブスクリプションが有効かどうかを判定
  const isActive = currentPlan?.subscription_status === 'active';

  const handlePlanSelect = (planType: PlanType) => {
    // 有効なサブスクリプションで、かつ同じプランの場合は選択不可
    if (isActive && planType === currentPlan?.plan_type) {
      return; // 現在のプランは選択不可
    }
    onPlanSelect(planType);
  };

  // 各プランが選択可能かどうかを判定
  const isPlanDisabled = (planType: PlanType): boolean => {
    // 有効なサブスクリプションで、かつ現在のプランの場合のみ選択不可
    return isActive && planType === currentPlan?.plan_type;
  };

  // 各プランが現在のプランかどうかを判定（表示用）
  const isCurrentPlanDisplay = (planType: PlanType): boolean => {
    return planType === currentPlan?.plan_type;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>プランを選択</Text>
      
      <PlanCard
        planType="free"
        isCurrentPlan={isCurrentPlanDisplay('free')}
        isSelected={selectedPlan === 'free'}
        onSelect={() => handlePlanSelect('free')}
        disabled={isPlanDisabled('free')}
      />
      
      <PlanCard
        planType="pro"
        isCurrentPlan={isCurrentPlanDisplay('pro')}
        isSelected={selectedPlan === 'pro'}
        onSelect={() => handlePlanSelect('pro')}
        disabled={isPlanDisabled('pro')}
      />
      
      <PlanCard
        planType="ultimate"
        isCurrentPlan={isCurrentPlanDisplay('ultimate')}
        isSelected={selectedPlan === 'ultimate'}
        onSelect={() => handlePlanSelect('ultimate')}
        disabled={isPlanDisabled('ultimate')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
});

