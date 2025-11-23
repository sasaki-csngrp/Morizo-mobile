import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { getInventoryList, InventoryItem } from '../api/inventory-api';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface InventorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedItem: InventoryItem | null) => void;
}

const InventorySelectionModal: React.FC<InventorySelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadInventory();
      setSelectedItemId(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await getInventoryList('created_at', 'desc');
      setInventory(data);
    } catch (error) {
      console.error('Inventory load failed:', error);
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  const handleConfirm = () => {
    const selected = selectedItemId
      ? inventory.find(item => item.id === selectedItemId) || null
      : null;
    onSelect(selected);
    onClose();
  };

  const filteredInventory = inventory.filter(item =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Text style={styles.title}>🍖 主菜提案 - 在庫を選択</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonTouchable}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 検索バー */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="在庫を検索..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* 在庫リスト */}
          <ScrollView 
            style={styles.listContainer}
            contentContainerStyle={styles.listContainerContent}
          >
            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>読み込み中...</Text>
              </View>
            ) : filteredInventory.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? '検索結果がありません' : '在庫がありません'}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filteredInventory.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.itemContainer,
                      selectedItemId === item.id && styles.itemContainerSelected,
                    ]}
                    onPress={() => handleSelectItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radio,
                          selectedItemId === item.id && styles.radioSelected,
                        ]}
                      >
                        {selectedItemId === item.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemName}>{item.item_name}</Text>
                      <Text style={styles.itemDetails}>
                        {item.quantity} {item.unit}
                        {item.storage_location && ` · ${item.storage_location}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* フッター */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {selectedItemId
                ? '1個の在庫を選択中'
                : '在庫を選択してください（任意）'}
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
                style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>選択して主菜提案</Text>
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
    maxWidth: 600,
    height: SCREEN_HEIGHT * 0.8,
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
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#1f2937',
  },
  listContainer: {
    flex: 1,
    minHeight: 200,
  },
  listContainerContent: {
    flexGrow: 1,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  list: {
    padding: 16,
    gap: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6b7280',
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

export default InventorySelectionModal;

