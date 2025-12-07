import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlanCard } from '../PlanCard';
import { PlanInfo } from '../../api/subscription-api';

interface CurrentPlanSectionProps {
  currentPlan: PlanInfo;
}

export function CurrentPlanSection({ currentPlan }: CurrentPlanSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>現在のプラン</Text>
      <PlanCard
        planType={currentPlan.plan_type}
        isCurrentPlan={true}
        disabled={true}
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

