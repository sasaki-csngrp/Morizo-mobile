import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, Switch, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { OCRItem } from '../../api/inventory-api';
import { UNITS } from '../../lib/utils/ocr-constants';
import SelectionModal, { SelectionOption } from '../SelectionModal';

interface EditableItemListProps {
  items: OCRItem[];
  onItemEdit: (index: number, field: keyof OCRItem, value: string | number | null) => void;
  selectedItems: Set<number>;
  onToggleItem: (index: number) => void;
  onSelectAll: (value: boolean) => void;
  units?: readonly string[];
}

/**
 * 編集可能なアイテムリストコンポーネント
 * 
 * 責任: OCR解析結果のアイテム一覧を編集可能なテーブル形式で表示し、選択機能を提供
 * 登録用の確認画面として、アイテム名、数量、単位のみを表示
 * 
 * @param items - 編集可能なアイテムリスト
 * @param onItemEdit - アイテム編集時のコールバック
 * @param selectedItems - 選択されたアイテムのインデックスセット
 * @param onToggleItem - アイテム選択/解除時のコールバック
 * @param onSelectAll - 全選択/全解除時のコールバック
 * @param units - 単位の配列（デフォルト: UNITS）
 */
const EditableItemList: React.FC<EditableItemListProps> = ({
  items,
  onItemEdit,
  selectedItems,
  onToggleItem,
  onSelectAll,
  units = UNITS,
}) => {
  const allSelected = selectedItems.size === items.length && items.length > 0;
  const [openModal, setOpenModal] = useState<{ type: 'unit'; index: number } | null>(null);
  
  const unitOptions: SelectionOption[] = units.map(u => ({ label: u, value: u }));

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.section}>
        <Text style={styles.label}>抽出されたアイテム（編集・選択可能）</Text>
        
        {/* 全選択/全解除 */}
        <View style={styles.selectAllRow}>
          <Text style={styles.selectAllLabel}>全選択</Text>
          <Switch
            value={allSelected}
            onValueChange={onSelectAll}
          />
        </View>

        {/* アイテムリスト */}
        <FlatList
        data={items}
        keyExtractor={(_, index) => `item-${index}`}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <View style={styles.itemRow}>
            {/* 選択チェックボックス */}
            <View style={styles.checkboxCell}>
              <Switch
                value={selectedItems.has(index)}
                onValueChange={() => onToggleItem(index)}
              />
            </View>

            {/* アイテム名 */}
            <View style={styles.itemNameCell}>
              <TextInput
                style={styles.itemInput}
                value={item.item_name}
                onChangeText={(value) => onItemEdit(index, 'item_name', value)}
                placeholder="アイテム名"
                placeholderTextColor="#999"
              />
            </View>

            {/* 数量 */}
            <View style={styles.quantityCell}>
              <TextInput
                style={styles.quantityInput}
                value={item.quantity.toString()}
                onChangeText={(value) => {
                  const num = parseFloat(value);
                  onItemEdit(index, 'quantity', isNaN(num) ? 0 : num);
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>

            {/* 単位 */}
            <View style={styles.unitCell}>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setOpenModal({ type: 'unit', index })}
                activeOpacity={0.7}
              >
                <Text style={styles.selectButtonText} numberOfLines={1}>
                  {item.unit}
                </Text>
                <Text style={styles.selectButtonArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.tableHeader}>
            <View style={styles.checkboxCell} />
            <View style={styles.itemNameCell}><Text style={styles.headerText}>アイテム名</Text></View>
            <View style={styles.quantityCell}><Text style={styles.headerText}>数量</Text></View>
            <View style={styles.unitCell}><Text style={styles.headerText}>単位</Text></View>
          </View>
        )}
      />
      
      {/* 選択モーダル */}
      {openModal && (
        <SelectionModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
          onSelect={(value) => {
            onItemEdit(openModal.index, 'unit', value);
            setOpenModal(null);
          }}
          options={unitOptions}
          selectedValue={items[openModal.index]?.unit}
          title="単位を選択"
        />
      )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectAllLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  checkboxCell: {
    width: 50,
    alignItems: 'center',
  },
  itemNameCell: {
    flex: 2,
    marginRight: 4,
  },
  quantityCell: {
    flex: 1,
    marginRight: 4,
  },
  unitCell: {
    flex: 1,
  },
  itemInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    fontSize: 12,
    color: '#1f2937',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    fontSize: 12,
    color: '#1f2937',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    minHeight: 40,
  },
  selectButtonText: {
    fontSize: 12,
    color: '#1f2937',
    flex: 1,
  },
  selectButtonArrow: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 4,
  },
});

export default EditableItemList;

