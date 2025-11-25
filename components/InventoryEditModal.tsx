import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { addInventoryItem, updateInventoryItem, InventoryItem, InventoryItemData } from '../api/inventory-api';
import SelectionModal, { SelectionOption } from './SelectionModal';

interface InventoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null; // nullの場合は新規作成
  onSave: () => void;
}

const InventoryEditModal: React.FC<InventoryEditModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<string>('0');
  const [unit, setUnit] = useState('個');
  const [storageLocation, setStorageLocation] = useState('冷蔵庫');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    if (item) {
      // 編集モード
      setItemName(item.item_name);
      setQuantity(item.quantity.toString());
      setUnit(item.unit);
      setStorageLocation(item.storage_location || '冷蔵庫');
      setExpiryDate(item.expiry_date ? item.expiry_date.split('T')[0] : '');
    } else {
      // 新規作成モード
      setItemName('');
      setQuantity('0');
      setUnit('個');
      setStorageLocation('冷蔵庫');
      setExpiryDate('');
    }
  }, [item, isOpen]);

  const handleSave = async () => {
    if (!itemName.trim()) {
      Alert.alert('エラー', 'アイテム名を入力してください');
      return;
    }
    
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('エラー', '数量は0より大きい値が必要です');
      return;
    }

    setIsSaving(true);
    try {
      const payload: InventoryItemData = {
        item_name: itemName.trim(),
        quantity: quantityNum,
        unit: unit,
        storage_location: storageLocation || null,
        expiry_date: expiryDate || null,
      };

      if (item) {
        // 更新
        await updateInventoryItem(item.id, payload);
      } else {
        // 新規作成
        await addInventoryItem(payload);
      }

      onSave();
    } catch (error) {
      console.error('Inventory save failed:', error);
      const errorMessage = error instanceof Error ? error.message : '保存に失敗しました';
      Alert.alert('エラー', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const units = ['個', 'kg', 'g', 'L', 'ml', '本', 'パック', '袋'];
  const storageLocations = ['冷蔵庫', '冷凍庫', '常温倉庫', '野菜室', 'その他'];
  
  const unitOptions: SelectionOption[] = units.map(u => ({ label: u, value: u }));
  const locationOptions: SelectionOption[] = storageLocations.map(loc => ({ label: loc, value: loc }));

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {item ? '在庫編集' : '新規追加'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* フォーム */}
          <View style={styles.form}>
            {/* アイテム名 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                アイテム名 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={itemName}
                onChangeText={setItemName}
                placeholder="例: りんご"
                placeholderTextColor="#999"
              />
            </View>

            {/* 数量 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                数量 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>

            {/* 単位 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                単位 <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setIsUnitModalOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectButtonText}>{unit}</Text>
                <Text style={styles.selectButtonArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* 保管場所 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>保管場所</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setIsLocationModalOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectButtonText}>{storageLocation}</Text>
                <Text style={styles.selectButtonArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* 賞味期限 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>賞味期限</Text>
              <TextInput
                style={styles.textInput}
                value={expiryDate}
                onChangeText={setExpiryDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* ボタン */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.button, styles.saveButton, isSaving && styles.saveButtonDisabled]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>保存</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* 単位選択モーダル */}
      <SelectionModal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onSelect={(value) => setUnit(value)}
        options={unitOptions}
        selectedValue={unit}
        title="単位を選択"
      />
      
      {/* 保管場所選択モーダル */}
      <SelectionModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={(value) => setStorageLocation(value)}
        options={locationOptions}
        selectedValue={storageLocation}
        title="保管場所を選択"
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  form: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    fontSize: 14,
    color: '#1f2937',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#1f2937',
  },
  selectButtonArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InventoryEditModal;

