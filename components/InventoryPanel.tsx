import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getInventoryList, deleteInventoryItem, InventoryItem } from '../api/inventory-api';
import InventoryEditModal from './InventoryEditModal';
import InventoryCSVUploadModal from './InventoryCSVUploadModal';
import InventoryOCRModal from './InventoryOCRModal';
import SelectionModal, { SelectionOption } from './SelectionModal';

interface InventoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ isOpen, onClose }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [storageLocationFilter, setStorageLocationFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isCSVUploadModalOpen, setIsCSVUploadModalOpen] = useState(false);
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isLocationFilterModalOpen, setIsLocationFilterModalOpen] = useState(false);
  const [isSortByModalOpen, setIsSortByModalOpen] = useState(false);
  const [isSortOrderModalOpen, setIsSortOrderModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInventory();
      // パネルが開かれた時に検索条件を閉じる
      setIsFilterExpanded(false);
    }
  }, [isOpen]);

  // ソート条件が変更された時だけ在庫を再読み込み
  useEffect(() => {
    if (isOpen) {
      loadInventory();
    }
  }, [sortBy, sortOrder]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await getInventoryList(sortBy, sortOrder);
      setInventory(data);
    } catch (error) {
      console.error('Inventory load failed:', error);
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // フィルター適用
  const filteredInventory = inventory.filter(item => {
    const matchesStorage = !storageLocationFilter || item.storage_location === storageLocationFilter;
    const matchesSearch = !searchQuery || 
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStorage && matchesSearch;
  });

  // 保管場所の一意リストを取得
  const storageLocations = Array.from(new Set(
    inventory.map(item => item.storage_location).filter(Boolean) as string[]
  ));
  
  // 選択モーダル用のオプション
  const locationFilterOptions: SelectionOption[] = [
    { label: '全て', value: '' },
    ...storageLocations.map(loc => ({ label: loc, value: loc }))
  ];
  const sortByOptions: SelectionOption[] = [
    { label: '登録日', value: 'created_at' },
    { label: 'アイテム名', value: 'item_name' },
    { label: '数量', value: 'quantity' },
    { label: '保管場所', value: 'storage_location' },
    { label: '消費期限', value: 'expiry_date' },
  ];
  const sortOrderOptions: SelectionOption[] = [
    { label: '降順', value: 'desc' },
    { label: '昇順', value: 'asc' },
  ];

  const handleAddNew = () => {
    setEditingItem(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (itemId: string, itemName: string) => {
    Alert.alert(
      '削除確認',
      `「${itemName}」を削除しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(itemId);
            try {
              await deleteInventoryItem(itemId);
              await loadInventory(); // 一覧を再読み込み
            } catch (error) {
              console.error('Inventory delete failed:', error);
              const errorMessage = error instanceof Error ? error.message : '削除に失敗しました';
              Alert.alert('エラー', errorMessage);
            } finally {
              setIsDeleting(null);
            }
          },
        },
      ]
    );
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleEditModalSave = async () => {
    await loadInventory(); // 一覧を再読み込み
    handleEditModalClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>📦 在庫管理</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {/* フィルター */}
        <View style={styles.filtersContainer}>
          {/* 検索条件の開閉ボタン */}
          <TouchableOpacity
            style={styles.filterToggleButton}
            onPress={() => setIsFilterExpanded(!isFilterExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterToggleText}>
              {isFilterExpanded ? '検索条件を閉じる' : '検索条件を開く'}
            </Text>
            <MaterialIcons
              name={isFilterExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color="#1f2937"
            />
          </TouchableOpacity>
          
          {/* 検索条件（開閉可能） */}
          {isFilterExpanded && (
            <View style={styles.filters}>
              {/* 保管場所フィルター */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>保管場所</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setIsLocationFilterModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectButtonText}>
                    {storageLocationFilter || '全て'}
                  </Text>
                  <Text style={styles.selectButtonArrow}>▼</Text>
                </TouchableOpacity>
              </View>
              
              {/* 検索フィルター */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>検索</Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="アイテム名で検索..."
                  placeholderTextColor="#999"
                />
              </View>
              
              {/* ソート */}
              <View style={styles.sortGroup}>
                <View style={styles.sortItem}>
                  <Text style={styles.filterLabel}>並び順</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setIsSortByModalOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectButtonText}>
                      {sortByOptions.find(opt => opt.value === sortBy)?.label || sortBy}
                    </Text>
                    <Text style={styles.selectButtonArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.sortItem}>
                  <Text style={styles.filterLabel}>順序</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setIsSortOrderModalOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectButtonText}>
                      {sortOrderOptions.find(opt => opt.value === sortOrder)?.label || sortOrder}
                    </Text>
                    <Text style={styles.selectButtonArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
        
        {/* 在庫リスト */}
        <ScrollView style={styles.content}>
          {/* コマンドボタン（新規追加、CSVアップロード、レシートOCR） */}
          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              onPress={handleAddNew}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ 新規追加</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsCSVUploadModalOpen(true)}
              style={styles.csvUploadButton}
            >
              <Text style={styles.csvUploadButtonText}>📄 CSVアップロード</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsOCRModalOpen(true)}
              style={styles.ocrButton}
            >
              <Text style={styles.ocrButtonText}>📷 レシート読み込み</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>読み込み中...</Text>
            </View>
          ) : filteredInventory.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {inventory.length === 0 ? '在庫がありません' : '該当する在庫がありません'}
              </Text>
            </View>
          ) : (
            <View style={styles.inventoryList}>
              {/* テーブルヘッダー */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.headerCellName]}>アイテム名</Text>
                <Text style={[styles.headerCell, styles.headerCellQuantity]}>数量</Text>
                <Text style={[styles.headerCell, styles.headerCellUnit]}>単位</Text>
                <Text style={[styles.headerCell, styles.headerCellLocation]}>場所</Text>
                <Text style={[styles.headerCell, styles.headerCellDate]}>登録日</Text>
                <Text style={[styles.headerCell, styles.headerCellActions]}>操作</Text>
              </View>
              
              {/* 在庫アイテム */}
              {filteredInventory.map((item) => (
                <View key={item.id} style={styles.inventoryRow}>
                  <Text style={[styles.cell, styles.cellName]}>{item.item_name}</Text>
                  <Text style={[styles.cell, styles.cellQuantity]}>{item.quantity}</Text>
                  <Text style={[styles.cell, styles.cellUnit]}>{item.unit}</Text>
                  <Text style={[styles.cell, styles.cellLocation]}>
                    {item.storage_location || '-'}
                  </Text>
                  <Text style={[styles.cell, styles.cellDate]}>
                    {formatDate(item.created_at)}
                  </Text>
                  <View style={styles.cellActions}>
                    <TouchableOpacity
                      onPress={() => handleEdit(item)}
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>編集</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, item.item_name)}
                      disabled={isDeleting === item.id}
                      style={[
                        styles.deleteButton,
                        isDeleting === item.id && styles.deleteButtonDisabled
                      ]}
                    >
                      <Text style={styles.deleteButtonText}>
                        {isDeleting === item.id ? '削除中...' : '削除'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        
        {/* 画面一番下の閉じるボタン */}
        <TouchableOpacity 
          onPress={onClose}
          style={styles.bottomCloseButton}
          activeOpacity={0.7}
        >
          <Text style={styles.bottomCloseButtonText}>閉じる</Text>
        </TouchableOpacity>
        
        {/* 編集モーダル */}
        <InventoryEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          item={editingItem}
          onSave={handleEditModalSave}
        />
        
        {/* CSVアップロードモーダル */}
        <InventoryCSVUploadModal
          isOpen={isCSVUploadModalOpen}
          onClose={() => setIsCSVUploadModalOpen(false)}
          onUploadComplete={loadInventory}
        />
        
        {/* レシートOCRモーダル */}
        <InventoryOCRModal
          isOpen={isOCRModalOpen}
          onClose={() => setIsOCRModalOpen(false)}
          onUploadComplete={loadInventory}
        />
        
        {/* 保管場所フィルター選択モーダル */}
        <SelectionModal
          isOpen={isLocationFilterModalOpen}
          onClose={() => setIsLocationFilterModalOpen(false)}
          onSelect={(value) => setStorageLocationFilter(value)}
          options={locationFilterOptions}
          selectedValue={storageLocationFilter}
          title="保管場所を選択"
        />
        
        {/* 並び順選択モーダル */}
        <SelectionModal
          isOpen={isSortByModalOpen}
          onClose={() => setIsSortByModalOpen(false)}
          onSelect={(value) => setSortBy(value)}
          options={sortByOptions}
          selectedValue={sortBy}
          title="並び順を選択"
        />
        
        {/* 順序選択モーダル */}
        <SelectionModal
          isOpen={isSortOrderModalOpen}
          onClose={() => setIsSortOrderModalOpen(false)}
          onSelect={(value) => setSortOrder(value)}
          options={sortOrderOptions}
          selectedValue={sortOrder}
          title="順序を選択"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  filtersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterToggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  filters: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  addButtonContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
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
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    fontSize: 14,
  },
  sortGroup: {
    flexDirection: 'row',
  },
  sortItem: {
    flex: 1,
    marginRight: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4b5563',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  inventoryList: {
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  headerCellName: {
    flex: 2,
  },
  headerCellQuantity: {
    flex: 1,
    textAlign: 'right',
  },
  headerCellUnit: {
    flex: 1.2,
    textAlign: 'left',
  },
  headerCellLocation: {
    flex: 1.2,
    textAlign: 'left',
  },
  headerCellDate: {
    flex: 1,
    textAlign: 'left',
  },
  headerCellActions: {
    width: 100,
    textAlign: 'center',
  },
  inventoryRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  cell: {
    fontSize: 14,
    color: '#1f2937',
  },
  cellName: {
    flex: 2,
  },
  cellQuantity: {
    flex: 1,
    textAlign: 'right',
  },
  cellUnit: {
    flex: 1.2,
    textAlign: 'left',
    color: '#6b7280',
  },
  cellLocation: {
    flex: 1.2,
    color: '#6b7280',
  },
  cellDate: {
    flex: 1,
    color: '#6b7280',
  },
  cellActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    width: 100,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  csvUploadButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  csvUploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  ocrButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  ocrButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomCloseButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e40af',
  },
  bottomCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InventoryPanel;

