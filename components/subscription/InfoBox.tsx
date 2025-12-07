import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function InfoBox() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        ℹ️ 購入履歴は自動的に同期されます。{'\n'}
        別のデバイスで購入したサブスクリプションや、アプリを再インストールした場合も、自動的に反映されます。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  text: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});

