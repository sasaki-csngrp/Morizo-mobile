# 依存関係の修正手順

## 問題の概要

`npx expo-doctor` の結果、以下の問題が検出されました：

1. **重複依存関係**:
   - `expo-web-browser` の複数バージョンが存在
   - `expo-constants` の複数バージョンが存在

2. **バージョンの不一致**:
   - `expo-web-browser`: 期待値 `~15.0.9`、実際 `14.0.2`
   - `expo-auth-session`: 期待値 `~7.0.9`、実際 `6.1.5`

これらの問題は、EASビルド時のクラッシュの原因になっている可能性が高いです。

## 修正手順

### 1. 依存関係の自動修正

```bash
# Expo SDK 54に合わせて依存関係を自動修正
npx expo install --check

# または、すべての依存関係を一度に更新
npx expo install --fix
```

### 2. 手動での修正（自動修正がうまくいかない場合）

`package.json` を以下のように修正：

```json
{
  "dependencies": {
    "expo": "~54.0.25",
    "expo-auth-session": "~7.0.9",
    "expo-web-browser": "~15.0.9",
    "expo-splash-screen": "~31.0.11",
    "react-native": "0.81.5",
    "@react-native-picker/picker": "2.11.1"
  }
}
```

その後、以下を実行：

```bash
# node_modulesを削除
rm -rf node_modules

# package-lock.jsonを削除（存在する場合）
rm -f package-lock.json

# 依存関係を再インストール
npm install

# 重複を解消
npx expo install --check
```

### 3. 重複依存関係の解消

重複依存関係を解消するには、`package.json` に `resolutions` フィールドを追加（npmの場合は `overrides`）：

```json
{
  "overrides": {
    "expo-web-browser": "~15.0.9",
    "expo-constants": "18.0.9"
  }
}
```

その後、再インストール：

```bash
rm -rf node_modules package-lock.json
npm install
```

### 4. 確認

修正後、以下を実行して確認：

```bash
# 依存関係の問題を確認
npx expo-doctor

# すべてのチェックがパスすることを確認
```

**注意**: `npx expo doctor` ではなく、`npx expo-doctor` を使用してください（ハイフン付き）。

## 注意事項

- 依存関係の更新により、コードの修正が必要な場合があります
- 特に `expo-auth-session` と `expo-web-browser` のメジャーバージョンアップは、APIの変更を含む可能性があります
- 更新後は、必ずアプリをテストしてください

## 参考リンク

- [Expo SDK 54 ドキュメント](https://docs.expo.dev/)
- [依存関係の解決方法](https://expo.fyi/resolving-dependency-issues)
- [expo-auth-session CHANGELOG](https://github.com/expo/expo/blob/sdk-54/packages/expo-auth-session/CHANGELOG.md)
- [expo-web-browser CHANGELOG](https://github.com/expo/expo/blob/sdk-54/packages/expo-web-browser/CHANGELOG.md)

---

**最終更新**: 2025年11月19日  
**作成者**: AIエージェント協働チーム

