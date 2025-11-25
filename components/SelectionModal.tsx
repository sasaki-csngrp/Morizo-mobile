import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export interface SelectionOption {
  label: string;
  value: string;
}

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: SelectionOption[];
  selectedValue: string | null;
  title: string;
}

/**
 * 再利用可能な選択モーダルコンポーネント
 * iOSのホイールピッカーを避けるため、カスタムモーダルで選択リストを表示
 */
const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  options,
  selectedValue,
  title,
}) => {
  const [tempSelectedValue, setTempSelectedValue] = useState<string | null>(selectedValue);

  useEffect(() => {
    if (isOpen) {
      setTempSelectedValue(selectedValue);
    }
  }, [isOpen, selectedValue]);

  const handleSelect = (value: string) => {
    setTempSelectedValue(value);
  };

  const handleConfirm = () => {
    if (tempSelectedValue !== null) {
      onSelect(tempSelectedValue);
      onClose();
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonTouchable}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 選択肢リスト */}
          <ScrollView 
            style={styles.listContainer}
            contentContainerStyle={styles.listContainerContent}
          >
            <View style={styles.list}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.itemContainer,
                    tempSelectedValue === option.value && styles.itemContainerSelected,
                  ]}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radio,
                        tempSelectedValue === option.value && styles.radioSelected,
                      ]}
                    >
                      {tempSelectedValue === option.value && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemLabel}>{option.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* フッター */}
          <View style={styles.footer}>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  tempSelectedValue === null && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={tempSelectedValue === null}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>選択</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    height: SCREEN_HEIGHT * 0.6,
    maxHeight: SCREEN_HEIGHT * 0.9,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  closeButtonTouchable: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    minHeight: 150,
  },
  listContainerContent: {
    flexGrow: 1,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  itemContainerSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  radioContainer: {
    marginRight: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2563eb',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  confirmButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default SelectionModal;

