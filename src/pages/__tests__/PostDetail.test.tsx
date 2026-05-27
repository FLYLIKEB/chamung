import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, vi, describe, it, expect } from 'vitest';
import { PostDetail } from '../PostDetail';
import { renderWithRouter } from '../../test/renderWithRouter';
import { useAuth } from '../../contexts/AuthContext';
import { authApi, postsApi, commentsApi } from '../../lib/api';

const mockDate = new Date('2025-01-01T00:00:00.000Z');

const mockPost = {
  id: 1,
  userId: 2,
  user: { id: 2, name: '김차인', profileImageUrl: null },
  title: '우림 질문입니다',
  content: '어떻게 우리면 좋을까요? 자세히 알려주세요.',
  category: 'brewing_question' as const,
  isSponsored: false,
  sponsorNote: null,
  viewCount: 10,
  likeCount: 3,
  isLiked: false,
  isBookmarked: false,
  createdAt: mockDate,
  updatedAt: mockDate,
};

const mockComments = [
  {
    id: 1,
    postId: 1,
    userId: 3,
    user: { id: 3, name: '이다원', profileImageUrl: null },
    content: '첫 번째 댓글입니다.',
    createdAt: mockDate,
    updatedAt: mockDate,
  },
];

const mockUser = { id: 1, name: '테스트 사용자', email: 'test@example.com' };

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../contexts/AuthContext')>('../../contexts/AuthContext');
  return { ...actual, useAuth: vi.fn() };
});

vi.mock('../../lib/api', () => ({
  authApi: {
    getMe: vi.fn().mockRejectedValue(new Error('unauthenticated')),
  },
  postsApi: {
    getById: vi.fn(),
    toggleLike: vi.fn(),
    toggleBookmark: vi.fn(),
    delete: vi.fn(),
    report: vi.fn(),
  },
  commentsApi: { getByPost: vi.fn() },
  REPORT_REASONS: [
    { value: 'spam', label: '스팸' },
    { value: 'inappropriate', label: '부적절한 내용' },
    { value: 'copyright', label: '저작권 침해' },
    { value: 'other', label: '기타' },
  ],
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: '1' }) };
});

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('PostDetail 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.getMe).mockRejectedValue(new Error('unauthenticated'));
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
    vi.mocked(postsApi.getById).mockResolvedValue(mockPost);
    vi.mocked(commentsApi.getByPost).mockResolvedValue(mockComments);
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('게시글 제목과 내용을 표시한다', async () => {
    renderWithRouter(<PostDetail />, { route: '/chadam/1' });

    await waitFor(() => {
      expect(screen.getByText('우림 질문입니다')).toBeInTheDocument();
      expect(screen.getByText('어떻게 우리면 좋을까요? 자세히 알려주세요.')).toBeInTheDocument();
    });
  });


  it('글상세 본문은 Pretendard 전용 클래스를 사용한다', async () => {
    renderWithRouter(<PostDetail />, { route: '/chadam/1' });

    const content = await screen.findByText('어떻게 우리면 좋을까요? 자세히 알려주세요.');
    expect(content.closest('.post-detail-page')).toBeInTheDocument();
    expect(content.closest('.post-detail-content')).toBeInTheDocument();
  });

  it('카테고리 뱃지를 표시한다', async () => {
    renderWithRouter(<PostDetail />, { route: '/chadam/1' });

    await waitFor(() => {
      expect(screen.getAllByText(/우림 질문/).length).toBeGreaterThan(0);
    });
  });

  it('댓글을 표시한다', async () => {
    renderWithRouter(<PostDetail />, { route: '/chadam/1' });

    await waitFor(() => {
      expect(screen.getByText('첫 번째 댓글입니다.')).toBeInTheDocument();
    });
  });

  it('댓글 이동은 내부 스크롤 컨테이너를 직접 스크롤한다', async () => {
    const scrollTo = vi.fn();
    const scrollIntoView = vi.fn();

    renderWithRouter(
      <div className="flex h-screen flex-col overflow-hidden">
        <div
          className="flex-1 overflow-y-auto"
          ref={(node) => {
            if (!node) return;
            Object.defineProperty(node, 'scrollTo', { value: scrollTo, configurable: true });
          }}
        >
          <PostDetail />
        </div>
      </div>,
      { route: '/chadam/1' }
    );

    const commentHeading = await screen.findByText('댓글');
    const commentsSection = commentHeading.closest('.post-detail-comments') as HTMLDivElement;

    Object.defineProperty(commentsSection, 'offsetTop', { value: 640, configurable: true });
    Object.defineProperty(commentsSection, 'scrollIntoView', { value: scrollIntoView, configurable: true });

    fireEvent.click(screen.getByLabelText('댓글로 이동'));

    expect(scrollTo).toHaveBeenCalledWith({ top: 640, behavior: 'smooth' });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('협찬 뱃지를 표시한다 (isSponsored=true)', async () => {
    vi.mocked(postsApi.getById).mockResolvedValue({
      ...mockPost,
      isSponsored: true,
      sponsorNote: '다실 A',
    });

    renderWithRouter(<PostDetail />, { route: '/chadam/1' });

    await waitFor(() => {
      expect(screen.getByText('협찬')).toBeInTheDocument();
    });
  });

  it('작성자에게 수정/삭제 옵션을 표시한다', async () => {
    vi.mocked(postsApi.getById).mockResolvedValue({ ...mockPost, userId: mockUser.id });

    renderWithRouter(<PostDetail />, { route: '/chadam/1' });

    await waitFor(() => {
      expect(screen.getByLabelText('더보기')).toBeInTheDocument();
    });
  });
});
