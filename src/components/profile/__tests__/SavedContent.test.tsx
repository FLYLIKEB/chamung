import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SavedContent } from '../SavedContent';
import { notesApi, postsApi, teasApi } from '@/lib/api';
import type { Note, Post, Tea } from '@/types';

const { user } = vi.hoisted(() => ({ user: { id: 1 } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user }) }));
vi.mock('@/lib/api', () => ({
  notesApi: { getAll: vi.fn() },
  postsApi: { getAll: vi.fn() },
  teasApi: { getWishlisted: vi.fn() },
}));
vi.mock('@/components/NoteCard', () => ({ NoteCard: ({ note, onBookmarkToggle }: { note: { id: number }; onBookmarkToggle: (value: boolean) => void }) => <button onClick={() => onBookmarkToggle(false)}>차록 {note.id}</button> }));
vi.mock('@/components/PostCard', () => ({ PostCard: ({ post, onBookmarkToggle }: { post: { id: number }; onBookmarkToggle: (value: boolean) => void }) => <button onClick={() => onBookmarkToggle(false)}>게시글 {post.id}</button> }));
vi.mock('@/components/TeaCard', () => ({ TeaCard: ({ tea }: { tea: { id: number } }) => <div>차 {tea.id}</div> }));

const renderSaved = () => render(<MemoryRouter><SavedContent /></MemoryRouter>);

describe('SavedContent', () => {
  beforeEach(() => {
    vi.mocked(notesApi.getAll).mockResolvedValue([]);
    vi.mocked(postsApi.getAll).mockResolvedValue([]);
    vi.mocked(teasApi.getWishlisted).mockResolvedValue([]);
  });

  it('shows a retryable error instead of an empty collection on failure', async () => {
    vi.mocked(notesApi.getAll).mockRejectedValueOnce(new Error('offline'));
    renderSaved();
    expect(await screen.findByRole('alert')).toHaveTextContent('저장한 차록을 불러오는데 실패했습니다.');
    expect(screen.queryByText('아직 저장한 차록이 없어요.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('아직 저장한 차록이 없어요.')).toBeInTheDocument();
    expect(notesApi.getAll).toHaveBeenCalledTimes(2);
  });

  it('rejects a malformed collection instead of treating it as empty', async () => {
    vi.mocked(notesApi.getAll).mockResolvedValue({ unexpected: true } as unknown as Note[]);
    renderSaved();
    expect(await screen.findByRole('alert')).toHaveTextContent('저장한 차록을 불러오는데 실패했습니다.');
    expect(screen.queryByText('아직 저장한 차록이 없어요.')).not.toBeInTheDocument();
  });

  it('paginates notes locally and removes only the unbookmarked item', async () => {
    vi.mocked(notesApi.getAll).mockResolvedValue(Array.from({ length: 21 }, (_, i) => ({ id: i + 1 })) as Note[]);
    renderSaved();
    await screen.findByRole('button', { name: '차록 20' });
    expect(screen.queryByRole('button', { name: '차록 21' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '더 보기' }));
    expect(screen.getByRole('button', { name: '차록 21' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '차록 1' }));
    expect(screen.queryByRole('button', { name: '차록 1' })).not.toBeInTheDocument();
    expect(notesApi.getAll).toHaveBeenCalledTimes(1);
  });

  it('loads more bookmarked posts with the next server page', async () => {
    vi.mocked(postsApi.getAll).mockResolvedValueOnce(Array.from({ length: 20 }, (_, i) => ({ id: i + 1 })) as Post[]).mockResolvedValueOnce([{ id: 21 }] as Post[]);
    renderSaved();
    fireEvent.click(screen.getByRole('button', { name: '게시글' }));
    await screen.findByRole('button', { name: '게시글 20' });
    fireEvent.click(screen.getByRole('button', { name: '더 보기' }));
    expect(await screen.findByRole('button', { name: '게시글 21' })).toBeInTheDocument();
    expect(postsApi.getAll).toHaveBeenLastCalledWith(undefined, 2, 20, undefined, true);
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('keeps existing posts available after a failed pagination request and retries the same page', async () => {
    vi.mocked(postsApi.getAll).mockResolvedValueOnce(Array.from({ length: 20 }, (_, i) => ({ id: i + 1 })) as Post[]).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([{ id: 21 }] as Post[]);
    renderSaved();
    fireEvent.click(screen.getByRole('button', { name: '게시글' }));
    await screen.findByRole('button', { name: '게시글 20' });
    fireEvent.click(screen.getByRole('button', { name: '더 보기' }));
    await waitFor(() => expect(postsApi.getAll).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByRole('button', { name: '더 보기' })).not.toBeDisabled());
    expect(screen.getByRole('button', { name: '게시글 1' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '더 보기' }));
    expect(await screen.findByRole('button', { name: '게시글 21' })).toBeInTheDocument();
    expect(postsApi.getAll).toHaveBeenLastCalledWith(undefined, 2, 20, undefined, true);
  });

  it('loads wishlisted teas when their tab opens', async () => {
    vi.mocked(teasApi.getWishlisted).mockResolvedValue([{ id: 9 }] as Tea[]);
    renderSaved();
    expect(teasApi.getWishlisted).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '찜한 차' }));
    expect(await screen.findByText('차 9')).toBeInTheDocument();
    expect(teasApi.getWishlisted).toHaveBeenCalledTimes(1);
  });
});
