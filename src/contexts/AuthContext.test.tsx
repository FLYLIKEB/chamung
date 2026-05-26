import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, isKakaoLoginCallbackUrl } from './AuthContext';
import { authApi, usersApi } from '../lib/api';

const { toast } = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('sonner', () => ({ toast }));

vi.mock('../lib/api', () => ({
  authApi: {
    getMe: vi.fn(),
    logout: vi.fn(),
  },
  usersApi: {
    getOnboardingPreference: vi.fn(),
  },
}));

describe('AuthProvider initial session check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.mocked(authApi.getMe).mockResolvedValue({
      user: { id: 1, email: 'user@example.com', name: 'User' },
    });
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    vi.mocked(usersApi.getOnboardingPreference).mockResolvedValue({
      hasCompletedOnboarding: true,
    });
  });

  it('recognizes Kakao login callback URLs only on /login with a code', () => {
    expect(isKakaoLoginCallbackUrl({ pathname: '/login', search: '?code=abc' })).toBe(true);
    expect(isKakaoLoginCallbackUrl({ pathname: '/login', search: '' })).toBe(false);
    expect(isKakaoLoginCallbackUrl({ pathname: '/login', search: '?code=' })).toBe(false);
    expect(isKakaoLoginCallbackUrl({ pathname: '/settings', search: '?code=abc' })).toBe(false);
  });

  it('checks the existing session on normal app entry', async () => {
    render(
      <AuthProvider>
        <div>app</div>
      </AuthProvider>,
    );

    await waitFor(() => expect(authApi.getMe).toHaveBeenCalledTimes(1));
  });

  it('skips the initial session check during Kakao login callback handling', async () => {
    window.history.replaceState({}, '', '/login?code=kakao-code');

    render(
      <AuthProvider>
        <div>app</div>
      </AuthProvider>,
    );

    await waitFor(() => expect(authApi.getMe).not.toHaveBeenCalled());
  });

  it('does not show a logout toast when auth:logout fires while already unauthenticated', async () => {
    vi.mocked(authApi.getMe).mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <div>app</div>
      </AuthProvider>,
    );

    await waitFor(() => expect(authApi.getMe).toHaveBeenCalledTimes(1));

    window.dispatchEvent(new Event('auth:logout'));

    await waitFor(() => expect(authApi.logout).not.toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalledWith('로그아웃되었습니다.');
  });
});
