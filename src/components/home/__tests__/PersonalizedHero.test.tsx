import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PersonalizedHero } from '../PersonalizedHero';
import { renderWithRouter } from '../../../test/renderWithRouter';

vi.mock('../../../lib/api', () => ({
  authApi: { getMe: vi.fn(() => Promise.resolve({ user: { id: 1, name: '테스트' } })) },
  notesApi: { getAll: vi.fn(() => Promise.resolve([])) },
  usersApi: { getOnboardingPreference: vi.fn(() => Promise.resolve({ hasCompletedOnboarding: true })) },
}));

type AuthState = {
  user: { id: number; name: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

let mockAuthState: AuthState = { user: null, isLoading: false, isAuthenticated: false };

vi.mock('../../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => mockAuthState,
  };
});

describe('PersonalizedHero - 비로그인', () => {
  beforeEach(() => {
    mockAuthState = { user: null, isLoading: false, isAuthenticated: false };
  });

  it('일반 메시지를 표시한다', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={false} streak={0} />);
    expect(screen.getByText('차를 기록하고, 함께 나눠요.')).toBeInTheDocument();
  });

  it('dismiss 버튼(X)이 없다', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={false} streak={0} />);
    expect(screen.queryByRole('button', { name: /닫기/ })).not.toBeInTheDocument();
  });

  it('localStorage.setItem을 호출하지 않는다', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    render(<MemoryRouter><PersonalizedHero hasTodayNote={false} streak={0} /></MemoryRouter>);
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});

describe('PersonalizedHero - 로그인', () => {
  beforeEach(() => {
    mockAuthState = { user: { id: 1, name: '테스트' }, isLoading: false, isAuthenticated: true };
  });

  it('오늘 노트 없음 → 개인화 인사 표시', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={false} streak={0} />);
    expect(screen.getByText('테스트님, 오늘의 차를 남겨요.')).toBeInTheDocument();
  });

  it('오늘 노트 없음 → 차록 쓰기 버튼 표시', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={false} streak={0} />);
    expect(screen.getByRole('button', { name: /차록 쓰기/ })).toBeInTheDocument();
  });

  it('오늘 노트 있음 → 완료 메시지 표시', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={true} streak={0} />);
    expect(screen.getByText('테스트님의 오늘 차록.')).toBeInTheDocument();
  });

  it('streak > 0 → N일 연속 기록 중 표시', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={false} streak={5} />);
    expect(screen.getByText('5일 연속 기록 중입니다.')).toBeInTheDocument();
  });

  it('streak = 0 → 꾸준히 기록해보세요 표시', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={false} streak={0} />);
    expect(screen.getByText('오늘 마신 차의 향과 맛을 기록해 보세요.')).toBeInTheDocument();
  });
});
