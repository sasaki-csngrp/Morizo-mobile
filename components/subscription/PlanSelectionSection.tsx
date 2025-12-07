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
  const handlePlanSelect = (planType: PlanType) => {
    if (planType === currentPlan?.plan_type) {
      return; // 現在のプランは選択不可
    }
    onPlanSelect(planType);
  };

  return (
    <View style={styles.container}>
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

