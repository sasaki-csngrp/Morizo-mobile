/**
 * サブスクリプション関連のユーティリティ関数
 */

/**
 * 次のリセット時刻（明朝0:00 JST）を取得
 * @returns ISO 8601形式の文字列
 */
export function getNextResetTime(): string {
  // 日本時間（JST）のタイムゾーンを設定
  const jstOffset = 9 * 60; // JSTはUTC+9
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const jst = new Date(utc + (jstOffset * 60000));
  
  // 今日の0:00を取得
  const today = new Date(jst);
  today.setHours(0, 0, 0, 0);
  
  // 現在時刻が今日の0:00より後なら、明日の0:00を返す
  if (jst >= today) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
  }
  
  // 現在時刻が今日の0:00より前なら、今日の0:00を返す
  return today.toISOString();
}

/**
 * リセット時刻をフォーマット（明朝0:00 JST形式で表示）
 * @param resetAt ISO 8601形式の文字列
 * @returns フォーマットされた文字列
 */
export function formatResetTime(resetAt: string): string {
  try {
    const date = new Date(resetAt);
    // 日本時間（JST）に変換
    const jstOffset = 9 * 60; // JSTはUTC+9
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const jst = new Date(utc + (jstOffset * 60000));
    
    // 明朝0:00の形式で表示
    const year = jst.getFullYear();
    const month = String(jst.getMonth() + 1).padStart(2, '0');
    const day = String(jst.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day} 0:00:00`;
  } catch (error) {
    // パースエラーの場合は元の文字列を返す
    return resetAt;
  }
}

