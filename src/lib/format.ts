const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** "YYYY-MM-DD" → UTC 0時の Date（暦の計算用） */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 例: 10月14日（火） */
export function formatDateJa(key: string): string {
  const d = parseDateKey(key);
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${WEEKDAYS[d.getUTCDay()]}）`;
}

/** UNIX秒を現地時刻の「HH:MM」に */
export function formatTime(dt: number, offset: number): string {
  const d = new Date((dt + offset) * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatTemp(t: number): string {
  return `${t.toFixed(1)}℃`;
}

export const WEEKDAY_LABELS = WEEKDAYS;
