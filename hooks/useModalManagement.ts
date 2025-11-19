import { useState } from 'react';
import { RecipeCandidate } from '../types/menu';

/**
 * レシピ一覧モーダルで選択に必要な情報
 */
export interface RecipeListModalSelectionInfo {
  taskId: string;
  sseSessionId: string;
  onSelect: (selection: number, selectionResult?: any) => void;
  currentStage?: 'main' | 'sub' | 'soup';
  onNextStageRequested?: (sseSessionId?: string) => void;
  isLoading?: boolean;
}

/**
 * モーダル管理フック
 * レシピ詳細モーダル、レシピ一覧モーダル、履歴パネル、レシピビューアーの状態を管理
 */
export function useModalManagement() {
  // Phase 2.3: レシピ一覧モーダルの状態管理
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listModalCandidates, setListModalCandidates] = useState<RecipeCandidate[]>([]);
  const [listModalCurrentStage, setListModalCurrentStage] = useState<'main' | 'sub' | 'soup' | undefined>(undefined);
  const [listModalSelectionInfo, setListModalSelectionInfo] = useState<RecipeListModalSelectionInfo | null>(null);
  
  // Phase 3.2: 履歴パネルの状態管理
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  
  // Phase 2: 在庫パネルの状態管理
  const [isInventoryPanelOpen, setIsInventoryPanelOpen] = useState(false);
  
  // レシピビューアー画面（モバイル版特有）
  const [showRecipeViewer, setShowRecipeViewer] = useState(false);
  const [recipeViewerData, setRecipeViewerData] = useState<{ response: string; result?: unknown } | null>(null);

  // レシピビューアーを開く
  const openRecipeViewer = (response: string, result?: unknown) => {
    setRecipeViewerData({ response, result });
    setShowRecipeViewer(true);
  };

  // レシピビューアーを閉じる
  const closeRecipeViewer = () => {
    setShowRecipeViewer(false);
    setRecipeViewerData(null);
  };

  // Phase 2.3: レシピ一覧を見るハンドラー
  const handleViewList = (
    candidates: RecipeCandidate[],
    selectionInfo?: RecipeListModalSelectionInfo | 'main' | 'sub' | 'soup'
  ) => {
    setListModalCandidates(candidates);
    
    // 後方互換性: currentStageが直接渡された場合
    if (typeof selectionInfo === 'string') {
      setListModalCurrentStage(selectionInfo);
      setListModalSelectionInfo(null);
    } else if (selectionInfo) {
      // selectionInfoが渡された場合
      setListModalCurrentStage(selectionInfo.currentStage);
      setListModalSelectionInfo(selectionInfo);
    } else {
      // どちらも渡されなかった場合
      setListModalCurrentStage(undefined);
      setListModalSelectionInfo(null);
    }
    
    setIsListModalOpen(true);
  };

  const closeListModal = () => {
    setIsListModalOpen(false);
    setListModalCandidates([]);
    setListModalCurrentStage(undefined);
    setListModalSelectionInfo(null);
  };

  const openHistoryPanel = () => {
    setIsHistoryPanelOpen(true);
  };

  const closeHistoryPanel = () => {
    setIsHistoryPanelOpen(false);
  };

  const openInventoryPanel = () => {
    setIsInventoryPanelOpen(true);
  };

  const closeInventoryPanel = () => {
    setIsInventoryPanelOpen(false);
  };

  return {
    // レシピビューアー
    showRecipeViewer,
    recipeViewerData,
    openRecipeViewer,
    closeRecipeViewer,
    // 一覧モーダル
    isListModalOpen,
    listModalCandidates,
    listModalCurrentStage,
    listModalSelectionInfo,
    handleViewList,
    closeListModal,
    // 履歴パネル
    isHistoryPanelOpen,
    openHistoryPanel,
    closeHistoryPanel,
    // 在庫パネル
    isInventoryPanelOpen,
    openInventoryPanel,
    closeInventoryPanel,
  };
}

