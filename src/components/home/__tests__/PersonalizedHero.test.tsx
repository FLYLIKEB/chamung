import { screen } from '@testing-library/react';
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
    expect(screen.getByText('차를 마시고, 소중한 순간을 기록하세요.')).toBeInTheDocument();
  });

  it('dismiss 버튼(X)이 없다', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={false} streak={0} />);
    expect(screen.queryByRole('button', { name: /닫기/ })).not.toBeInTheDocument();
  });

  it('localStorage.setItem을 호출하지 않는다', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderWithRouter(<PersonalizedHero hasTodayNote={false} streak={0} />);
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
    expect(screen.getByText('테스트님, 오늘 차 한 잔 어때요?')).toBeInTheDocument();
  });

  it('오늘 노트 없음 → 차록 쓰기 버튼 표시', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={false} streak={0} />);
    expect(screen.getByRole('button', { name: /차록 쓰기/ })).toBeInTheDocument();
  });

  it('오늘 노트 있음 → 완료 메시지 표시', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={true} streak={0} />);
    expect(screen.getByText('테스트님, 오늘도 차록을 남겼네요!')).toBeInTheDocument();
  });

  it('streak > 0 → N일 연속 기록 중 표시', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={false} streak={5} />);
    expect(screen.getByText('5일 연속 기록 중')).toBeInTheDocument();
  });

  it('streak = 0 → 꾸준히 기록해보세요 표시', () => {
    renderWithRouter(<PersonalizedHero hasTodayNote={false} streak={0} />);
    expect(screen.getByText('꾸준히 기록해보세요.')).toBeInTheDocument();
  });
});
