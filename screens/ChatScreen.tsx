/**
 * Morizo Mobile - チャット画面
 * 
 * Phase 4: リファクタリング完了
 * 音声録音機能、UIセクション、認証チェック、チャット履歴管理を分離して保守性を向上
 */

import React, { useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import RecipeViewerScreen from './RecipeViewerScreen';
import RecipeListModal from '../components/RecipeListModal';
import HistoryPanel from '../components/HistoryPanel';
import InventoryPanel from '../components/InventoryPanel';
import UserProfileModal from '../components/UserProfileModal';
import SubscriptionScreen from './SubscriptionScreen';
import ChatInput from '../components/ChatInput';
import ChatMessageList from '../components/ChatMessageList';
import { ProfileSection } from '../components/ProfileSection';
import { AuthGuard } from '../components/AuthGuard';
import InventorySelectionModal from '../components/InventorySelectionModal';
import OtherProposalSelectionModal from '../components/OtherProposalSelectionModal';
import { InventoryItem } from '../api/inventory-api';
import { useModalManagement } from '../hooks/useModalManagement';
import { useRecipeSelection } from '../hooks/useRecipeSelection';
import { useChatMessages } from '../hooks/useChatMessages';
import { useSSEHandling } from '../hooks/useSSEHandling';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useSubscription } from '../hooks/useSubscription';
import { ChatMessage } from '../types/chat';

function ChatScreenContent() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTextChatLoading, setIsTextChatLoading] = useState(false);
  const [isVoiceChatLoading, setIsVoiceChatLoading] = useState(false);
  const [awaitingSelection, setAwaitingSelection] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubscriptionScreenOpen, setIsSubscriptionScreenOpen] = useState(false);
  const [isInventorySelectionModalOpen, setIsInventorySelectionModalOpen] = useState(false);
  const [isOtherProposalSelectionModalOpen, setIsOtherProposalSelectionModalOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();

  // カスタムフック
  const modalManagement = useModalManagement();
  const recipeSelection = useRecipeSelection(setChatMessages, setAwaitingSelection);
  const { currentPlan, usageInfo, loadSubscriptionData } = useSubscription();
  const chatMessagesHook = useChatMessages(
    chatMessages,
    setChatMessages,
    setIsTextChatLoading,
    scrollViewRef,
    currentPlan,
    usageInfo
  );
  const sseHandling = useSSEHandling(
    chatMessages,
    setChatMessages,
    setIsTextChatLoading,
    chatMessagesHook.setAwaitingConfirmation,
    chatMessagesHook.setConfirmationSessionId,
    setAwaitingSelection,
    scrollViewRef,
    chatMessagesHook.getApiUrl,
    chatMessagesHook.setHelpSessionId,
    loadSubscriptionData,
    currentPlan,
    usageInfo
  );

  // 音声録音機能
  const voiceRecording = useVoiceRecording(
    chatMessages,
    setChatMessages,
    isVoiceChatLoading,
    setIsVoiceChatLoading,
    scrollViewRef,
    chatMessagesHook,
    chatMessagesHook.getApiUrl
  );

  // 現在のステージ情報を取得（最新の選択要求メッセージから）
  const currentStage = React.useMemo(() => {
    // 最新の選択要求メッセージを探す
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      const message = chatMessages[i];
      if (message.requiresSelection && message.currentStage) {
        return message.currentStage;
      }
    }
    return undefined;
  }, [chatMessages]);

  // 主菜提案リクエスト処理
  const handleRequestMainProposal = async (mainIngredient?: string) => {
    // 主菜提案メッセージを生成
    const message = mainIngredient
      ? `${mainIngredient}の主菜を5件提案して`
      : '主菜を5件提案して';

    // メッセージを送信（sendTextMessageDirect内でユーザーメッセージを追加）
    await chatMessagesHook.sendTextMessageDirect(message);
  };

  // その他提案リクエスト処理
  const handleRequestOtherProposal = async (message: string) => {
    // メッセージを送信（sendTextMessageDirect内でユーザーメッセージを追加）
    await chatMessagesHook.sendTextMessageDirect(message);
  };

  // 在庫選択ハンドラー
  const handleInventorySelect = (selectedItem: InventoryItem | null) => {
    setIsInventorySelectionModalOpen(false);
    if (selectedItem) {
      handleRequestMainProposal(selectedItem.item_name);
    } else {
      handleRequestMainProposal();
    }
  };

  // その他提案選択ハンドラー
  const handleOtherProposalSelect = (message: string) => {
    setIsOtherProposalSelectionModalOpen(false);
    handleRequestOtherProposal(message);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* チャット履歴エリア */}
      <ChatMessageList
        chatMessages={chatMessages}
        scrollViewRef={scrollViewRef}
        isTextChatLoading={isTextChatLoading}
        awaitingSelection={awaitingSelection}
        selectedRecipes={recipeSelection.selectedRecipes}
        isSavingMenu={recipeSelection.isSavingMenu}
        savedMessage={recipeSelection.savedMessage}
        onSaveMenu={recipeSelection.handleSaveMenu}
        onClearHistory={() => {
          Alert.alert(
            'チャット履歴をクリア',
            'チャット履歴と選択済みレシピを削除しますか？',
            [
              {
                text: 'キャンセル',
                style: 'cancel',
              },
              {
                text: 'クリア',
                style: 'destructive',
                onPress: () => {
                  chatMessagesHook.clearChatHistory(setAwaitingSelection, recipeSelection.clearSelectedRecipes);
                },
              },
            ]
          );
        }}
        onSelect={recipeSelection.handleSelection}
        onViewList={modalManagement.handleViewList}
        onRequestMore={sseHandling.handleRequestMore}
        onNextStageRequested={sseHandling.handleNextStageRequested}
        onOpenRecipeViewer={modalManagement.openRecipeViewer}
        createOnCompleteHandler={sseHandling.createOnCompleteHandler}
        createOnErrorHandler={sseHandling.createOnErrorHandler}
        createOnTimeoutHandler={sseHandling.createOnTimeoutHandler}
        createOnProgressHandler={sseHandling.createOnProgressHandler}
        currentPlan={currentPlan}
        usageInfo={usageInfo}
      />

      {/* テキストチャット入力欄 - キーボードの上に移動 */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ChatInput
          textMessage={chatMessagesHook.textMessage}
          setTextMessage={chatMessagesHook.setTextMessage}
          onSend={chatMessagesHook.sendTextMessage}
          isTextChatLoading={isTextChatLoading}
          awaitingSelection={awaitingSelection}
          currentStage={currentStage}
          isVoiceChatLoading={isVoiceChatLoading}
          isRecording={voiceRecording.isRecording}
          onStartRecording={voiceRecording.startRecording}
          onStopRecording={voiceRecording.stopRecording}
        />
      </KeyboardAvoidingView>

      {/* ユーザープロフィールセクション（在庫・履歴ボタンとアバターアイコン）- 画面最下部に固定 */}
      <ProfileSection
        userEmail={user?.email}
        onPress={() => setIsProfileModalOpen(true)}
        onOpenHistory={() => {
          modalManagement.openHistoryPanel();
        }}
        onOpenInventory={() => {
          modalManagement.openInventoryPanel();
        }}
        onRequestMainProposal={() => {
          setIsInventorySelectionModalOpen(true);
        }}
        onRequestOtherProposal={() => {
          setIsOtherProposalSelectionModalOpen(true);
        }}
      />

      <StatusBar style="auto" />

      {/* レシピビューアー画面 */}
      <RecipeViewerScreen
        visible={modalManagement.showRecipeViewer && !!modalManagement.recipeViewerData}
        response={modalManagement.recipeViewerData?.response || ''}
        result={modalManagement.recipeViewerData?.result}
        onClose={modalManagement.closeRecipeViewer}
      />

      {/* Phase 2.3: レシピ一覧モーダル */}
      <RecipeListModal
        isOpen={modalManagement.isListModalOpen}
        onClose={modalManagement.closeListModal}
        candidates={modalManagement.listModalCandidates}
        currentStage={modalManagement.listModalCurrentStage}
        selectionInfo={modalManagement.listModalSelectionInfo}
      />

      {/* Phase 3.2: 履歴パネル */}
      <HistoryPanel
        isOpen={modalManagement.isHistoryPanelOpen}
        onClose={modalManagement.closeHistoryPanel}
      />

      {/* Phase 2: 在庫パネル */}
      <InventoryPanel
        isOpen={modalManagement.isInventoryPanelOpen}
        onClose={modalManagement.closeInventoryPanel}
      />

      {/* UI改善: ユーザープロフィールモーダル */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenHistory={() => {
          setIsProfileModalOpen(false);
          modalManagement.openHistoryPanel();
        }}
        onOpenInventory={() => {
          setIsProfileModalOpen(false);
          modalManagement.openInventoryPanel();
        }}
        onOpenSubscription={() => {
          setIsSubscriptionScreenOpen(true);
        }}
      />

      {/* サブスクリプション画面 */}
      {isSubscriptionScreenOpen && (
        <SubscriptionScreen
          onClose={() => setIsSubscriptionScreenOpen(false)}
        />
      )}

      {/* 在庫選択モーダル */}
      <InventorySelectionModal
        isOpen={isInventorySelectionModalOpen}
        onClose={() => setIsInventorySelectionModalOpen(false)}
        onSelect={handleInventorySelect}
      />

      {/* その他提案選択モーダル */}
      <OtherProposalSelectionModal
        isOpen={isOtherProposalSelectionModalOpen}
        onClose={() => setIsOtherProposalSelectionModalOpen(false)}
        onSelect={handleOtherProposalSelect}
      />
    </SafeAreaView>
  );
}

export default function ChatScreen() {
  return (
    <AuthGuard>
      <ChatScreenContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
