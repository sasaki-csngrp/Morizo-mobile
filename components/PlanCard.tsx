import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PlanType, PLAN_DISPLAY_NAMES, PLAN_LIMITS } from '../config/subscription';

interface PlanCardProps {
  planType: PlanType;
  isCurrentPlan?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}

export function PlanCard({ 
  planType, 
  isCurrentPlan = false,
  isSelected = false,
  onSelect,
  disabled = false 
}: PlanCardProps) {
  const limits = PLAN_LIMITS[planType];
  const displayName = PLAN_DISPLAY_NAMES[planType];
  
  const getPlanColor = () => {
    switch (planType) {
      case 'free':
        return '#6B7280'; // グレー
      case 'pro':
        return '#3B82F6'; // ブルー
      case 'ultimate':
        return '#8B5CF6'; // パープル
      default:
        return '#6B7280';
    }
  };

  const planColor = getPlanColor();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCurrentPlan && styles.currentPlan,
        isSelected && styles.selected,
        disabled && styles.disabled,
        { borderColor: planColor }
      ]}
      onPress={onSelect}
      disabled={disabled || !onSelect}
      activeOpacity={0.7}
    >
      {/* プラン名 */}
      <View style={styles.header}>
        <Text style={[styles.planName, { color: planColor }]}>
          {displayName}
        </Text>
        {isCurrentPlan && (
          <View style={[styles.badge, { backgroundColor: planColor }]}>
            <Text style={styles.badgeText}>現在のプラン</Text>
          </View>
        )}
      </View>

      {/* 制限情報 */}
      <View style={styles.limitsContainer}>
        <View style={styles.limitItem}>
          <Text style={styles.limitLabel}>献立一括提案</Text>
          <Text style={styles.limitValue}>{limits.menu_bulk}回/日</Text>
        </View>
        <View style={styles.limitItem}>
          <Text style={styles.limitLabel}>段階的提案</Text>
          <Text style={styles.limitValue}>{limits.menu_step}回/日</Text>
        </View>
        <View style={styles.limitItem}>
          <Text style={styles.limitLabel}>OCR読み取り</Text>
          <Text style={styles.limitValue}>{limits.ocr}回/日</Text>
        </View>
      </View>

      {/* 選択インジケーター */}
      {isSelected && !isCurrentPlan && (
        <View style={[styles.selectedIndicator, { backgroundColor: planColor }]}>
          <Text style={styles.selectedIndicatorText}>選択中</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentPlan: {
    borderWidth: 3,
    backgroundColor: '#F9FAFB',
  },
  selected: {
    borderWidth: 3,
    backgroundColor: '#F0F9FF',
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  limitsContainer: {
    gap: 12,
  },
  limitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  limitLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  limitValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  selectedIndicator: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

