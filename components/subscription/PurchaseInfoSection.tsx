import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Linking } from 'react-native';
import { PlanType, SUBSCRIPTION_PRODUCTS } from '../../config/subscription';
import { RevenueCatClient } from '../../lib/subscription/revenue-cat-client';
import { BillingPeriod } from './BillingPeriodToggle';

interface PurchaseInfoSectionProps {
  selectedPlan: PlanType | null;
  billingPeriod: BillingPeriod;
}

/**
 * 購入ボタンの上に表示される情報セクション
 * - Android/iOS共通: 金額及び期間表示、「この期間中、記載のすべての機能が利用可能です。」のメッセージ
 * - iOS専用: 利用規約、プライバシーポリシーへのリンク（Apple App Store審査要件）
 */
export function PurchaseInfoSection({ selectedPlan, billingPeriod }: PurchaseInfoSectionProps) {
  const isIOS = Platform.OS === 'ios';
  const [priceInfo, setPriceInfo] = useState<string | null>(null);
  const revenueCatClient = RevenueCatClient.getInstance();

  // RevenueCatから価格情報を取得
  useEffect(() => {
    const loadPrice = async () => {
      if (!selectedPlan || selectedPlan === 'free') {
        setPriceInfo(null);
        return;
      }

      try {
        // 選択された期間（月額/年額）に応じて適切な商品IDを選択
        const productId = billingPeriod === 'yearly'
          ? (selectedPlan === 'pro' 
              ? SUBSCRIPTION_PRODUCTS.PRO_YEARLY 
              : SUBSCRIPTION_PRODUCTS.ULTIMATE_YEARLY)
          : (selectedPlan === 'pro' 
              ? SUBSCRIPTION_PRODUCTS.PRO_MONTHLY 
              : SUBSCRIPTION_PRODUCTS.ULTIMATE_MONTHLY);

        // RevenueCatから価格情報を取得
        const price = revenueCatClient.getPackagePrice(productId);
        
        if (price) {
          // 期間を追加して表示（例: "¥100 / 月" または "¥1,000 / 年"）
          const periodText = billingPeriod === 'yearly' ? '年' : '月';
          setPriceInfo(`${price} / ${periodText}`);
        } else {
          // RevenueCatから価格が取得できない場合のフォールバック
          // ハードコードされた価格を使用（RevenueCatが利用できない場合）
          const fallbackPrice = billingPeriod === 'yearly'
            ? (selectedPlan === 'pro' ? '1,000円' : '5,000円')
            : (selectedPlan === 'pro' ? '100円' : '500円');
          const periodText = billingPeriod === 'yearly' ? '年' : '月';
          setPriceInfo(`${fallbackPrice} / ${periodText}`);
        }
      } catch (error) {
        // エラー時はフォールバック価格を使用
        const fallbackPrice = billingPeriod === 'yearly'
          ? (selectedPlan === 'pro' ? '1,000円' : '5,000円')
          : (selectedPlan === 'pro' ? '100円' : '500円');
        const periodText = billingPeriod === 'yearly' ? '年' : '月';
        setPriceInfo(`${fallbackPrice} / ${periodText}`);
      }
    };

    loadPrice();
  }, [selectedPlan, billingPeriod, revenueCatClient]);

  // プランが選択されていない場合は表示しない
  if (!selectedPlan || selectedPlan === 'free') {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* サブスクリプションの期間と価格（Android/iOS共通） */}
      {priceInfo && (
        <View style={styles.priceSection}>
          <Text style={styles.priceText}>{priceInfo}</Text>
        </View>
      )}

      {/* 提供されるサービス内容の再明記（Android/iOS共通） */}
      <View style={styles.serviceSection}>
        <Text style={styles.serviceText}>
          この期間中、記載のすべての機能が利用可能です。
        </Text>
      </View>

      {/* 利用規約とプライバシーポリシーへのリンク（iOS専用） */}
      {isIOS && (
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
      )}
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
