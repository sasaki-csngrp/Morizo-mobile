import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface ProfileSectionProps {
  userEmail: string | undefined;
  onPress: () => void;
  onOpenHistory?: () => void;
  onOpenInventory?: () => void;
}

export function ProfileSection({ 
  userEmail, 
  onPress, 
  onOpenHistory, 
  onOpenInventory 
}: ProfileSectionProps) {
  return (
    <View style={styles.profileSection}>
      <View style={styles.buttonsContainer}>
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

      {/* ユーザーアイコン */}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 32 : 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
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
  avatarButton: {
    padding: 8,
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

