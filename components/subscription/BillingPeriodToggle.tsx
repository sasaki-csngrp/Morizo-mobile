import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type BillingPeriod = 'monthly' | 'yearly';

interface BillingPeriodToggleProps {
  selectedPeriod: BillingPeriod;
  onPeriodChange: (period: BillingPeriod) => void;
}

/**
 * 月額・年額の切り替えUIコンポーネント
 */
export function BillingPeriodToggle({
  selectedPeriod,
  onPeriodChange,
}: BillingPeriodToggleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>支払い期間</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedPeriod === 'monthly' && styles.toggleButtonActive,
          ]}
          onPress={() => onPeriodChange('monthly')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.toggleButtonText,
              selectedPeriod === 'monthly' && styles.toggleButtonTextActive,
            ]}
          >
            月額
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedPeriod === 'yearly' && styles.toggleButtonActive,
          ]}
          onPress={() => onPeriodChange('yearly')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.toggleButtonText,
              selectedPeriod === 'yearly' && styles.toggleButtonTextActive,
            ]}
          >
            年額
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
});
