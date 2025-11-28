import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../contexts/AuthContext';
import { showErrorAlert, showSuccessAlert } from '../utils/alert';
import { logAuth, logComponent, safeLog, LogCategory } from '../lib/logging';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();

  // コンポーネント初期化ログ
  React.useEffect(() => {
    logComponent('LoginScreen', 'component_mounted');
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      showErrorAlert('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    try {
      logComponent('LoginScreen', 'auth_button_clicked', { 
        isSignUp, 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2') 
      });
      
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        await logAuth(isSignUp ? 'signup' : 'signin', email, false, { error: error.message });
        showErrorAlert(error.message);
      } else if (isSignUp) {
        await logAuth('signup', email, true);
        showSuccessAlert('アカウントを作成しました。メールを確認してください。');
      }
    } catch (error) {
      await logAuth(isSignUp ? 'signup' : 'signin', email, false, { error: error.message });
      showErrorAlert('認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      logComponent('LoginScreen', 'google_auth_button_clicked');
      
      const { error } = await signInWithGoogle();
      if (error) {
        await logAuth('google_signin', undefined, false, { error: error.message });
        showErrorAlert(error.message);
      }
    } catch (error) {
      await logAuth('google_signin', undefined, false, { error: error.message });
      showErrorAlert('Google認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    // iOSのみ表示・動作
    if (Platform.OS !== 'ios') {
      return;
    }

    // 既にローディング中の場合は処理をスキップ（重複実行防止）
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      logComponent('LoginScreen', 'apple_auth_button_clicked');
      
      const { error } = await signInWithApple();
      
      // エラーがある場合のみ表示（ユーザーがキャンセルした場合や一時的なエラーの場合はerrorがnull）
      if (error) {
        // 一時的なエラー（ERR_REQUEST_UNKNOWN）の場合は、エラーメッセージを表示しない
        // （リトライ機能で自動的に処理されるため、成功している可能性が高い）
        if (error.code === 'ERR_REQUEST_UNKNOWN') {
          // 一時的なエラーの場合は、ログに記録するだけ（UIには表示しない）
          safeLog.warn(LogCategory.AUTH, 'Sign in with Apple: 一時的なエラー（自動リトライ済み）', {
            error: error.message
          });
          // エラーダイアログを表示しない
          return;
        }
        
        // その他のエラーの場合のみ、エラーメッセージを表示
        await logAuth('apple_signin', undefined, false, { error: error.message });
        showErrorAlert(error.message);
      }
      // errorがnullの場合は、成功またはキャンセル（どちらもエラーダイアログを表示しない）
    } catch (error: any) {
      // 一時的なエラー（ERR_REQUEST_UNKNOWN）の場合は、エラーメッセージを表示しない
      if (error.code === 'ERR_REQUEST_UNKNOWN') {
        safeLog.warn(LogCategory.AUTH, 'Sign in with Apple: 一時的なエラー（自動リトライ済み）', {
          error: error.message
        });
        // エラーダイアログを表示しない
        return;
      }
      
      // その他のエラーの場合のみ、エラーメッセージを表示
      await logAuth('apple_signin', undefined, false, { error: error.message });
      showErrorAlert('Apple認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Morizo</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'アカウントを作成' : 'ログイン'}
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="パスワード"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading 
                  ? '処理中...' 
                  : isSignUp 
                    ? 'アカウント作成' 
                    : 'ログイン'
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <View style={styles.googleButtonContent}>
                <View style={styles.googleIconContainer}>
                  <View style={styles.googleIcon}>
                    <View style={styles.googleIconInner}>
                      <View style={[styles.googleIconPart, styles.googleIconBlue]} />
                      <View style={[styles.googleIconPart, styles.googleIconRed]} />
                      <View style={[styles.googleIconPart, styles.googleIconYellow]} />
                      <View style={[styles.googleIconPart, styles.googleIconGreen]} />
                    </View>
                  </View>
                </View>
                <Text style={styles.googleButtonText}>
                  Googleで{isSignUp ? 'サインアップ' : 'ログイン'}
                </Text>
              </View>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.button, styles.appleButton]}
                onPress={handleAppleSignIn}
                disabled={loading}
              >
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={8}
                  style={styles.appleButtonInner}
                  onPress={handleAppleSignIn}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.switchButtonText}>
                {isSignUp 
                  ? '既にアカウントをお持ちの方はこちら' 
                  : 'アカウントをお持ちでない方はこちら'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  form: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconContainer: {
    marginRight: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  googleIconInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  googleIconPart: {
    position: 'absolute',
    width: '50%',
    height: '50%',
  },
  googleIconBlue: {
    top: 0,
    left: 0,
    backgroundColor: '#4285F4',
  },
  googleIconRed: {
    top: 0,
    right: 0,
    backgroundColor: '#EA4335',
  },
  googleIconYellow: {
    bottom: 0,
    left: 0,
    backgroundColor: '#FBBC05',
  },
  googleIconGreen: {
    bottom: 0,
    right: 0,
    backgroundColor: '#34A853',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#3c4043',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  appleButton: {
    backgroundColor: '#000',
    borderWidth: 0,
  },
  appleButtonInner: {
    width: '100%',
    height: 50,
  },
  switchButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
});
