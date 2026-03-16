import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, PenLine, Loader2 } from 'lucide-react';
import { notesApi } from '@/lib/api';
import type { CalendarData } from '@/lib/api/notes.api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/components/ui/utils';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekDays(center: Date): Date[] {
  const days: Date[] = [];
  const startOffset = center.getDay();
  for (let i = 0; i < 7; i++) {
    const d = new Date(center);
    d.setDate(center.getDate() - startOffset + i);
    days.push(d);
  }
  return days;
}

export function WeeklyCalendar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getWeekDays(today), [today]);

  const fetchCalendar = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await notesApi.getCalendar(user.id, today.getFullYear(), today.getMonth() + 1);
      setCalendarData(data);
    } catch {
      toast.error('캘린더 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  if (!user) return null;

  const noteDates = new Set(calendarData?.dates ?? []);
  const streak = calendarData?.streak.current ?? 0;

  return (
    <div className="rounded-2xl bg-card border border-border/30 p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">이번 주 차록</span>
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-[11px] font-semibold text-orange-500">{streak}일 연속</span>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate('/calendar')}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          전체보기
        </button>
      </div>

      {/* Weekly days */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex justify-between">
          {weekDays.map((day) => {
            const dateKey = formatDateKey(day);
            const isToday = dateKey === formatDateKey(today);
            const hasNote = noteDates.has(dateKey);
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => navigate('/calendar')}
                className="flex flex-col items-center gap-1 w-10 py-1.5"
              >
                <span className={cn(
                  'text-[10px] font-medium',
                  isToday ? 'text-primary' : 'text-muted-foreground',
                )}>
                  {DAY_NAMES[day.getDay()]}
                </span>
                <span className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  isToday
                    ? 'bg-primary text-primary-foreground'
                    : hasNote
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground',
                )}>
                  {day.getDate()}
                </span>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  hasNote ? 'bg-primary' : 'bg-transparent',
                )} />
              </button>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => navigate('/note/new')}
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground text-sm font-medium transition-colors active:scale-[0.98]"
      >
        <PenLine className="w-3.5 h-3.5" />
        오늘 차록 쓰기
      </button>
    </div>
  );
}
