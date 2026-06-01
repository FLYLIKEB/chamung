import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { UserNoteList } from '../UserNoteList';
import { Note } from '@/types';

vi.mock('@/components/NoteCard', () => ({
  NoteCard: ({ note }: { note: Note }) => <div>{note.teaName}</div>,
}));

vi.mock('@/components/InfiniteScrollSentinel', () => ({
  InfiniteScrollSentinel: () => <div data-testid="sentinel" />,
}));

vi.mock('../ReportContent', () => ({
  ReportContent: ({ userId, profileName, isOwnProfile }: { userId: number; profileName: string; isOwnProfile: boolean }) => (
    <div data-testid="report-content">
      report:{userId}:{profileName}:{String(isOwnProfile)}
    </div>
  ),
}));

vi.mock('../SavedContent', () => ({
  SavedContent: () => <div data-testid="saved-content">saved</div>,
}));

const note: Note = {
  id: 1,
  teaId: 1,
  teaName: '우전',
  userId: 4,
  userName: '다인',
  schemaId: 1,
  overallRating: 4.5,
  isRatingIncluded: true,
  memo: null,
  isPublic: true,
  createdAt: new Date('2026-05-01'),
};

function renderList(isOwnProfile: boolean) {
  return render(
    <MemoryRouter>
      <UserNoteList
        notes={[note]}
        userId={4}
        profileName="다인"
        noteTotal={1}
        sort="latest"
        onSortChange={vi.fn()}
        hasMore={false}
        isLoadingMore={false}
        onLoadMore={vi.fn()}
        isOwnProfile={isOwnProfile}
      />
    </MemoryRouter>,
  );
}

describe('UserNoteList report tab', () => {
  it('타인 프로필에서도 레포트 탭을 열고 대상 사용자 정보를 전달한다', async () => {
    const user = userEvent.setup();
    renderList(false);

    expect(screen.getByRole('button', { name: '레포트' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '저장함' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '레포트' }));

    expect(screen.getByTestId('report-content')).toHaveTextContent('report:4:다인:false');
  });

  it('내 프로필에서는 레포트와 저장함 탭을 모두 표시한다', () => {
    renderList(true);

    expect(screen.getByRole('button', { name: '레포트' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장함' })).toBeInTheDocument();
  });
});
