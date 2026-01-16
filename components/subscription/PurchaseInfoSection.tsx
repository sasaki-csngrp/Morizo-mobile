import React from 'react';
import { View, Text, StyleSheet, Platform, Linking } from 'react-native';
import { PlanType } from '../../config/subscription';

interface PurchaseInfoSectionProps {
  selectedPlan: PlanType | null;
}

/**
 * iOS専用: 購入ボタンの上に表示される情報セクション
 * Apple App Store審査要件を満たすため、購入前に必ず表示される
 */
export function PurchaseInfoSection({ selectedPlan }: PurchaseInfoSectionProps) {
  const isIOS = Platform.OS === 'ios';

  // 価格情報を取得
  const getPriceInfo = (plan: PlanType | null): string | null => {
    if (!plan || plan === 'free') return null;
    if (plan === 'pro') return '1か月 100円';
    if (plan === 'ultimate') return '1か月 500円';
    return null;
  };

  // iOS専用の購入前情報（Apple App Store審査用）
  if (!isIOS || !selectedPlan || selectedPlan === 'free') {
    return null;
  }

  const priceInfo = getPriceInfo(selectedPlan);

  return (
    <View style={styles.container}>
      {/* サブスクリプションの期間と価格 */}
      {priceInfo && (
        <View style={styles.priceSection}>
          <Text style={styles.priceText}>{priceInfo}</Text>
        </View>
      )}

      {/* 提供されるサービス内容の再明記 */}
      <View style={styles.serviceSection}>
        <Text style={styles.serviceText}>
          この期間中、記載のすべての機能が利用可能です。
        </Text>
      </View>

      {/* 利用規約とプライバシーポリシーへのリンク */}
      <View style={styles.links}>
        <Text 
          style={styles.link}
          onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
        >
          利用規約
        </Text>
        <Text style={styles.linkSeparator}> | </Text>
        <Text 
          style={styles.link}
          onPress={() => Linking.openURL('https://www.csngrp.co.jp/privacy/')}
        >
          プライバシーポリシー
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceSection: {
    marginBottom: 12,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  serviceSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  serviceText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    fontSize: 14,
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
