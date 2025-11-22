import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface MarkdownTextProps {
  content: string;
  style?: any;
}

/**
 * 最低限のマークダウン対応コンポーネント
 * - 見出し（### 見出し）
 * - 強調（**強調**）
 */
const MarkdownText: React.FC<MarkdownTextProps> = ({ content, style }) => {
  // マークダウンをパースしてReact Nativeコンポーネントに変換
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    
    // 行ごとに処理
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      // 見出しチェック（### 見出し）
      const headingMatch = line.match(/^###\s+(.+)$/);
      if (headingMatch) {
        parts.push(
          <Text key={`heading-${lineIndex}`} style={[styles.heading, style]}>
            {headingMatch[1]}
          </Text>
        );
        if (lineIndex < lines.length - 1) {
          parts.push(<Text key={`newline-${lineIndex}`}>{'\n'}</Text>);
        }
        return;
      }
      
      // 通常のテキスト行を処理（強調を含む可能性がある）
      if (line.trim()) {
        const textParts: React.ReactNode[] = [];
        let lastIndex = 0;
        
        // 強調パターン（**強調**）を検索
        const boldRegex = /\*\*(.+?)\*\*/g;
        let match;
        
        // グローバルフラグ付き正規表現のlastIndexをリセット
        boldRegex.lastIndex = 0;
        
        while ((match = boldRegex.exec(line)) !== null) {
          // 強調の前のテキスト
          if (match.index > lastIndex) {
            textParts.push(
              <Text key={`text-${lineIndex}-${lastIndex}`} style={style}>
                {line.substring(lastIndex, match.index)}
              </Text>
            );
          }
          
          // 強調テキスト
          textParts.push(
            <Text key={`bold-${lineIndex}-${match.index}`} style={[styles.boldText, style]}>
              {match[1]}
            </Text>
          );
          
          lastIndex = match.index + match[0].length;
        }
        
        // 残りのテキスト
        if (lastIndex < line.length) {
          textParts.push(
            <Text key={`text-${lineIndex}-${lastIndex}`} style={style}>
              {line.substring(lastIndex)}
            </Text>
          );
        }
        
        // テキストパーツが空の場合は通常テキストとして追加
        if (textParts.length === 0) {
          textParts.push(
            <Text key={`text-${lineIndex}`} style={style}>
              {line}
            </Text>
          );
        }
        
        parts.push(
          <Text key={`line-${lineIndex}`}>
            {textParts}
          </Text>
        );
        
        if (lineIndex < lines.length - 1) {
          parts.push(<Text key={`newline-${lineIndex}`}>{'\n'}</Text>);
        }
      } else {
        // 空行
        if (lineIndex < lines.length - 1) {
          parts.push(<Text key={`newline-${lineIndex}`}>{'\n'}</Text>);
        }
      }
    });
    
    return parts.length > 0 ? parts : [<Text key="default" style={style}>{text}</Text>];
  };
  
  return (
    <Text style={style}>
      {parseMarkdown(content)}
    </Text>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default MarkdownText;

