import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { FollowingFeed } from '../feeds/FollowingFeed';
const state = vi.hoisted(() => ({ user: { id: 1, name: '다우' }, getFollowing: vi.fn() }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('../../lib/api', () => ({ followsApi: { getFollowing: state.getFollowing } }));
describe('FollowingFeed request contract', () => {
  it('shows a retry on malformed success and accepts a valid empty response', async () => {
    state.getFollowing.mockResolvedValueOnce({ users: [] }).mockResolvedValueOnce([]);
    render(<MemoryRouter><FollowingFeed notes={[]} isLoading={false} isLoggedIn authLoading={false} /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('구독한 다우 목록을 불러오지 못했습니다.');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(state.getFollowing).toHaveBeenCalledTimes(2);
  });
});
