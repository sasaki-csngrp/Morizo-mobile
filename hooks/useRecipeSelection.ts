import { useState } from 'react';
import { RecipeCandidate } from '../types/menu';
import { ChatMessage } from '../types/chat';
import { saveMenu } from '../api/menu-api';
import { Alert } from 'react-native';

/**
 * レシピ選択管理フック
 * レシピの選択状態と献立保存機能を管理
 */
export function useRecipeSelection(
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setAwaitingSelection: React.Dispatch<React.SetStateAction<boolean>>
) {
  // Phase 3.1: 選択済みレシピの状態管理
  const [selectedRecipes, setSelectedRecipes] = useState<{
    main?: RecipeCandidate;
    sub?: RecipeCandidate;
    soup?: RecipeCandidate;
    other?: RecipeCandidate;
  }>({});

  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string>('');

  const handleSelection = (selection: number, selectionResult?: any) => {
    // Phase 3.1: 選択したレシピ情報を取得して状態に保存
    setAwaitingSelection(false);
    
    if (selectionResult) {
      // menuオブジェクトからレシピを取得（献立完成時やotherカテゴリの場合）
      if (selectionResult.menu) {
        const menu = selectionResult.menu;
        const updatedRecipes: { main?: RecipeCandidate; sub?: RecipeCandidate; soup?: RecipeCandidate; other?: RecipeCandidate } = {};
        
        // main, sub, soup, otherの各カテゴリを処理
        for (const category of ['main', 'sub', 'soup', 'other'] as const) {
          const recipe = menu[category];
          if (recipe) {
            updatedRecipes[category] = {
              title: recipe.title || '',
              ingredients: recipe.ingredients || [],
              cooking_time: recipe.cooking_time,
              description: recipe.description,
              category: category,
              source: recipe.source,
              urls: recipe.urls || (recipe.url ? [{ title: recipe.title || '', url: recipe.url, domain: '' }] : undefined)
            };
          }
        }
        
        // selectedRecipes状態を更新
        if (Object.keys(updatedRecipes).length > 0) {
          setSelectedRecipes(prev => ({
            ...prev,
            ...updatedRecipes
          }));
          
          console.log('[DEBUG] Updated selectedRecipes from menu:', updatedRecipes);
        }
      }
      
      // selected_recipeからも取得（個別選択時）
      if (selectionResult.selected_recipe) {
        const { category, recipe } = selectionResult.selected_recipe;
        const categoryKey = category as 'main' | 'sub' | 'soup' | 'other';
        
        // RecipeCandidate型に変換（必要に応じて）
        const recipeCandidate: RecipeCandidate = {
          title: recipe.title || '',
          ingredients: recipe.ingredients || [],
          cooking_time: recipe.cooking_time,
          description: recipe.description,
          category: categoryKey,
          source: recipe.source,
          urls: recipe.urls || (recipe.url ? [{ title: recipe.title || '', url: recipe.url, domain: '' }] : undefined)
        };
        
        // selectedRecipes状態を更新
        setSelectedRecipes(prev => ({
          ...prev,
          [categoryKey]: recipeCandidate
        }));
        
        console.log('[DEBUG] Updated selectedRecipes from selected_recipe:', {
          category: categoryKey,
          recipe: recipeCandidate
        });
      }
    }
    
    setAwaitingSelection(false);
    
    // 選択結果メッセージを追加（ユニークID生成）
    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setChatMessages(prev => [...prev, {
      id: userMessageId,
      type: 'user',
      content: `${selection}番を選択しました`,
      timestamp: new Date(),
    }]);
  };

  // Phase 3.1: 献立保存機能の実装
  const handleSaveMenu = async () => {
    if (!selectedRecipes.main && !selectedRecipes.sub && !selectedRecipes.soup && !selectedRecipes.other) {
      Alert.alert('エラー', '保存するレシピがありません');
      return;
    }
    
    setIsSavingMenu(true);
    setSavedMessage('');
    
    try {
      console.log('[DEBUG] Saving menu with selectedRecipes:', selectedRecipes);
      
      // Web版と同じ方式: selectedRecipesを直接送信
      const recipesToSave: { main?: any; sub?: any; soup?: any; other?: any } = {};
      
      if (selectedRecipes.main) {
        recipesToSave.main = {
          title: selectedRecipes.main.title,
          source: selectedRecipes.main.source || 'web',
          url: selectedRecipes.main.urls && selectedRecipes.main.urls.length > 0 
            ? selectedRecipes.main.urls[0].url 
            : undefined,
          ingredients: selectedRecipes.main.ingredients || []
        };
      }
      
      if (selectedRecipes.sub) {
        recipesToSave.sub = {
          title: selectedRecipes.sub.title,
          source: selectedRecipes.sub.source || 'web',
          url: selectedRecipes.sub.urls && selectedRecipes.sub.urls.length > 0 
            ? selectedRecipes.sub.urls[0].url 
            : undefined,
          ingredients: selectedRecipes.sub.ingredients || []
        };
      }
      
      if (selectedRecipes.soup) {
        recipesToSave.soup = {
          title: selectedRecipes.soup.title,
          source: selectedRecipes.soup.source || 'web',
          url: selectedRecipes.soup.urls && selectedRecipes.soup.urls.length > 0 
            ? selectedRecipes.soup.urls[0].url 
            : undefined,
          ingredients: selectedRecipes.soup.ingredients || []
        };
      }
      
      if (selectedRecipes.other) {
        recipesToSave.other = {
          title: selectedRecipes.other.title,
          source: selectedRecipes.other.source || 'web',
          url: selectedRecipes.other.urls && selectedRecipes.other.urls.length > 0 
            ? selectedRecipes.other.urls[0].url 
            : undefined,
          ingredients: selectedRecipes.other.ingredients || []
        };
      }
      
      console.log('[DEBUG] Prepared recipes to save:', recipesToSave);
      
      const result = await saveMenu(recipesToSave);
      
      if (result.success) {
        setSavedMessage(result.message || `${result.total_saved}つのレシピが保存されました`);
        
        setTimeout(() => {
          setSavedMessage('');
        }, 5000);
      } else {
        throw new Error(result.message || '保存に失敗しました');
      }
    } catch (error) {
      console.error('Menu save failed:', error);
      Alert.alert('エラー', '献立の保存に失敗しました。もう一度お試しください。');
      setSavedMessage('');
    } finally {
      setIsSavingMenu(false);
    }
  };

  const clearSelectedRecipes = () => {
    setSelectedRecipes({});
    setSavedMessage('');
  };

  return {
    selectedRecipes,
    isSavingMenu,
    savedMessage,
    handleSelection,
    handleSaveMenu,
    clearSelectedRecipes,
  };
}

