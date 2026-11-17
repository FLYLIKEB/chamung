import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNoteForm } from '../useNoteForm';

vi.mock('../../utils/weather', () => ({ fetchWeather: vi.fn(() => Promise.resolve(null)) }));

const mockNavigate = vi.fn();
let mockSelectedTea: number | null = null;
const mockUser = { id: 1, name: '김차인', email: 'test@example.com' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../lib/api', () => ({
  notesApi: {
    getActiveSchemas: vi.fn(() =>
      Promise.resolve({
        schemas: [{ id: 1, code: 'standard', version: '1', nameKo: '기본', nameEn: 'Standard' }],
        pinnedSchemaIds: [1],
      }),
    ),
    getSchemaAxes: vi.fn(() =>
      Promise.resolve([
        { id: 10, schemaId: 1, code: 'richness', nameKo: '풍부함', nameEn: 'Richness', displayOrder: 1, minValue: 1, maxValue: 5 },
      ]),
    ),
    getById: vi.fn(),
    create: vi.fn(() => Promise.resolve({ id: 99 })),
    update: vi.fn(() => Promise.resolve({ id: 1 })),
  },
}));

vi.mock('../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      isAuthenticated: true,
      user: mockUser,
      isLoading: false,
    }),
  };
});

vi.mock('../../hooks/useTeaSelector', () => ({
  useTeaSelector: () => ({
    selectedTea: mockSelectedTea,
    selectTea: vi.fn(),
    clearTea: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    searchResults: [],
    isSearching: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useNoteForm - new 모드', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedTea = null;
  });

  it('초기 상태: overallRating RATING_DEFAULT, memo 빈 문자열, isPublic false', () => {
    const { result } = renderHook(() =>
      useNoteForm({ mode: 'new' }),
    );
    expect(result.current.overallRating).toBe(3);
    expect(result.current.memo).toBe('');
    expect(result.current.isPublic).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it('setMemo 호출 시 memo 상태 업데이트', () => {
    const { result } = renderHook(() => useNoteForm({ mode: 'new' }));
    act(() => {
      result.current.setMemo('좋은 차였습니다.');
    });
    expect(result.current.memo).toBe('좋은 차였습니다.');
  });

  it('setOverallRating 호출 시 overallRating 업데이트', () => {
    const { result } = renderHook(() => useNoteForm({ mode: 'new' }));
    act(() => {
      result.current.setOverallRating(4.5);
    });
    expect(result.current.overallRating).toBe(4.5);
  });

  it('setIsPublic 호출 시 isPublic 업데이트', () => {
    const { result } = renderHook(() => useNoteForm({ mode: 'new' }));
    act(() => {
      result.current.setIsPublic(true);
    });
    expect(result.current.isPublic).toBe(true);
  });

  it('차 미선택 시 handleSave → toast.error 호출', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useNoteForm({ mode: 'new' }));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('isSampleMode true 시 handleSave → 체험 완료 toast', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useNoteForm({ mode: 'new', isSampleMode: true }));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('체험 완료'));
  });

  it('setImagesAndThumbnails 호출 시 images/imageThumbnails 업데이트', () => {
    const { result } = renderHook(() => useNoteForm({ mode: 'new' }));
    act(() => {
      result.current.setImagesAndThumbnails(['img1.jpg'], [null]);
    });
    expect(result.current.images).toEqual(['img1.jpg']);
    expect(result.current.imageThumbnails).toEqual([null]);
  });

  it('overallRating 설정 시 스키마 fetch 시작', async () => {
    const { notesApi } = await import('../../lib/api');
    const { result } = renderHook(() => useNoteForm({ mode: 'new' }));

    act(() => {
      result.current.setOverallRating(4);
    });

    await waitFor(() => {
      expect(notesApi.getActiveSchemas).toHaveBeenCalled();
    });
  });
});

describe('useNoteForm - edit 모드', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedTea = null;
  });

  it('edit 모드 초기 상태: isLoading true', () => {
    const { result } = renderHook(() => useNoteForm({ mode: 'edit', noteId: 1 }));
    expect(result.current.isLoading).toBe(true);
  });

  it('수정 저장 시 기존 overallRating이 0.5 단위가 아니어도 반올림해서 전송', async () => {
    mockSelectedTea = 1;
    const { notesApi } = await import('../../lib/api');
    vi.mocked(notesApi.getById).mockResolvedValue({
      id: 1,
      teaId: 1,
      teaName: '테스트 차',
      userId: 1,
      userName: '김차인',
      schemaId: 1,
      schemaIds: [1],
      schema: { id: 1, code: 'standard', version: '1', nameKo: '기본', nameEn: 'Standard' },
      overallRating: 4.8,
      isRatingIncluded: true,
      axisValues: [{ axisId: 10, valueNumeric: 4.8 }],
      memo: '기존 메모',
      images: null,
      tags: [],
      isPublic: false,
      createdAt: new Date(),
    } as any);

    const { result } = renderHook(() => useNoteForm({ mode: 'edit', noteId: 1 }));

    await waitFor(() => {
      expect(result.current.note).not.toBeNull();
    });

    expect(result.current.overallRating).toBe(5);

    await act(async () => {
      await result.current.handleSave();
    });

    expect(notesApi.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ overallRating: 5 }),
    );
  });

  it('수정 저장 시 현재 선택된 차 ID를 update payload에 담아 전송', async () => {
    mockSelectedTea = 2;
    const { notesApi } = await import('../../lib/api');
    vi.mocked(notesApi.getById).mockResolvedValue({
      id: 1,
      teaId: 1,
      teaName: '기존 차',
      userId: 1,
      userName: '김차인',
      schemaId: 1,
      schemaIds: [1],
      schema: { id: 1, code: 'standard', version: '1', nameKo: '기본', nameEn: 'Standard' },
      overallRating: 4,
      isRatingIncluded: true,
      axisValues: [{ axisId: 10, valueNumeric: 4 }],
      memo: '기존 메모',
      images: null,
      tags: [],
      isPublic: false,
      createdAt: new Date(),
    } as any);

    const { result } = renderHook(() => useNoteForm({ mode: 'edit', noteId: 1 }));

    await waitFor(() => {
      expect(result.current.note).not.toBeNull();
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(notesApi.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ teaId: 2 }),
    );
  });
});


describe('useNoteForm - 사용한 다구 저장', () => {
  const teaware = [{ kind: 'gaiwan' as const, name: '개완' }, { id: 3, kind: 'cup' as const, name: '청자 잔', imageUrl: 'https://example.com/cup.jpg' }];

  it('신규 차록에 기본 및 사진 다구를 함께 전송한다', async () => {
    mockSelectedTea = 1;
    const { notesApi } = await import('../../lib/api');
    const { result } = renderHook(() => useNoteForm({ mode: 'new' }));
    await waitFor(() => expect(result.current.schemas).toHaveLength(1));
    act(() => result.current.setTeaware(teaware));
    await act(async () => { await result.current.handleSave(); });
    expect(notesApi.create).toHaveBeenCalledWith(expect.objectContaining({ teaware }));
  });

  it('기존 차록의 다구를 복원하고 빈 배열로 제거한다', async () => {
    mockSelectedTea = 1;
    const { notesApi } = await import('../../lib/api');
    vi.mocked(notesApi.getById).mockResolvedValue({ id: 1, userId: 1, teaId: 1, teaName: '테스트 차', schemaIds: [1], overallRating: 4, memo: '', teaware, isPublic: false } as any);
    const { result } = renderHook(() => useNoteForm({ mode: 'edit', noteId: 1 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.teaware).toEqual(teaware);
    await act(async () => { await result.current.handleSave(); });
    expect(notesApi.update).toHaveBeenLastCalledWith(1, expect.objectContaining({ teaware }));
    act(() => result.current.setTeaware([]));
    await act(async () => { await result.current.handleSave(); });
    expect(notesApi.update).toHaveBeenLastCalledWith(1, expect.objectContaining({ teaware: [] }));
  });
});
