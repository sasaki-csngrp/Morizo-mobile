import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { updateRecipeRating } from '../api/menu-api';

interface RecipeRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: {
    history_id: string;
    title: string;
    url?: string;
    image_url?: string;
    rating?: number;
    notes?: string;
  } | null;
  onSave: (rating: number | null, notes: string) => void;
}

const RecipeRatingModal: React.FC<RecipeRatingModalProps> = ({
  isOpen,
  onClose,
  recipe,
  onSave,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルが開いたときにレシピデータを初期化
  useEffect(() => {
    if (isOpen && recipe) {
      setSelectedRating(recipe.rating || null);
      setNotes(recipe.notes || '');
      setError(null);
    } else {
      // モーダルが閉じられたときに状態をリセット
      setSelectedRating(null);
      setNotes('');
      setError(null);
    }
  }, [isOpen, recipe]);

  const handleSave = async () => {
    if (!recipe) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateRecipeRating(recipe.history_id, selectedRating, notes.trim() || null);
      onSave(selectedRating, notes.trim());
      onClose();
    } catch (err) {
      console.error('Failed to save rating:', err);
      const errorMessage = err instanceof Error ? err.message : '評価の保存に失敗しました';
      setError(errorMessage);
      Alert.alert('エラー', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImagePress = () => {
    if (recipe?.url) {
      Linking.openURL(recipe.url).catch((err) => {
        console.error('Failed to open URL:', err);
        Alert.alert('エラー', 'レシピページを開けませんでした');
      });
    }
  };

  if (!isOpen || !recipe) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContainer}>
                {/* ヘッダー */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>レシピの評価を選択してください</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    disabled={isSaving}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* コンテンツ */}
                <ScrollView 
                  style={styles.content} 
                  contentContainerStyle={styles.contentContainer}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            {/* レシピ画像 */}
            {recipe.image_url && (
              <TouchableOpacity
                onPress={handleImagePress}
                activeOpacity={0.9}
                style={styles.imageContainer}
              >
                <Image
                  source={{ uri: recipe.image_url }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageOverlayText}>タップでレシピページを開く</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* レシピタイトル */}
            <View style={styles.titleContainer}>
              <Text style={styles.recipeTitle}>
                {recipe.title.replace(/^(主菜|副菜|汁物):\s*/, '')}
              </Text>
            </View>

            {/* 説明文 */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>
                このレシピに対するあなたの「好き」の度合いを選んでください。
              </Text>
            </View>

            {/* 評価選択 */}
            <View style={styles.ratingContainer}>
              <TouchableOpacity
                onPress={() => setSelectedRating(5)}
                disabled={isSaving}
                style={[
                  styles.ratingButton,
                  selectedRating === 5 && styles.ratingButtonActive,
                  selectedRating === 5 && styles.ratingButtonActiveRed,
                  isSaving && styles.ratingButtonDisabled,
                ]}
              >
                <Text style={styles.ratingEmoji}>❤️</Text>
                <Text style={styles.ratingLabel}>めっちゃ好き</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedRating(3)}
                disabled={isSaving}
                style={[
                  styles.ratingButton,
                  selectedRating === 3 && styles.ratingButtonActive,
                  selectedRating === 3 && styles.ratingButtonActiveGray,
                  isSaving && styles.ratingButtonDisabled,
                ]}
              >
                <Text style={styles.ratingEmoji}>🤍</Text>
                <Text style={styles.ratingLabel}>普通</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedRating(1)}
                disabled={isSaving}
                style={[
                  styles.ratingButton,
                  selectedRating === 1 && styles.ratingButtonActive,
                  selectedRating === 1 && styles.ratingButtonActivePurple,
                  isSaving && styles.ratingButtonDisabled,
                ]}
              >
                <Text style={styles.ratingEmoji}>💔</Text>
                <Text style={styles.ratingLabel}>好きじゃない</Text>
              </TouchableOpacity>
            </View>

            {/* コメント入力 */}
            <View style={styles.commentContainer}>
              <Text style={styles.commentLabel}>コメント（任意）</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                disabled={isSaving}
                multiline
                numberOfLines={4}
                style={styles.commentInput}
                placeholder="コメントを入力してください..."
                placeholderTextColor="#9ca3af"
                editable={!isSaving}
              />
            </View>
          </ScrollView>

          {/* フッター */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSaving}
              style={[styles.footerButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.footerButton, styles.saveButton, isSaving && styles.saveButtonDisabled]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>登録</Text>
              )}
            </TouchableOpacity>
          </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    minHeight: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
  },
  content: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 180,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  imageOverlayText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
  titleContainer: {
    marginBottom: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  ratingButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingButtonActiveRed: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  ratingButtonActiveGray: {
    borderColor: '#9ca3af',
    backgroundColor: '#f9fafb',
  },
  ratingButtonActivePurple: {
    borderColor: '#9333ea',
    backgroundColor: '#faf5ff',
  },
  ratingButtonDisabled: {
    opacity: 0.5,
  },
  ratingEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  commentContainer: {
    marginBottom: 16,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
    minHeight: 120,
    maxHeight: 200,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  footerButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});

export default RecipeRatingModal;

