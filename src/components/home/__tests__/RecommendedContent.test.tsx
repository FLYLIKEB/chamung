import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecommendedContent } from '../RecommendedContent';
import { renderWithRouter } from '../../../test/renderWithRouter';

vi.mock('../../../lib/api', () => ({
  authApi: { getMe: vi.fn(() => Promise.resolve({ user: null })) },
  notesApi: {
    getAll: vi.fn(() => Promise.resolve([
      { id: 1, teaName: '철관음', teaType: '청차/우롱차', overallRating: 4.5, isPublic: true, userId: 1, userName: '테스트', createdAt: new Date() },
      { id: 2, teaName: '백호은침', teaType: '백차', overallRating: 4.8, isPublic: true, userId: 2, userName: '다우', createdAt: new Date() },
    ])),
  },
}));

vi.mock('../../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }),
  };
});

describe('RecommendedContent', () => {
  it('추천 콘텐츠 제목이 표시된다', async () => {
    renderWithRouter(<RecommendedContent />);
    expect(screen.getByText('추천 차록')).toBeInTheDocument();
  });

  it('더보기 링크가 표시된다', () => {
    renderWithRouter(<RecommendedContent />);
    expect(screen.getByText('더보기')).toBeInTheDocument();
  });
});
