/**
 * RecipeListModal - レシピ一覧モーダル
 * Phase 2.3: レシピ一覧表示機能
 * Phase 2.5: 段階的提案の選択機能を追加
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RecipeCandidate } from '../types/menu';
import ImageHandler from './ImageHandler';
import { RecipeListModalSelectionInfo } from '../hooks/useModalManagement';
import { sendSelection } from '../api/recipe-api';

interface RecipeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: RecipeCandidate[];
  currentStage?: 'main' | 'sub' | 'soup';
  selectionInfo?: RecipeListModalSelectionInfo | null;
}

const RecipeListModal: React.FC<RecipeListModalProps> = ({
  isOpen,
  onClose,
  candidates,
  currentStage,
  selectionInfo
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [showStageConfirmation, setShowStageConfirmation] = useState<boolean>(false);
  const [confirmationData, setConfirmationData] = useState<{
    message: string;
    nextStageName: string;
  } | null>(null);

  const stageLabel = currentStage === 'main' ? '主菜' : currentStage === 'sub' ? '副菜' : currentStage === 'soup' ? '汁物' : '';
  
  const getTitle = () => {
    if (stageLabel) {
      return `${stageLabel}の提案（${candidates.length}件）`;
    }
    return `レシピ提案（${candidates.length}件）`;
  };

  // 不足食材チェックから除外する食材リスト（一般的な調味料・水など）
  const EXCLUDED_INGREDIENTS = [
    '水',
    'はちみつ',
    'ハチミツ',
    '塩',
    'こしょう',
    '胡椒',
    'コショウ',
    '醤油',
    'しょうゆ',
    '味噌',
    'みそ',
    '砂糖',
    'みりん',
    '酒',
    '料理酒',
    '酢',
    '油',
    'サラダ油',
    'オリーブオイル',
    'ごま油',
    'バター',
    'マヨネーズ',
    'ケチャップ',
    'ウスターソース',
    'オイスターソース',
    '豆板醤',
    '甜麺醤',
    '味の素',
    'だし',
    'だしの素',
    'コンソメ',
    '顆粒だし',
    'チューブ生姜',
    'チューブにんにく',
    'ネギ分', // 「ネギ分」のような表記も除外
    'ブラックペッパー',
    'ブラックペッパ',
    'ペッパー',
    'ガーリックパウダー',
    'ガーリックパウダ',
    'にんにくパウダー',
    'にんにくパウダ',
    'パルメザンチーズ',
    'パルメザン',
    'パルメザンチーズ粉',
  ].map(ing => ing.toLowerCase());

  // 不足食材を判定する関数
  const getMissingIngredients = (recipeIngredients: string[]): string[] => {
    if (!selectionInfo?.usedIngredients || selectionInfo.usedIngredients.length === 0) {
      return []; // 使える食材情報がない場合は判定しない
    }

    const usedIngredientsSet = new Set(
      selectionInfo.usedIngredients.map(ing => ing.trim().toLowerCase())
    );

    return recipeIngredients.filter(ingredient => {
      const normalizedIngredient = ingredient.trim().toLowerCase();
      
      // 除外リストに含まれる食材は不足食材として判定しない
      if (EXCLUDED_INGREDIENTS.some(excluded => 
        normalizedIngredient.includes(excluded) || excluded.includes(normalizedIngredient)
      )) {
        return false;
      }

      // 完全一致をチェック
      if (usedIngredientsSet.has(normalizedIngredient)) {
        return false;
      }
      // 部分一致もチェック（「豚バラ肉」と「豚バラ」など）
      const isContained = Array.from(usedIngredientsSet).some(usedIng => 
        normalizedIngredient.includes(usedIng) || usedIng.includes(normalizedIngredient)
      );
      return !isContained;
    });
  };

  // 決定ボタンのクリックハンドラー
  const handleConfirm = async () => {
    if (!selectionInfo || selectedIndex === null) return;
    
    // 確認ダイアログが表示されている場合は処理をスキップ
    if (showStageConfirmation) {
      return;
    }
    
    // SSEセッションIDの検証
    if (!selectionInfo.sseSessionId || selectionInfo.sseSessionId === 'unknown') {
      Alert.alert('エラー', 'セッション情報が無効です。ページを再読み込みしてください。');
      return;
    }
    
    setIsConfirming(true);
    
    try {
      // バックエンドに選択結果を送信
      const result = await sendSelection(
        selectionInfo.taskId,
        selectedIndex + 1, // 1-based index
        selectionInfo.sseSessionId
      );
      
      if (result.success) {
        // 選択結果を親コンポーネントに通知
        selectionInfo.onSelect(selectedIndex + 1, result);
        
        // 確認ステップが必要な場合
        if (result.requires_stage_confirmation && result.confirmation_message && result.next_stage_name) {
          setConfirmationData({
            message: result.confirmation_message,
            nextStageName: result.next_stage_name
          });
          setShowStageConfirmation(true);
          setIsConfirming(false);
          return;
        }
        
        // 確認ステップが不要な場合
        if (result.requires_next_stage && selectionInfo.onNextStageRequested) {
          selectionInfo.onNextStageRequested(selectionInfo.sseSessionId);
        }
        
        // モーダルを閉じる
        handleClose();
      } else {
        throw new Error(result.error || 'Selection failed');
      }
    } catch (error) {
      console.error('Selection failed:', error);
      Alert.alert('エラー', '選択に失敗しました。もう一度お試しください。');
    } finally {
      setIsConfirming(false);
    }
  };

  // モーダルが閉じる時に選択状態をリセット
  const handleClose = () => {
    setSelectedIndex(null);
    setShowStageConfirmation(false);
    setConfirmationData(null);
    onClose();
  };

  // デバッグ用: selectionInfoの状態を確認
  React.useEffect(() => {
    if (isOpen) {
      console.log('[RecipeListModal] selectionInfo:', selectionInfo);
      console.log('[RecipeListModal] currentStage:', currentStage);
      console.log('[RecipeListModal] candidates:', candidates.map(c => ({
        title: c.title,
        urlsCount: c.urls?.length || 0,
        urls: c.urls?.map(u => ({ url: u.url, image_url: u.image_url })) || []
      })));
    }
  }, [isOpen, selectionInfo, currentStage, candidates]);

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>{getTitle()}</Text>
            {selectionInfo && selectedIndex !== null && (
              <Text style={styles.selectedIndicator}>
                {selectedIndex + 1}番のレシピを選択中
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* レシピリスト */}
        <ScrollView style={styles.content}>
          <View style={styles.grid}>
            {candidates.map((candidate, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  if (selectionInfo) {
                    setSelectedIndex(selectedIndex === index ? null : index);
                  }
                }}
                style={[
                  styles.recipeCard,
                  selectionInfo && selectedIndex === index && styles.recipeCardSelected
                ]}
              >
                {/* 画像表示 */}
                {candidate.urls && candidate.urls.length > 0 && (
                  <View style={styles.imageContainer}>
                    <ImageHandler
                      urls={candidate.urls}
                      title={candidate.title}
                      onUrlClick={(url) => Linking.openURL(url)}
                    />
                  </View>
                )}
                
                {/* レシピタイトル */}
                <View style={styles.recipeTitleContainer}>
                  {selectionInfo && (
                    <View style={styles.radioContainer}>
                      <View style={[
                        styles.radio,
                        selectedIndex === index && styles.radioSelected
                      ]}>
                        {selectedIndex === index && <View style={styles.radioInner} />}
                      </View>
                    </View>
                  )}
                  <Text style={styles.recipeTitle}>
                    {index + 1}. {candidate.title}
                  </Text>
                </View>
                
                {/* 食材情報 */}
                {candidate.ingredients && candidate.ingredients.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>📋 使用食材</Text>
                    <View style={styles.ingredientsContainer}>
                      {(() => {
                        const missingIngredients = getMissingIngredients(candidate.ingredients);
                        const availableIngredients = candidate.ingredients.filter(
                          ing => !missingIngredients.includes(ing)
                        );
                        
                        return (
                          <>
                            {availableIngredients.length > 0 && (
                              <Text style={styles.sectionContent}>
                                {availableIngredients.join(', ')}
                              </Text>
                            )}
                            {missingIngredients.length > 0 && (
                              <View style={styles.missingIngredientsContainer}>
                                {availableIngredients.length > 0 && (
                                  <Text style={styles.sectionContent}>, </Text>
                                )}
                                <View style={styles.missingIngredientsBadges}>
                                  {missingIngredients.map((ingredient, idx) => (
                                    <View key={idx} style={styles.missingIngredientBadge}>
                                      <Text style={styles.missingIngredientText}>
                                        ⚠️ {ingredient}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}
                          </>
                        );
                      })()}
                    </View>
                    {(() => {
                      const missingIngredients = getMissingIngredients(candidate.ingredients);
                      if (missingIngredients.length > 0) {
                        return (
                          <View style={styles.missingWarningContainer}>
                            <Text style={styles.missingWarningText}>
                              ⚠️ {missingIngredients.length}種類の食材が使える食材に含まれていません
                            </Text>
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </View>
                )}
                
                {/* 調理時間 */}
                {candidate.cooking_time && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>⏱️ 調理時間</Text>
                    <Text style={styles.sectionContent}>
                      {candidate.cooking_time}
                    </Text>
                  </View>
                )}
                
                {/* 説明 */}
                {candidate.description && (
                  <Text style={styles.description}>
                    {candidate.description}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* 段階遷移確認ダイアログ */}
        {showStageConfirmation && confirmationData && (
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationMessage}>
              {confirmationData.message}
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowStageConfirmation(false);
                  setConfirmationData(null);
                  if (selectionInfo?.onNextStageRequested) {
                    selectionInfo.onNextStageRequested(selectionInfo.sseSessionId);
                  }
                  handleClose();
                }}
                style={styles.confirmationButton}
              >
                <Text style={styles.confirmationButtonText}>進む</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowStageConfirmation(false);
                  setConfirmationData(null);
                  handleClose();
                }}
                style={[styles.confirmationButton, styles.confirmationButtonCancel]}
              >
                <Text style={styles.confirmationButtonText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* フッター */}
        <View style={styles.footer}>
          {selectionInfo && (
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={selectedIndex === null || isConfirming || selectionInfo.isLoading || showStageConfirmation}
              style={[
                styles.confirmButton,
                (selectedIndex === null || isConfirming || selectionInfo.isLoading || showStageConfirmation) && styles.confirmButtonDisabled
              ]}
            >
              {isConfirming ? (
                <View style={styles.confirmButtonContent}>
                  <ActivityIndicator size="small" color="#ffffff" style={styles.confirmButtonSpinner} />
                  <Text style={styles.confirmButtonText}>確定中...</Text>
                </View>
              ) : (
                <Text style={styles.confirmButtonText}>このレシピを決定</Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleClose} style={styles.closeFooterButton}>
            <Text style={styles.closeFooterButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  selectedIndicator: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  grid: {
    padding: 16,
  },
  recipeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recipeCardSelected: {
    borderColor: '#2563EB',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  recipeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioContainer: {
    marginRight: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  imageContainer: {
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 14,
    color: '#374151',
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  missingIngredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  missingIngredientsBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  missingIngredientBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginVertical: 2,
  },
  missingIngredientText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '500',
  },
  missingWarningContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  missingWarningText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  sourceContainer: {
    marginTop: 8,
  },
  sourceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    alignSelf: 'flex-start',
  },
  sourceBadgeLLM: {
    backgroundColor: '#9333EA',
  },
  sourceBadgeRAG: {
    backgroundColor: '#22C55E',
  },
  sourceBadgeWeb: {
    backgroundColor: '#3B82F6',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmButtonSpinner: {
    marginRight: 8,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationContainer: {
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
  },
  confirmationMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  confirmationButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  confirmationButtonCancel: {
    backgroundColor: '#9CA3AF',
  },
  confirmationButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeFooterButton: {
    backgroundColor: '#9CA3AF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RecipeListModal;
