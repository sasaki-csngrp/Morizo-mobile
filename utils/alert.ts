import { Alert, Platform } from 'react-native';

/**
 * プラットフォーム対応のアラート表示関数
 * Web版ではwindow.alert、モバイル版ではAlert.alertを使用
 */
export const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    // Web版ではwindow.alertを使用
    window.alert(`${title}${message ? `\n${message}` : ''}`);
  } else {
    // モバイル版ではAlert.alertを使用
    Alert.alert(title, message);
  }
};

/**
 * エラーアラート表示関数
 */
export const showErrorAlert = (message: string) => {
  // 利用回数制限のエラーメッセージの場合、追加の案内を表示
  if (message.includes('利用回数制限に達しました') || message.includes('利用回数制限')) {
    const enhancedMessage = `${message}\n\nユーザープロフィール画面のサブスクリプションを確認してください。`;
    showAlert('エラー', enhancedMessage);
  } else {
    showAlert('エラー', message);
  }
};

/**
 * 成功アラート表示関数
 */
export const showSuccessAlert = (message: string) => {
  showAlert('成功', message);
};

/**
 * 確認アラート表示関数
 */
export const showConfirmAlert = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      // Web版ではconfirmを使用
      const result = window.confirm(`${title}\n${message}`);
      resolve(result);
    } else {
      // モバイル版ではAlert.alertを使用
      Alert.alert(
        title,
        message,
        [
          { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
          { text: 'OK', onPress: () => resolve(true) }
        ]
      );
    }
  });
};
