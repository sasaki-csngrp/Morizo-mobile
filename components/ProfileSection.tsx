import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';

interface ProfileSectionProps {
  userEmail: string | undefined;
  onPress: () => void;
  onOpenHistory?: () => void;
  onOpenInventory?: () => void;
  onRequestMainProposal?: () => void;
  onRequestOtherProposal?: () => void;
}

export function ProfileSection({ 
  userEmail, 
  onPress, 
  onOpenHistory, 
  onOpenInventory,
  onRequestMainProposal,
  onRequestOtherProposal,
}: ProfileSectionProps) {
  return (
    <View style={styles.profileSection}>
      {/* 横スクロール可能なボタン群 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.buttonsContainer}>
          {/* 主菜提案ボタン */}
          {onRequestMainProposal && (
            <TouchableOpacity
              style={styles.proposalButton}
              onPress={onRequestMainProposal}
              activeOpacity={0.7}
            >
              <Text style={styles.proposalButtonText}>+ 主菜提案</Text>
            </TouchableOpacity>
          )}

          {/* その他提案ボタン */}
          {onRequestOtherProposal && (
            <TouchableOpacity
              style={[styles.proposalButton, styles.proposalButtonOther]}
              onPress={onRequestOtherProposal}
              activeOpacity={0.7}
            >
              <Text style={styles.proposalButtonText}>+ その他提案</Text>
            </TouchableOpacity>
          )}

          {/* 在庫ボタン */}
          {onOpenInventory && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onOpenInventory}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonIcon}>📦</Text>
              <Text style={styles.actionButtonText}>在庫</Text>
            </TouchableOpacity>
          )}

          {/* 履歴ボタン */}
          {onOpenHistory && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onOpenHistory}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonIcon}>📅</Text>
              <Text style={styles.actionButtonText}>履歴</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ユーザーアイコン（常に右側に固定） */}
      <TouchableOpacity style={styles.avatarButton} onPress={onPress}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {userEmail?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 16 : 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  scrollContainer: {
    flex: 1,
    marginLeft: 20,
  },
  scrollContent: {
    paddingRight: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  proposalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  proposalButtonOther: {
    backgroundColor: '#16a34a',
  },
  proposalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  avatarButton: {
    padding: 8,
    marginLeft: 8,
    marginRight: 20,
    marginTop: Platform.OS === 'android' ? 4 : 0,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    backgroundColor: '#e3f2fd',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
});

