import { screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, vi, describe, it, expect } from 'vitest';
import { toast } from 'sonner';
import { PostCard } from '../PostCard';
import { renderWithRouter } from '../../test/renderWithRouter';
import { useAuth } from '../../contexts/AuthContext';
import { postsApi } from '../../lib/api';
import { Post } from '../../types';

const mockDate = new Date('2025-01-01T00:00:00.000Z');

const mockPost: Post = {
  id: 1,
  userId: 2,
  user: { id: 2, name: '김차인', profileImageUrl: null },
  title: '우림 질문입니다',
  content: '어떻게 우리면 좋을까요?',
  category: 'brewing_question',
  isSponsored: false,
  sponsorNote: null,
  viewCount: 10,
  likeCount: 3,
  isLiked: false,
  isBookmarked: false,
  createdAt: mockDate,
  updatedAt: mockDate,
};

const mockUser = { id: 1, name: '테스트 사용자', email: 'test@example.com' };

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../contexts/AuthContext')>('../../contexts/AuthContext');
  return { ...actual, useAuth: vi.fn() };
});

vi.mock('../../lib/api', () => ({
  authApi: { getMe: vi.fn(() => Promise.resolve({ user: null })) },
  usersApi: { getOnboardingPreference: vi.fn(() => Promise.resolve({ hasCompletedOnboarding: true })) },
  postsApi: {
    toggleLike: vi.fn(),
    toggleBookmark: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('PostCard 컴포넌트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isAdmin: false,
      isLoading: false,
      token: 'mock-token',
      login: vi.fn(),
      register: vi.fn(),
      loginWithKakao: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      hasCompletedOnboarding: true,
      isOnboardingLoading: false,
      refreshOnboardingStatus: vi.fn(),
    });
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('제목과 내용을 표시한다', () => {
    renderWithRouter(<PostCard post={mockPost} />, { route: '/chadam' });

    expect(screen.getByText('우림 질문입니다')).toBeInTheDocument();
    expect(screen.getByText('어떻게 우리면 좋을까요?')).toBeInTheDocument();
  });

  it('카테고리 뱃지를 표시한다', () => {
    renderWithRouter(<PostCard post={mockPost} />, { route: '/chadam' });
    expect(screen.getByText('#우림 질문')).toBeInTheDocument();
  });

  it('협찬 뱃지를 표시한다', () => {
    const sponsoredPost = { ...mockPost, isSponsored: true, sponsorNote: '다실 A' };
    renderWithRouter(<PostCard post={sponsoredPost} />, { route: '/chadam' });
    expect(screen.getByText('협찬')).toBeInTheDocument();
  });

  it('클릭 시 상세 페이지로 이동한다', () => {
    renderWithRouter(<PostCard post={mockPost} />, { route: '/chadam' });
    fireEvent.click(screen.getByText('우림 질문입니다'));
    expect(mockNavigate).toHaveBeenCalledWith('/chadam/1');
  });

  it('목록 카드에 반응 수와 조회 수를 표시하고 쓰기 동작은 노출하지 않는다', () => {
    renderWithRouter(<PostCard post={mockPost} />, { route: '/chadam' });
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '좋아요' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '북마크' })).not.toBeInTheDocument();
    expect(postsApi.toggleLike).not.toHaveBeenCalled();
    expect(postsApi.toggleBookmark).not.toHaveBeenCalled();
  });

  it('비로그인 상태에서도 공개 게시글 상세로 이동한다', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      loginWithKakao: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      hasCompletedOnboarding: null,
      isOnboardingLoading: false,
      refreshOnboardingStatus: vi.fn(),
    });

    renderWithRouter(<PostCard post={mockPost} />, { route: '/chadam' });

    fireEvent.click(screen.getByText('우림 질문입니다'));
    expect(mockNavigate).toHaveBeenCalledWith('/chadam/1');
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
  });
});
