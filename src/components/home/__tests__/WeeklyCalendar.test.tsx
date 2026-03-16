import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WeeklyCalendar } from '../WeeklyCalendar';
import { renderWithRouter } from '../../../test/renderWithRouter';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../../../lib/api', () => ({
  authApi: { getMe: vi.fn(() => Promise.resolve({ user: { id: 1, name: '테스트' } })) },
  notesApi: {
    getCalendar: vi.fn(() => Promise.resolve({ dates: [], streak: { current: 3, longest: 7 } })),
  },
}));

vi.mock('../../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 1, name: '테스트' },
      isLoading: false,
      isAuthenticated: true,
    }),
  };
});

describe('WeeklyCalendar', () => {
  it('이번 주 차록 제목이 표시된다', async () => {
    renderWithRouter(<WeeklyCalendar />);
    expect(screen.getByText('이번 주 차록')).toBeInTheDocument();
  });

  it('7개의 요일 버튼이 표시된다', async () => {
    renderWithRouter(<WeeklyCalendar />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      // 7 day buttons + "전체보기" + "오늘 차록 쓰기" = 9
      expect(buttons.length).toBeGreaterThanOrEqual(7);
    });
  });

  it('연속 기록 뱃지가 표시된다', async () => {
    renderWithRouter(<WeeklyCalendar />);
    await waitFor(() => {
      expect(screen.getByText('3일 연속')).toBeInTheDocument();
    });
  });
});
