import React, { useState } from 'react';
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

type OtherProposalType = 'other' | 'rice' | 'noodle' | 'pasta';

interface OtherProposalOption {
  id: OtherProposalType;
  label: string;
  message: string;
}

interface OtherProposalSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (message: string) => void;
}

const OTHER_PROPOSAL_OPTIONS: OtherProposalOption[] = [
  {
    id: 'other',
    label: 'その他全体',
    message: 'その他のレシピを教えて',
  },
  {
    id: 'rice',
    label: 'ご飯もの',
    message: 'ご飯もののレシピを教えて',
  },
  {
    id: 'noodle',
    label: '麺もの',
    message: '麺もののレシピを教えて',
  },
  {
    id: 'pasta',
    label: 'パスタもの',
    message: 'パスタもののレシピを教えて',
  },
];

const OtherProposalSelectionModal: React.FC<OtherProposalSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [selectedType, setSelectedType] = useState<OtherProposalType | null>(null);

  const handleSelectType = (type: OtherProposalType) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    if (selectedType) {
      const option = OTHER_PROPOSAL_OPTIONS.find(opt => opt.id === selectedType);
      if (option) {
        onSelect(option.message);
        onClose();
      }
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
            <Text style={styles.title}>🍽️ その他提案 - カテゴリを選択</Text>
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
              {OTHER_PROPOSAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.itemContainer,
                    selectedType === option.id && styles.itemContainerSelected,
                  ]}
                  onPress={() => handleSelectType(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radio,
                        selectedType === option.id && styles.radioSelected,
                      ]}
                    >
                      {selectedType === option.id && (
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
            <Text style={styles.footerText}>
              {selectedType
                ? '1個のカテゴリを選択中'
                : 'カテゴリを選択してください'}
            </Text>
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
                  !selectedType && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!selectedType}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>選択して提案</Text>
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
    fontSize: 20,
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
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
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

export default OtherProposalSelectionModal;

