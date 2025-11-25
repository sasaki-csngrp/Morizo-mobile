import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { validateImage } from '../lib/utils/image-validation';
import { CONVERTIBLE_IMAGE_EXTENSIONS } from '../lib/utils/ocr-constants';

/**
 * 画像選択とバリデーションを管理するカスタムフック
 * 
 * @returns 画像URI、選択関数、クリア関数
 */
export function useImagePicker() {
  const [imageUri, setImageUri] = useState<string | null>(null);

  /**
   * HEIC形式の画像をJPEGに変換する
   * @param uri 画像のURI
   * @returns 変換後のURI（変換不要の場合は元のURI）
   */
  const convertHeicToJpeg = async (uri: string): Promise<string> => {
    try {
      const uriLower = uri.toLowerCase();
      const isHeicFormat = CONVERTIBLE_IMAGE_EXTENSIONS.some(ext => uriLower.endsWith(ext));
      
      if (!isHeicFormat) {
        // HEIC形式でない場合はそのまま返す
        return uri;
      }

      console.log('[useImagePicker] HEIC形式を検出、JPEGに変換します:', uri);
      
      // HEIC形式をJPEGに変換
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [], // リサイズなし
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log('[useImagePicker] 変換完了:', manipulatedImage.uri);
      return manipulatedImage.uri;
    } catch (error) {
      console.error('[useImagePicker] HEIC変換エラー:', error);
      // 変換に失敗した場合は元のURIを返す（エラーは後続の検証で検出される）
      throw new Error('HEIC形式の画像をJPEGに変換できませんでした');
    }
  };

  /**
   * 画像を選択する
   */
  const selectImage = async () => {
    try {
      // 権限をリクエスト
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('エラー', 'フォトライブラリへのアクセス権限が必要です');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        let finalUri = selectedImage.uri;
        
        // HEIC形式の場合はJPEGに変換
        try {
          finalUri = await convertHeicToJpeg(selectedImage.uri);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '画像の変換に失敗しました';
          Alert.alert('エラー', errorMessage);
          return;
        }
        
        // ファイル形式とサイズの検証（変換後のURIで検証）
        const validation = validateImage(finalUri, selectedImage.fileSize);
        if (!validation.isValid) {
          Alert.alert('エラー', validation.errors[0]);
          return;
        }

        setImageUri(finalUri);
      }
    } catch (error) {
      console.error('Image selection failed:', error);
      const errorMessage = error instanceof Error ? error.message : '画像選択に失敗しました';
      Alert.alert('エラー', errorMessage);
    }
  };

  /**
   * カメラで写真を撮影する
   */
  const takePhoto = async () => {
    try {
      // カメラ権限をリクエスト
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('エラー', 'カメラへのアクセス権限が必要です');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedImage = result.assets[0];
        let finalUri = capturedImage.uri;
        
        // HEIC形式の場合はJPEGに変換
        try {
          finalUri = await convertHeicToJpeg(capturedImage.uri);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '画像の変換に失敗しました';
          Alert.alert('エラー', errorMessage);
          return;
        }
        
        // ファイル形式とサイズの検証（変換後のURIで検証）
        const validation = validateImage(finalUri, capturedImage.fileSize);
        if (!validation.isValid) {
          Alert.alert('エラー', validation.errors[0]);
          return;
        }

        setImageUri(finalUri);
      }
    } catch (error) {
      console.error('Camera capture failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'カメラ撮影に失敗しました';
      Alert.alert('エラー', errorMessage);
    }
  };

  /**
   * 選択した画像をクリアする
   */
  const clearImage = () => {
    setImageUri(null);
  };

  return {
    imageUri,
    selectImage,
    takePhoto,
    clearImage,
  };
}

