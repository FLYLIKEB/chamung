import { render, screen, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NoteDetail } from '../NoteDetail';
import { MemoryRouter } from 'react-router-dom';
import { notesApi } from '../../lib/api';
import { Note } from '../../types';

const mockNavigate = vi.fn();

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api');
  return {
    ...actual,
    notesApi: {
      getById: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    teasApi: {
      ...(actual as any).teasApi,
      getById: vi.fn(() =>
        Promise.resolve({
          id: 1,
          name: '테스트 차',
          type: '녹차',
          averageRating: 4.0,
          reviewCount: 5,
        }),
      ),
    },
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: '테스트 사용자', email: 'test@example.com' },
    isLoading: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
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
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  tags: ['풀향', '허브향'],
  isPublic: true,
  createdAt: new Date(),
};

describe('NoteDetail - 카드 사진 배경', () => {
  beforeEach(() => {
    vi.mocked(notesApi.getById).mockResolvedValue(mockNote);
  });

  it('사진이 여러 장이면 카드 순서대로 사진 배경을 배정해야 함', async () => {
    render(
      <MemoryRouter>
        <NoteDetail />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('테스트 사용자')).toBeInTheDocument();
    });

    const cards = document.querySelectorAll<HTMLElement>('.note-detail-photo-card');
    expect(cards[0]).toHaveAttribute('data-has-photo', 'true');
    expect(cards[0].style.getPropertyValue('--note-card-photo')).toContain('image1.jpg');
    expect(cards[1]).toHaveAttribute('data-has-photo', 'true');
    expect(cards[1].style.getPropertyValue('--note-card-photo')).toContain('image2.jpg');
  });

  it('사진이 한 장이면 첫 카드에만 사진 배경을 배정해야 함', async () => {
    vi.mocked(notesApi.getById).mockResolvedValue({ ...mockNote, images: ['https://example.com/only.jpg'] });

    render(
      <MemoryRouter>
        <NoteDetail />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('테스트 사용자')).toBeInTheDocument();
    });

    const cards = document.querySelectorAll<HTMLElement>('.note-detail-photo-card');
    expect(cards[0]).toHaveAttribute('data-has-photo', 'true');
    expect(cards[0].style.getPropertyValue('--note-card-photo')).toContain('only.jpg');
    expect(cards[1]).not.toHaveAttribute('data-has-photo');
  });

  it('사진 목록은 사진 버튼을 눌렀을 때만 보여야 함', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NoteDetail />
      </MemoryRouter>,
    );

    const photoToggle = await screen.findByRole('button', { name: /사진/i });
    expect(screen.queryByAltText('사진 1')).not.toBeInTheDocument();

    await user.click(photoToggle);

    expect(await screen.findByAltText('사진 1')).toBeInTheDocument();
    expect(photoToggle).toHaveAttribute('aria-expanded', 'true');
  });


  it('다회모드로 작성된 메모는 별도 표로 표시해야 함', async () => {
    vi.mocked(notesApi.getById).mockResolvedValue({
      ...mockNote,
      memo: '첫 인상은 부드러웠습니다.\n\n---\n### 다회모드로 작성됨 🔄\n\n| 탕 | 시간 | 수색 | 향 | 물온도 | 몸반응 | 만족도 | 메모 |\n|:---|:---|:---|:---|:---|:---|:---|:---|\n| 1탕 | 30초 | 황금색 | 꽃향 | 85°C | 따뜻함 | 4/5 | 좋음 |\n| 2탕 | 45초 | 연노랑 | 과일향 | 90°C | 편안함 | 5/5 | 더 좋음 |',
    });

    render(
      <MemoryRouter>
        <NoteDetail />
      </MemoryRouter>,
    );

    expect(await screen.findByText('첫 인상은 부드러웠습니다.')).toBeInTheDocument();
    expect(screen.queryByText('### 다회모드로 작성됨 🔄')).not.toBeInTheDocument();

    const table = screen.getByRole('table', { name: '다회모드 탕 기록' });
    expect(within(table).getByRole('columnheader', { name: '탕' })).toBeInTheDocument();
    expect(within(table).getByText('1탕')).toBeInTheDocument();
    expect(within(table).getByText('2탕')).toBeInTheDocument();
    expect(within(table).getByText('더 좋음')).toBeInTheDocument();
  });

  it('작성자 이름을 클릭하면 프로필 페이지로 이동해야 함', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NoteDetail />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('테스트 사용자')).toBeInTheDocument();
    });

    const authorName = screen.getByText('테스트 사용자');
    await user.click(authorName);

    expect(mockNavigate).toHaveBeenCalledWith('/user/1');
  });

  it('작성자 이름에 호버 효과가 있어야 함', async () => {
    render(
      <MemoryRouter>
        <NoteDetail />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const authorName = screen.getByText('테스트 사용자');
      expect(authorName).toHaveClass('hover:text-primary', 'cursor-pointer');
    });
  });
});

describe('NoteDetail - 수정/삭제/비공개 기능', () => {
  beforeEach(() => {
    vi.mocked(notesApi.getById).mockResolvedValue(mockNote);
    vi.mocked(notesApi.delete).mockResolvedValue(undefined as any);
    vi.mocked(notesApi.update).mockResolvedValue({ ...mockNote, isPublic: false } as any);
    mockNavigate.mockClear();
  });

  it('수정 버튼 클릭 시 편집 페이지로 이동해야 함', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NoteDetail />
      </MemoryRouter>,
    );

    const editButton = await screen.findByRole('button', { name: '수정' });

    await user.click(editButton);
    expect(mockNavigate).toHaveBeenCalledWith('/note/1/edit');
  });

  it('비공개 전환 버튼 클릭 시 notesApi.update가 호출되어야 함', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NoteDetail />
      </MemoryRouter>,
    );

    const privacyButton = await screen.findByRole('button', { name: '비공개로 전환' });

    await user.click(privacyButton);

    await waitFor(() => {
      expect(notesApi.update).toHaveBeenCalledWith(1, { isPublic: false });
    });
  });

  it('삭제 버튼 클릭 시 AlertDialog가 열리고, 확인 시 notesApi.delete가 호출되어야 함', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NoteDetail />
      </MemoryRouter>,
    );

    await screen.findByRole('button', { name: '수정' });

    // 삭제 아이콘 버튼 클릭 (Trash2 아이콘 포함 버튼)
    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    await user.click(deleteButton);

    // AlertDialog 열림 확인
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    // 다이얼로그 내부의 삭제 확인 버튼 클릭
    const dialog = screen.getByRole('alertdialog');
    const confirmButton = within(dialog).getByRole('button', { name: '삭제' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(notesApi.delete).toHaveBeenCalledWith(1);
    });
  });

  it('내 노트가 아닐 때 수정/삭제/비공개 버튼이 노출되지 않아야 함', async () => {
    const otherUserNote: Note = { ...mockNote, userId: 999 };
    vi.mocked(notesApi.getById).mockResolvedValue(otherUserNote);

    render(
      <MemoryRouter>
        <NoteDetail />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('테스트 사용자')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '비공개로 전환' })).not.toBeInTheDocument();
  });
});

