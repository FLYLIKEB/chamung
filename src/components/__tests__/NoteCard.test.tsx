import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NoteCard } from '../NoteCard';
import { MemoryRouter } from 'react-router-dom';
import { Note } from '../../types';

import { notesApi } from '../../lib/api';

vi.mock('../../lib/api', () => ({ notesApi: { toggleBookmark: vi.fn() } }));

const mockNavigate = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: '테스트 사용자', email: 'test@example.com' },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockNote: Note = {
  id: 1,
  teaId: 1,
  teaName: '테스트 차',
  userId: 1,
  userName: '테스트 사용자',
  schemaId: 1,
  overallRating: 4.5,
  isRatingIncluded: true,
  memo: '테스트 메모',
  images: ['https://example.com/image.jpg'],
  tags: ['풀향', '허브향'],
  isPublic: true,
  createdAt: new Date(),
};

describe('NoteCard - 그리드 카드', () => {
  beforeEach(() => vi.clearAllMocks());

  it('목록 카드에 글귀와 작성한 줄바꿈을 두 줄 미리보기로 표시한다', () => {
    const memo = '불을 많이 쬔 탁함, 여운이 길고 끝에 아득함.\n화려함. 다채로움';
    const { container } = render(<MemoryRouter><NoteCard note={{ ...mockNote, memo }} /></MemoryRouter>);
    const preview = container.querySelector('p.whitespace-pre-line');
    expect(preview?.textContent).toBe(memo);
    expect(preview).toHaveClass('line-clamp-2');
    expect(screen.getAllByRole('button')[0]).toHaveClass('min-h-44');
  });

  it.each([null, '', '   '])('글귀가 %s이면 빈 미리보기를 표시하지 않는다', (memo) => {
    const { container } = render(<MemoryRouter><NoteCard note={{ ...mockNote, memo }} /></MemoryRouter>);
    expect(container.querySelector('p.whitespace-pre-line')).toBeNull();
  });

  it('다른 사람의 비공개 차록 글귀는 표시하지 않는다', () => {
    render(<MemoryRouter><NoteCard note={{ ...mockNote, userId: 2, isPublic: false, memo: '비공개 글귀' }} /></MemoryRouter>);
    expect(screen.queryByText('비공개 글귀')).not.toBeInTheDocument();
  });

  it('카드와 북마크를 중첩하지 않고 키보드로 각각 실행해야 함', async () => {
    const user = userEvent.setup();
    const onBookmarkToggle = vi.fn();
    vi.mocked(notesApi.toggleBookmark).mockResolvedValue({ bookmarked: true });
    const { container } = render(
      <MemoryRouter><NoteCard note={mockNote} onBookmarkToggle={onBookmarkToggle} /></MemoryRouter>,
    );
    expect(container.querySelector('button button')).toBeNull();
    const card = screen.getAllByRole('button')[0];
    await user.tab();
    expect(card).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(mockNavigate).toHaveBeenCalledTimes(2);
    expect(mockNavigate).toHaveBeenLastCalledWith('/note/1');
    mockNavigate.mockClear();
    await user.tab();
    expect(screen.getByRole('button', { name: '북마크 추가' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onBookmarkToggle).toHaveBeenCalledWith(true));
    expect(notesApi.toggleBookmark).toHaveBeenCalledWith(1);
    expect(screen.getByRole('button', { name: '북마크 해제' })).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '북마크 해제' }));
    await waitFor(() => expect(notesApi.toggleBookmark).toHaveBeenCalledTimes(2));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('이미지가 있을 때 사진을 아주 옅은 무채색 배경으로 표시해야 함', () => {
    render(
      <MemoryRouter>
        <NoteCard note={mockNote} />
      </MemoryRouter>,
    );

    const image = screen.getByAltText('테스트 차');
    expect(image).toHaveClass('absolute', 'inset-0', 'object-cover', 'opacity-0');
    expect(image).toHaveStyle({ filter: 'grayscale(1) saturate(0) contrast(0.85) brightness(1.08)' });
  });

  it('imageThumbnails가 있으면 썸네일을 우선 표시해야 함', () => {
    const noteWithThumbnail = {
      ...mockNote,
      images: ['https://example.com/original.jpg'],
      imageThumbnails: ['https://example.com/thumb.jpg'],
    };
    render(
      <MemoryRouter>
        <NoteCard note={noteWithThumbnail} />
      </MemoryRouter>,
    );

    const img = screen.getByAltText('테스트 차');
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });

  it('imageThumbnails가 없으면 images로 폴백해야 함', () => {
    render(
      <MemoryRouter>
        <NoteCard note={mockNote} />
      </MemoryRouter>,
    );

    const img = screen.getByAltText('테스트 차');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('이미지가 없을 때 로고 플레이스홀더가 렌더링되어야 함', () => {
    const noteWithoutImage = { ...mockNote, images: null };
    render(
      <MemoryRouter>
        <NoteCard note={noteWithoutImage} />
      </MemoryRouter>,
    );

    expect(screen.queryByAltText('테스트 차')).not.toBeInTheDocument();
  });

  it('차 이름을 표시해야 함', () => {
    render(
      <MemoryRouter>
        <NoteCard note={mockNote} />
      </MemoryRouter>,
    );

    expect(screen.getByText('테스트 차')).toBeInTheDocument();
  });

  it('카드를 클릭하면 상세 페이지로 이동해야 함', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NoteCard note={mockNote} />
      </MemoryRouter>,
    );

    const card = screen.getAllByRole('button')[0];
    await user.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/note/1');
  });

  it('별점을 표시해야 함', () => {
    render(
      <MemoryRouter>
        <NoteCard note={mockNote} />
      </MemoryRouter>,
    );

    const card = screen.getAllByRole('button')[0];
    const stars = card.querySelectorAll('.fill-rating');
    expect(stars.length).toBeGreaterThan(0);
  });
});
