import { useState } from 'react';
import { Alert } from 'react-native';
import { ChatMessage } from '../types/chat';
import { supabase } from '../lib/supabase';
import { generateSSESessionId } from '../lib/session-manager';
import { logAPI, logComponent } from '../lib/logging';
import { showErrorAlert } from '../utils/alert';
import { getApiUrl } from '../lib/api-config';
import { PlanInfo, UsageLimitInfo } from '../api/subscription-api';

/**
 * チャットメッセージ管理フック
 * メッセージ送信、履歴管理、SSEセッション管理、確認要求の状態を管理
 */
export function useChatMessages(
  chatMessages: ChatMessage[],
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setIsTextChatLoading: React.Dispatch<React.SetStateAction<boolean>>,
  scrollViewRef: React.RefObject<any>,
  currentPlan: PlanInfo | null,
  usageInfo: UsageLimitInfo | null
) {
  const [textMessage, setTextMessage] = useState<string>('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState<boolean>(false);
  const [confirmationSessionId, setConfirmationSessionId] = useState<string | null>(null);
  const [helpSessionId, setHelpSessionId] = useState<string | null>(null);

  /**
   * メッセージ内容から献立一括提案か段階的提案かを判定
   */
  const detectProposalType = (message: string): 'menu_bulk' | 'menu_step' | null => {
    const normalizedMessage = message.trim().toLowerCase();
    
    // 献立一括提案のキーワード（より包括的なパターン）
    const menuBulkPatterns = [
      /献立を提案/,
      /献立を教えて/,
      /献立を作って/,
      /献立を考えて/,
      /献立を.*提案/,
      /メニューを提案/,
      /メニューを教えて/,
      /今日の献立/,
      /献立.*提案/,
      /メニュー.*提案/,
      /献立.*作って/,
      /献立.*考えて/,
    ];
    
    // 段階的提案のキーワード（より包括的なパターン）
    const menuStepPatterns = [
      /主菜.*提案/,
      /主菜.*教えて/,
      /主菜.*選んで/,
      /副菜.*提案/,
      /副菜.*教えて/,
      /副菜.*選んで/,
      /汁物.*提案/,
      /汁物.*教えて/,
      /汁物.*選んで/,
      /その他のレシピ/,
      /その他.*レシピ/,
      /ご飯もの/,
      /麺もの/,
      /パスタもの/,
      /.*の主菜.*提案/,
      /.*の副菜.*提案/,
      /.*の汁物.*提案/,
    ];
    
    // 段階的提案を先にチェック（より具体的なパターンなので優先）
    for (const pattern of menuStepPatterns) {
      if (pattern.test(normalizedMessage)) {
        return 'menu_step';
      }
    }
    
    // 献立一括提案のチェック
    for (const pattern of menuBulkPatterns) {
      if (pattern.test(normalizedMessage)) {
        return 'menu_bulk';
      }
    }
    
    return null;
  };

  /**
   * サブスクリプション制限をチェック
   * 期限切れの場合でも、無料プランの制限内であれば機能を使えるようにする
   * データが読み込まれていない場合は、チェックをスキップしてバックエンドに任せる
   */
  const checkSubscriptionLimit = (proposalType: 'menu_bulk' | 'menu_step'): boolean => {
    // データが読み込まれていない場合は、チェックをスキップ（バックエンドでチェック）
    if (!currentPlan || !usageInfo) {
      console.log('[DEBUG] checkSubscriptionLimit: データ未読み込み、スキップ');
      return true;
    }

    // 利用回数制限をチェック
    // useSubscriptionフックで既に期限切れの場合はfreeプランの制限に設定されている
    const usage = proposalType === 'menu_bulk' ? usageInfo.menu_bulk : usageInfo.menu_step;
    const isExpired = currentPlan.subscription_status !== 'active';
    
    console.log('[DEBUG] checkSubscriptionLimit:', {
      proposalType,
      isExpired,
      subscription_status: currentPlan.subscription_status,
      plan_type: currentPlan.plan_type,
      usage: usage ? { current: usage.current, limit: usage.limit } : null,
      usageInfo: JSON.stringify(usageInfo)
    });
    
    if (usage && usage.current >= usage.limit) {
      const featureName = proposalType === 'menu_bulk' ? '献立一括提案' : '段階的提案';
      const message = isExpired
        ? `本日の${featureName}回数（${usage.current}/${usage.limit}）に達しました。\n\n現在は無料プラン相当の機能のみご利用いただけます。\n\nPRO機能を利用するには、サブスクリプションを再購入してください。`
        : `本日の${featureName}回数（${usage.current}/${usage.limit}）に達しました。\n\n利用回数は毎日リセットされます。`;
      
      console.log('[DEBUG] checkSubscriptionLimit: 制限超過、ブロック');
      Alert.alert(
        '利用回数制限に達しました',
        message,
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }

    // 制限内であれば、期限切れでも機能を使える
    console.log('[DEBUG] checkSubscriptionLimit: 制限内、許可');
    return true;
  };

  const sendTextMessage = async () => {
    if (!textMessage.trim()) return;

    // 献立一括提案または段階的提案の場合は制限チェック
    const proposalType = detectProposalType(textMessage);
    console.log('[DEBUG] detectProposalType:', { message: textMessage, proposalType });
    console.log('[DEBUG] subscription check:', { currentPlan, usageInfo });
    
    if (proposalType) {
      const canProceed = checkSubscriptionLimit(proposalType);
      console.log('[DEBUG] checkSubscriptionLimit result:', { proposalType, canProceed });
      if (!canProceed) {
        setIsTextChatLoading(false);
        return;
      }
    }

    setIsTextChatLoading(true);
    
    // デバッグログ: 状態を確認
    console.log('[DEBUG] awaitingConfirmation:', awaitingConfirmation);
    console.log('[DEBUG] confirmationSessionId:', confirmationSessionId);
    
    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: textMessage,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    const currentMessage = textMessage;
    setTextMessage(''); // 入力フィールドをクリア
    
    // SSEセッションIDの決定と送信時の確認応答フラグを記録
    let sseSessionId: string;
    const isConfirmationRequest = awaitingConfirmation && !!confirmationSessionId;
    
    // ヘルプモード判定: 数字入力（1-5）またはヘルプキーワードの場合
    const isHelpKeyword = /^(使い方を教えて|使い方を知りたい|使い方を説明して|ヘルプ|help)$/i.test(currentMessage.trim());
    const isHelpNumber = /^[1-5]$/.test(currentMessage.trim());
    const isHelpModeInput = isHelpKeyword || isHelpNumber;
    const isInHelpMode = !!helpSessionId && (isHelpNumber || isHelpKeyword);

    if (isConfirmationRequest) {
      // 曖昧性確認中の場合は既存のセッションIDを使用
      sseSessionId = confirmationSessionId;
      console.log('[DEBUG] Using existing session ID (confirmation):', sseSessionId);
    } else if (isInHelpMode) {
      // ヘルプモード中の場合は既存のヘルプセッションIDを使用
      sseSessionId = helpSessionId;
      console.log('[DEBUG] Using existing session ID (help mode):', sseSessionId);
    } else {
      // 新規リクエストの場合は新しいセッションIDを生成
      sseSessionId = generateSSESessionId();
      console.log('[DEBUG] Generated new session ID:', sseSessionId);
      
      // 通常のチャット入力（数字でもヘルプキーワードでもない）の場合はヘルプモードを終了
      if (helpSessionId && !isHelpModeInput) {
        console.log('[DEBUG] Exiting help mode (normal chat input)');
        setHelpSessionId(null);
      }
    }
    
    console.log('[DEBUG] Sending request with:', {
      message: currentMessage,
      sse_session_id: sseSessionId,
      confirm: isConfirmationRequest,
      awaitingConfirmation: awaitingConfirmation,
      confirmationSessionId: confirmationSessionId
    });
    
    // ヘルプモード中（数字1-5入力）の場合は、ストリーミング進捗表示を追加しない
    // HTTPレスポンスから直接処理するため
    const shouldSkipStreaming = isInHelpMode && isHelpNumber;
    
    if (!shouldSkipStreaming) {
      // ストリーミング進捗表示を追加
      const streamingMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'streaming',
        content: '',
        timestamp: new Date(),
        sseSessionId: sseSessionId,
      };
      setChatMessages(prev => [...prev, streamingMessage]);
    }
    
    // スクロールを最下部に移動
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      const apiUrl = `${getApiUrl()}/chat`;
      
      // 認証トークンを取得
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        throw new Error('認証トークンが取得できません');
      }

      logAPI('POST', apiUrl, 0, { message: currentMessage, action: 'テキストチャット送信開始' });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({ 
          message: currentMessage,
          sse_session_id: sseSessionId,
          confirm: isConfirmationRequest
        }),
      });

      if (!response.ok) {
        throw new Error(`チャットAPI エラー: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('[DEBUG] HTTP Response received (for reference only):', {
        success: data.success,
        has_response: !!data.response,
        response_preview: data.response?.substring(0, 100)
      });
      
      // ヘルプ応答の検知: ヘルプ全体概要または機能別詳細の応答かどうか
      // ヘルプモード中（helpSessionIdが設定されている）の場合は、すべての応答をヘルプ応答として扱う
      const isHelpResponse = data.response && (
        isInHelpMode || // ヘルプモード中はすべてヘルプ応答として扱う
        data.response.includes('4つの便利な機能') ||
        data.response.includes('5つの便利な機能') ||
        data.response.includes('どの機能について知りたいですか') ||
        data.response.includes('1〜5の数字を入力してください') ||
        data.response.includes('食材を追加する') ||
        data.response.includes('食材を削除する') ||
        data.response.includes('主菜を選ぶ') ||
        data.response.includes('副菜を選ぶ') ||
        data.response.includes('汁物を選ぶ') ||
        data.response.includes('在庫一覧を確認する') ||
        data.response.includes('レシピ履歴を確認する') ||
        data.response.includes('AIとともに') ||
        data.response.includes('ゆるーく') ||
        data.response.includes('推し！機能')
      );
      
      // ヘルプ応答の場合は、SSEを待たずにHTTPレスポンスから直接処理
      if (isHelpResponse && data.success && data.response) {
        console.log('[DEBUG] Help response detected in HTTP response, processing directly');
        console.log('[DEBUG] shouldSkipStreaming:', shouldSkipStreaming);
        console.log('[DEBUG] isInHelpMode:', isInHelpMode);
        
        // ヘルプセッションIDを設定
        setHelpSessionId(sseSessionId);
        
        if (shouldSkipStreaming) {
          // ストリーミングメッセージを追加していない場合は、直接AIメッセージを追加
          console.log('[DEBUG] Adding AI message directly (skip streaming)');
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: data.response,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, aiMessage]);
        } else {
          // streamingメッセージをAIレスポンスに置き換え
          console.log('[DEBUG] Replacing streaming message with AI response');
          setChatMessages(prev => prev.map((msg) => 
            msg.type === 'streaming' && msg.sseSessionId === sseSessionId
              ? { 
                  id: msg.id,
                  type: 'ai', 
                  content: data.response,
                  timestamp: msg.timestamp
                }
              : msg
          ));
        }
        
        // ローディング状態を終了
        setIsTextChatLoading(false);
        return; // ヘルプ応答の場合はここで処理終了
      }
      
      // 確認応答を送信した場合のみ、状態をリセット
      if (isConfirmationRequest && data.success && !data.requires_confirmation) {
        console.log('[DEBUG] Confirmation response completed, resetting confirmation state');
        setAwaitingConfirmation(false);
        setConfirmationSessionId(null);
      }
      
      logAPI('POST', apiUrl, response.status, { action: 'テキストチャット送信成功' });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      
      // 利用回数制限のエラーメッセージの場合、追加の案内を付ける
      let errorContent = `エラー: ${errorMessage}`;
      if (errorMessage.includes('利用回数制限に達しました') || errorMessage.includes('利用回数制限')) {
        errorContent = `${errorContent}\n\nユーザープロフィール画面のサブスクリプションを確認してください。`;
      }
      
      // エラー時はストリーミング進捗表示をエラーメッセージに置き換え
      setChatMessages(prev => prev.map((msg) => 
        msg.type === 'streaming' && msg.sseSessionId === sseSessionId
          ? { 
              id: msg.id,
              type: 'ai', 
              content: errorContent,
              timestamp: msg.timestamp
            }
          : msg
      ));
      
      // エラー時は確認状態をリセット
      setAwaitingConfirmation(false);
      setConfirmationSessionId(null);
      
      logAPI('POST', `${getApiUrl()}/chat`, 500, { action: `テキストチャット送信エラー: ${errorMessage}` });
      showErrorAlert(`チャット送信に失敗しました: ${errorMessage}`);
    } finally {
      setIsTextChatLoading(false);
    }
  };

  // 直接メッセージを送信する関数（ボタンからの送信用）
  const sendTextMessageDirect = async (message: string) => {
    if (!message.trim()) return;

    // 献立一括提案または段階的提案の場合は制限チェック
    const proposalType = detectProposalType(message);
    if (proposalType) {
      if (!checkSubscriptionLimit(proposalType)) {
        setIsTextChatLoading(false);
        return;
      }
    }

    setIsTextChatLoading(true);
    
    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // SSEセッションIDの決定
    let sseSessionId: string;
    const isConfirmationRequest = awaitingConfirmation && !!confirmationSessionId;
    
    if (isConfirmationRequest) {
      sseSessionId = confirmationSessionId;
    } else {
      sseSessionId = generateSSESessionId();
    }
    
    // ストリーミング進捗表示を追加
    const streamingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'streaming',
      content: '',
      timestamp: new Date(),
      sseSessionId: sseSessionId,
    };
    setChatMessages(prev => [...prev, streamingMessage]);
    
    // スクロールを最下部に移動
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      const apiUrl = `${getApiUrl()}/chat`;
      
      // 認証トークンを取得
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        throw new Error('認証トークンが取得できません');
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({ 
          message: message,
          sse_session_id: sseSessionId,
          confirm: isConfirmationRequest
        }),
      });

      if (!response.ok) {
        throw new Error(`チャットAPI エラー: ${response.status}`);
      }

      const data = await response.json();
      
      // ヘルプ応答の検出
      const isHelpResponse = data.response && (
        data.response.includes('4つの便利な機能') ||
        data.response.includes('どの機能について知りたいですか') ||
        data.response.includes('食材を追加する') ||
        data.response.includes('食材を削除する') ||
        data.response.includes('主菜を選ぶ') ||
        data.response.includes('副菜を選ぶ') ||
        data.response.includes('汁物を選ぶ') ||
        data.response.includes('在庫一覧を確認する') ||
        data.response.includes('レシピ履歴を確認する')
      );
      
      // ヘルプ応答の場合は直接処理
      if (isHelpResponse && data.success && data.response) {
        setChatMessages(prev => prev.map((msg): ChatMessage => 
          msg.type === 'streaming' && msg.sseSessionId === sseSessionId
            ? { type: 'ai' as const, content: data.response, id: msg.id, timestamp: msg.timestamp }
            : msg
        ));
        setIsTextChatLoading(false);
        return;
      }
      
      // 通常の応答の場合はSSEで処理されるため、ここでは何もしない
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      
      // 利用回数制限のエラーメッセージの場合、追加の案内を付ける
      let errorContent = `エラー: ${errorMessage}`;
      if (errorMessage.includes('利用回数制限に達しました') || errorMessage.includes('利用回数制限')) {
        errorContent = `${errorContent}\n\nユーザープロフィール画面のサブスクリプションを確認してください。`;
      }
      
      // エラー時はストリーミング進捗表示をエラーメッセージに置き換え
      setChatMessages(prev => prev.map((msg) => 
        msg.type === 'streaming' && msg.sseSessionId === sseSessionId
          ? { 
              id: msg.id,
              type: 'ai', 
              content: errorContent,
              timestamp: msg.timestamp
            }
          : msg
      ));
      
      showErrorAlert(`チャット送信に失敗しました: ${errorMessage}`);
    } finally {
      setIsTextChatLoading(false);
    }
  };

  const clearChatHistory = (
    setAwaitingSelection: React.Dispatch<React.SetStateAction<boolean>>,
    clearSelectedRecipes: () => void
  ) => {
    setChatMessages([]);
    setAwaitingConfirmation(false);
    setConfirmationSessionId(null);
    setHelpSessionId(null);
    setAwaitingSelection(false);
    // 選択済みレシピもクリア
    clearSelectedRecipes();
  };

  return {
    textMessage,
    setTextMessage,
    awaitingConfirmation,
    setAwaitingConfirmation,
    confirmationSessionId,
    setConfirmationSessionId,
    helpSessionId,
    setHelpSessionId,
    sendTextMessage,
    sendTextMessageDirect,
    clearChatHistory,
    getApiUrl: () => getApiUrl(), // 共通関数をラップして返す
  };
}

