import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeeklyStreak } from '../WeeklyStreak';
import { MemoryRouter } from 'react-router-dom';
import type { Note } from '../../../types';
import { notesApi } from '../../../lib/api';

function renderWithRouter(ui: React.ReactElement) {
  return render(ui, { wrapper: MemoryRouter });
}

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const TODAY = '2026-03-17';
const authState = vi.hoisted(() => ({ user: { id: 1, name: '테스트' } }));

vi.mock('../../../lib/api', () => ({
  authApi: { getMe: vi.fn(() => Promise.resolve({ user: { id: 1, name: '테스트' } })) },
  usersApi: { getOnboardingPreference: vi.fn(() => Promise.resolve({ hasCompletedOnboarding: true })) },
  notesApi: {
    getCalendar: vi.fn(() =>
      Promise.resolve({ dates: [TODAY], streak: { current: 5, longest: 10 } }),
    ),
    getByDate: vi.fn(() => Promise.resolve([])),
    toggleBookmark: vi.fn(() => Promise.resolve({ bookmarked: false })),
  },
}));

vi.mock('../../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: authState.user,
      isLoading: false,
      isAuthenticated: true,
    }),
  };
});

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: 1,
  teaId: 10,
  teaName: '용정차',
  userId: 1,
  userName: '테스트',
  schemaId: 1,
  overallRating: 4,
  isRatingIncluded: true,
  memo: null,
  isPublic: true,
  createdAt: new Date(TODAY),
  ...overrides,
});

describe('WeeklyStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-17T12:00:00+09:00'));
    authState.user = { id: 1, name: '테스트' };
    vi.clearAllMocks();

    vi.mocked(notesApi.getCalendar).mockResolvedValue({
      dates: [TODAY],
      streak: { current: 5, longest: 10 },
    });
    vi.mocked(notesApi.getByDate).mockResolvedValue([]);
  });

  afterEach(() => vi.useRealTimers());

  it('동일 사용자의 프로필 객체가 갱신되어도 캘린더를 다시 조회하지 않는다', async () => {
    const view = renderWithRouter(<WeeklyStreak />);
    await screen.findByText('이 날의 차록이 없습니다.');
    expect(notesApi.getCalendar).toHaveBeenCalledTimes(1);
    authState.user = { ...authState.user };
    view.rerender(<WeeklyStreak />);
    await screen.findByText('이 날의 차록이 없습니다.');
    expect(notesApi.getCalendar).toHaveBeenCalledTimes(1);
  });

  it('이번 주 차록 제목이 표시된다', () => {
    renderWithRouter(<WeeklyStreak />);
    expect(screen.getByText('이번 주 차록')).toBeInTheDocument();
  });

  it('전체보기 버튼이 표시된다', () => {
    renderWithRouter(<WeeklyStreak />);
    expect(screen.getByText('전체보기')).toBeInTheDocument();
  });

  it('streak > 0 시 N일 연속 뱃지가 표시된다', async () => {
    renderWithRouter(<WeeklyStreak />);
    await waitFor(() => {
      expect(screen.getByText('5일 연속')).toBeInTheDocument();
    });
  });

  it('오늘 날짜가 primary 색상으로 하이라이트된다', async () => {
    renderWithRouter(<WeeklyStreak />);
    await waitFor(() => {
      const primaryCircle = screen.getByTestId(`day-btn-${TODAY}`).querySelector('span.bg-primary');
      expect(primaryCircle).toBeInTheDocument();
    });
  });

  it('noteDates에 해당하는 날짜에 dot이 표시된다', async () => {
    renderWithRouter(<WeeklyStreak />);
    await waitFor(() => {
      expect(screen.getByTestId(`day-btn-${TODAY}`).lastElementChild).toHaveClass('bg-primary');
      expect(screen.getByTestId('day-btn-2026-03-16').lastElementChild).toHaveClass('bg-transparent');
    });
  });

  it('날짜 클릭 시 notesApi.getByDate가 호출된다', async () => {
    renderWithRouter(<WeeklyStreak />);

    await screen.findByText('5일 연속');
    await screen.findByTestId(`day-btn-${TODAY}`);

    const dayButtons = document.querySelectorAll('[data-testid^="day-btn-"]');
    expect(dayButtons.length).toBeGreaterThan(0);
    fireEvent.click(dayButtons[0]);

    await waitFor(() => {
      expect(vi.mocked(notesApi.getByDate)).toHaveBeenCalled();
    });
  });

  it('노트 없는 날 클릭 시 빈 상태 메시지가 표시된다', async () => {
    renderWithRouter(<WeeklyStreak />);

    await waitFor(() => {
      expect(screen.getByText('이 날의 차록이 없습니다.')).toBeInTheDocument();
    });
  });

  it('onTodayNoteStatus 콜백이 오늘 노트 여부로 호출된다', async () => {
    const onTodayNoteStatus = vi.fn();
    renderWithRouter(<WeeklyStreak onTodayNoteStatus={onTodayNoteStatus} />);

    await waitFor(() => {
      expect(onTodayNoteStatus).toHaveBeenCalledWith(true);
    });
  });

  it('onStreakLoaded 콜백이 streak 값으로 호출된다', async () => {
    const onStreakLoaded = vi.fn();
    renderWithRouter(<WeeklyStreak onStreakLoaded={onStreakLoaded} />);

    await waitFor(() => {
      expect(onStreakLoaded).toHaveBeenCalledWith(5);
    });
  });

  it('오늘 차록 쓰기 CTA 버튼이 표시된다', () => {
    renderWithRouter(<WeeklyStreak />);
    expect(screen.getByText('오늘 차록 쓰기')).toBeInTheDocument();
  });

  it('날짜 클릭 시 해당 날의 노트 카드가 표시된다', async () => {
    vi.mocked(notesApi.getByDate).mockResolvedValue([makeNote()]);

    renderWithRouter(<WeeklyStreak />);

    await screen.findByText('5일 연속');
    await screen.findByTestId(`day-btn-${TODAY}`);

    const dayButtons = document.querySelectorAll('[data-testid^="day-btn-"]');
    expect(dayButtons.length).toBeGreaterThan(0);
    fireEvent.click(dayButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('용정차')).toBeInTheDocument();
    });
  });
});
