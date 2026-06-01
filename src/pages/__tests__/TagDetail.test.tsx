import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TagDetail } from '../TagDetail';
import { tagsApi } from '../../lib/api';

const mockNavigate = vi.fn();
let mockTagName = '자스민';

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api');
  return {
    ...actual,
    tagsApi: {
      getTagDetail: vi.fn(),
      getTagNotes: vi.fn(),
      getPopularTags: vi.fn(),
      getRecentTags: vi.fn(),
      followTag: vi.fn(),
      unfollowTag: vi.fn(),
    },
    teasApi: {
      ...(actual as any).teasApi,
      getByTags: vi.fn(() => Promise.resolve([])),
    },
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: '테스트 사용자' } }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ name: encodeURIComponent(mockTagName) }),
    useNavigate: () => mockNavigate,
  };
});

describe('TagDetail 스키마 표시', () => {
  beforeEach(() => {
    mockTagName = '자스민';
    mockNavigate.mockClear();
    vi.mocked(tagsApi.getTagDetail).mockResolvedValue({
      name: '자스민',
      noteCount: 3,
      isFollowing: false,
      followerCount: 2,
    });
    vi.mocked(tagsApi.getTagNotes).mockResolvedValue({ notes: [], total: 3 });
    vi.mocked(tagsApi.getPopularTags).mockResolvedValue([]);
    vi.mocked(tagsApi.getRecentTags).mockResolvedValue([]);
  });

  it('알려진 향미 태그는 그룹·카테고리·설명과 같은 스키마 향미를 보여줘야 함', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TagDetail />
      </MemoryRouter>,
    );

    const schemaPanel = await screen.findByLabelText('향미 스키마 설명');
    expect(schemaPanel).toHaveTextContent('향 · Aroma');
    expect(schemaPanel).toHaveTextContent('category: floral');
    expect(schemaPanel).toHaveTextContent('자스민차에서 나는 달콤하고 관능적인 꽃향');

    await user.click(screen.getByRole('button', { name: '관련 향미' }));

    await waitFor(() => {
      expect(screen.getByText('같은 스키마 향미')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /꽃향/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /장미/ })).toBeInTheDocument();
  });

  it('DB에 아직 없는 스키마 향미도 존재하지 않는 향미로 돌려보내지 않아야 함', async () => {
    mockTagName = '감귤/시트러스';
    vi.mocked(tagsApi.getTagDetail).mockRejectedValue({ statusCode: 404 });
    vi.mocked(tagsApi.getTagNotes).mockRejectedValue({ statusCode: 404 });

    render(
      <MemoryRouter>
        <TagDetail />
      </MemoryRouter>,
    );

    const schemaPanel = await screen.findByLabelText('향미 스키마 설명');
    expect(schemaPanel).toHaveTextContent('향 · Aroma');
    expect(schemaPanel).toHaveTextContent('귤껍질·오렌지·자몽·라임');
    expect(screen.getByText('차록 0개')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '스키마' })).toBeDisabled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
