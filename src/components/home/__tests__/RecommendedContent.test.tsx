import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecommendedContent } from '../RecommendedContent';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { Note } from '../../../types';

vi.mock('../../../lib/api', () => ({
  authApi: { getMe: vi.fn(() => Promise.resolve({ user: null })) },
  usersApi: { getOnboardingPreference: vi.fn(() => Promise.resolve({ hasCompletedOnboarding: true })) },
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

const mockNotes: Note[] = [
  { id: 1, teaId: 1, teaName: '철관음', teaType: '청차/우롱차', overallRating: 4.5, isPublic: true, isRatingIncluded: true, userId: 1, userName: '테스트', schemaId: 1, memo: null, createdAt: new Date() },
  { id: 2, teaId: 2, teaName: '백호은침', teaType: '백차', overallRating: 4.8, isPublic: true, isRatingIncluded: true, userId: 2, userName: '다우', schemaId: 1, memo: null, createdAt: new Date() },
];

describe('RecommendedContent', () => {
  it('노트 카드가 렌더링된다', () => {
    renderWithRouter(<RecommendedContent notes={mockNotes} />);
    expect(screen.getByText('철관음')).toBeInTheDocument();
    expect(screen.getByText('백호은침')).toBeInTheDocument();
  });

  it('노트가 없으면 카드가 렌더링되지 않는다', () => {
    renderWithRouter(<RecommendedContent notes={[]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
