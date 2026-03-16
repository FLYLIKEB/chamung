import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuickAccess } from '../QuickAccess';
import { renderWithRouter } from '../../../test/renderWithRouter';

vi.mock('../../../lib/api', () => ({
  authApi: { getMe: vi.fn(() => Promise.resolve({ user: { id: 1, name: '테스트' } })) },
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

describe('QuickAccess', () => {
  it('3개의 퀵 액세스 버튼이 렌더링된다', () => {
    renderWithRouter(<QuickAccess />);
    expect(screen.getByText('내 차록')).toBeInTheDocument();
    expect(screen.getByText('탐색')).toBeInTheDocument();
    expect(screen.getByText('내 찻장')).toBeInTheDocument();
  });

  it('각 버튼이 클릭 가능하다', () => {
    renderWithRouter(<QuickAccess />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });
});
