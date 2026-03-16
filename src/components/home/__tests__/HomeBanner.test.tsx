import { screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { HomeBanner } from '../HomeBanner';
import { renderWithRouter } from '../../../test/renderWithRouter';

vi.mock('../../../lib/api', () => ({
  authApi: { getMe: vi.fn(() => Promise.resolve({ user: { id: 1, name: '테스트' } })) },
  notesApi: { getAll: vi.fn(() => Promise.resolve([])) },
  usersApi: { getOnboardingPreference: vi.fn(() => Promise.resolve({ hasCompletedOnboarding: true })) },
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

describe('HomeBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('배너가 렌더링된다', () => {
    renderWithRouter(<HomeBanner />);
    expect(screen.getByRole('button', { name: /닫기/ })).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 배너가 사라진다', () => {
    renderWithRouter(<HomeBanner />);
    const closeButton = screen.getByRole('button', { name: /닫기/ });
    fireEvent.click(closeButton);
    expect(screen.queryByRole('button', { name: /닫기/ })).not.toBeInTheDocument();
  });

  it('dismiss 상태가 localStorage에 저장된다', () => {
    renderWithRouter(<HomeBanner />);
    fireEvent.click(screen.getByRole('button', { name: /닫기/ }));
    expect(localStorage.getItem('chalog-banner-dismissed')).toBeTruthy();
  });
});
