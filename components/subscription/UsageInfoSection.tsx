import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UsageLimitInfo } from '../../api/subscription-api';
import { formatResetTime } from '../../lib/subscription/utils';

interface UsageInfoSectionProps {
  usageInfo: UsageLimitInfo;
}

export function UsageInfoSection({ usageInfo }: UsageInfoSectionProps) {
  return (
    <View style={styles.container}>
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
});

