import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlanCard } from '../PlanCard';
import { PlanInfo } from '../../api/subscription-api';

interface CurrentPlanSectionProps {
  currentPlan: PlanInfo;
}

export function CurrentPlanSection({ currentPlan }: CurrentPlanSectionProps) {
  // サブスクリプションが有効かどうかを判定
  const isActive = currentPlan.subscription_status === 'active';
  const isExpired = currentPlan.subscription_status === 'expired';
  const isCancelled = currentPlan.subscription_status === 'cancelled';

  // ステータス表示用のテキストとスタイル
  const getStatusInfo = () => {
    if (isExpired) {
      return {
        text: '期限切れ',
        color: '#EF4444', // 赤
        backgroundColor: '#FEE2E2', // 薄い赤
      };
    }
    if (isCancelled) {
      return {
        text: 'キャンセル済み',
        color: '#F59E0B', // オレンジ
        backgroundColor: '#FEF3C7', // 薄いオレンジ
      };
    }
    return null;
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>現在のプラン</Text>
      <PlanCard
        planType={currentPlan.plan_type}
        isCurrentPlan={true}
        disabled={true}
      />
      {statusInfo && (
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
          <Text style={styles.statusDescription}>
            {isExpired 
              ? '現在は無料プラン相当の機能のみご利用いただけます。再購入でPRO機能を復活できます。'
              : '現在は無料プラン相当の機能のみご利用いただけます。再購入でPRO機能を復活できます。'
            }
          </Text>
        </View>
      )}
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
  statusBadge: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});

