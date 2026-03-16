export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDateLabel(date: Date, showToday = false): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = DAY_NAMES[date.getDay()];
  const isToday = showToday && formatDateKey(date) === formatDateKey(new Date());
  return `${m}월 ${d}일(${day})${isToday ? ', 오늘' : ''}`;
}

export function getWeekDays(center: Date): Date[] {
  const days: Date[] = [];
  const startOffset = center.getDay();
  for (let i = 0; i < 7; i++) {
    const d = new Date(center);
    d.setDate(center.getDate() - startOffset + i);
    days.push(d);
  }
  return days;
}
