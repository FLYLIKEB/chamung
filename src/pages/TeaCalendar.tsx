import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Calendar } from '../components/ui/calendar';
import { StreakCards } from '../components/calendar/StreakCards';
import { DateNotesDrawer } from '../components/calendar/DateNotesDrawer';
import { notesApi } from '../lib/api';
import type { CalendarData } from '../lib/api/notes.api';
import type { Note } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { formatDateKey } from '../utils/dateUtils';

export function TeaCalendar() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dateNotes, setDateNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchCalendar = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await notesApi.getCalendar(user.id, year, month);
      setCalendarData(data);
    } catch {
      toast.error('캘린더 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user, year, month]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const handleDayClick = useCallback(async (date: Date) => {
    if (!user) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setSelectedDate(date);
    setDrawerOpen(true);
    setIsLoadingNotes(true);
    setDateNotes([]);
    try {
      const notes = await notesApi.getByDate(user.id, formatDateKey(date));
      setDateNotes(notes);
    } catch {
      toast.error('차록을 불러오지 못했습니다.');
    } finally {
      setIsLoadingNotes(false);
    }
  }, [user]);

  const goToPrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const noteDates = new Set(calendarData?.dates ?? []);

  const modifiers = {
    hasNote: (date: Date) => noteDates.has(formatDateKey(date)),
  };

  const modifiersClassNames = {
    hasNote: 'relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary',
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 flex flex-col">
      <Header title="차록 캘린더" showBack />

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Streak cards */}
        <StreakCards
          current={calendarData?.streak.current ?? 0}
          longest={calendarData?.streak.longest ?? 0}
        />

        {/* Month calendar card */}
        <div className="rounded-2xl border border-border/30 bg-card p-4 md:p-5 space-y-4">
          {/* Month navigation header */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="이전 달"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">
                {year}년 {month}월
              </span>
            </div>
            <button
              onClick={goToNextMonth}
              className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="다음 달"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Calendar grid */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <div className="flex justify-center">
              <Calendar
                month={new Date(year, month - 1, 1)}
                onMonthChange={(d) => {
                  setYear(d.getFullYear());
                  setMonth(d.getMonth() + 1);
                }}
                onDayClick={handleDayClick}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                showOutsideDays={false}
              />
            </div>
          )}

          {/* Note count for month */}
          {!isLoading && calendarData && (
            <p className="text-center text-xs text-muted-foreground pt-1">
              이번 달 차록 <span className="font-semibold text-foreground">{calendarData.dates.length}개</span>
            </p>
          )}
        </div>
      </div>

      {/* Date Notes Drawer */}
      <DateNotesDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedDate={selectedDate}
        notes={dateNotes}
        isLoading={isLoadingNotes}
      />

      <BottomNav />
    </div>
  );
}
