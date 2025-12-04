import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory: () => void;
  onOpenInventory: () => void;
  onOpenSubscription?: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onOpenHistory, onOpenInventory, onOpenSubscription }) => {
  const { user, signOut, deleteAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウントを削除',
      'この操作は取り消せません。すべてのデータが削除されます。本当にアカウントを削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const result = await deleteAccount();
              if (!result.success) {
                Alert.alert(
                  'エラー',
                  result.error || 'アカウントの削除に失敗しました。',
                  [{ text: 'OK' }]
                );
              }
              // 成功時は deleteAccount 内で signOut が実行されるため、
              // ここでは何もしない（自動的にログイン画面に遷移）
            } catch (error: any) {
              Alert.alert(
                'エラー',
                error.message || 'アカウントの削除中にエラーが発生しました。',
                [{ text: 'OK' }]
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>プロフィール</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButtonTouchable}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* プロフィール情報 */}
          <View style={styles.profileInfo}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.statusText}>ログイン中</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>

          {/* サブスクリプションボタン */}
          {onOpenSubscription && (
            <TouchableOpacity
              style={styles.subscriptionButton}
              onPress={() => {
                onClose();
                onOpenSubscription();
              }}
              disabled={loading || deleting}
            >
              <Text style={styles.subscriptionButtonText}>💎 サブスクリプション</Text>
            </TouchableOpacity>
          )}

          {/* ログアウトボタン */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={loading || deleting}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#6b7280" />
            ) : (
              <Text style={styles.signOutButtonText}>ログアウト</Text>
            )}
          </TouchableOpacity>

          {/* もっと見るボタン */}
          <TouchableOpacity
            style={styles.moreOptionsButton}
            onPress={() => setShowMoreOptions(!showMoreOptions)}
            disabled={loading || deleting}
          >
            <Text style={styles.moreOptionsButtonText}>
              {showMoreOptions ? 'もっと見る▲' : 'もっと見る▼'}
            </Text>
          </TouchableOpacity>

          {/* アカウント削除ボタン（もっと見るを押したら表示） */}
          {showMoreOptions && (
            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={handleDeleteAccount}
              disabled={loading || deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.deleteAccountButtonText}>アカウントを削除</Text>
              )}
            </TouchableOpacity>
          )}

          {/* 閉じるボタン（下部） */}
          <TouchableOpacity
            style={styles.closeButtonBottom}
            onPress={onClose}
          >
            <Text style={styles.closeButtonBottomText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButtonTouchable: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    fontSize: 28,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  closeButtonBottom: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    width: '100%',
    alignItems: 'center',
  },
  closeButtonBottomText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    backgroundColor: '#dbeafe',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarTextLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statusText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  signOutButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  moreOptionsButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  moreOptionsButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteAccountButton: {
    backgroundColor: '#991b1b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  deleteAccountButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  subscriptionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserProfileModal;

