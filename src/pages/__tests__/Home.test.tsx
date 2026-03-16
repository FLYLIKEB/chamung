import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Home } from '../Home';
import { renderWithRouter } from '../../test/renderWithRouter';

vi.mock('../../lib/api', () => ({
  notesApi: {
    getAll: vi.fn(() => Promise.resolve([
      { id: 1, teaName: '화과향', teaType: '청차/우롱차', overallRating: 4.5, isPublic: true, userId: 1, userName: '김차인', createdAt: new Date() },
    ])),
    getCalendar: vi.fn(() => Promise.resolve({ dates: [], streak: { current: 0, longest: 0 } })),
  },
  teasApi: {
    getAll: vi.fn(() => Promise.resolve([])),
    getTrending: vi.fn(() => Promise.resolve([])),
  },
  usersApi: {
    getTrending: vi.fn(() => Promise.resolve([])),
  },
  authApi: {
    getMe: vi.fn(() => Promise.resolve({ user: null })),
  },
  tagsApi: {
    getFollowedTags: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }),
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Home 페이지', () => {
  it('대시보드 레이아웃이 렌더링된다', async () => {
    renderWithRouter(<Home />, { route: '/' });

    // 퀵 액세스 버튼 확인 (캘린더는 QuickAccess에서만 나타남)
    await waitFor(() => {
      expect(screen.getByText('캘린더')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('추천 차록 섹션이 표시된다', async () => {
    renderWithRouter(<Home />, { route: '/' });

    await waitFor(() => {
      expect(screen.getByText('추천 차록')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('인기차 섹션은 홈에 표시하지 않는다', async () => {
    renderWithRouter(<Home />, { route: '/' });

    await waitFor(() => {
      expect(screen.getByText('추천 차록')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.queryByText(/요즘 인기 차/)).not.toBeInTheDocument();
    expect(screen.queryByText(/인기 다우/)).not.toBeInTheDocument();
  });
});
