import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Home } from '../Home';
import { Notifications } from '../Notifications';
import { notificationsApi } from '../../lib/api';
const state = vi.hoisted(() => ({ user: null as null | { id: number; name: string }, getNotes: vi.fn(), getNotifications: vi.fn() }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user, isLoading: false }) }));
vi.mock('../../components/Header', () => ({ Header: () => null }));
vi.mock('../../components/BottomNav', () => ({ BottomNav: () => null }));
vi.mock('../../components/home/ModeCarousel', () => ({ ModeCarousel: () => null }));
vi.mock('../../components/home/WeeklyStreak', () => ({ WeeklyStreak: () => null }));
vi.mock('../../lib/api', () => ({ notesApi: { getAll: state.getNotes }, tagsApi: { getFollowedTags: vi.fn() }, followsApi: { getFollowing: vi.fn().mockResolvedValue([]) }, notificationsApi: { getAll: state.getNotifications, getUnreadCount: vi.fn().mockResolvedValue({ count: 0 }) } }));
const mount = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);
beforeEach(() => { state.user = null; vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 0 }); });
describe('request states', () => {
  it('does not show an empty feed while loading', () => {
    state.getNotes.mockReturnValue(new Promise(() => {}));
    mount(<Home />);
    expect(screen.getByRole('status')).toHaveTextContent('차록을 불러오는 중');
    expect(screen.queryByText(/아직 등록된 차록/)).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '최신' })).toBeInTheDocument();
  });
  it('keeps failure distinct from empty and allows retry', async () => {
    state.getNotes.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    mount(<Home />);
    expect(await screen.findByRole('alert')).toHaveTextContent('차록을 불러오지 못했습니다');
    expect(screen.queryByText(/아직 등록된 차록/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText(/아직 등록된 차록/)).toBeInTheDocument();
    expect(state.getNotes).toHaveBeenCalledTimes(2);
  });
  it('reports malformed feed responses instead of pretending the feed is empty', async () => {
    state.getNotes.mockResolvedValue({ unexpected: true });
    mount(<Home />);
    expect(await screen.findByRole('alert')).toHaveTextContent('차록을 불러오지 못했습니다');
    expect(screen.queryByText(/아직 등록된 차록/)).not.toBeInTheDocument();
  });
  it('advances pagination even when the unread count request fails', async () => {
    state.user = { id: 1, name: '다우' };
    const notification = (id: number) => ({ id, type: 'follow', actorId: id, actor: { name: `다우${id}` }, isRead: true, createdAt: new Date().toISOString() });
    state.getNotifications.mockResolvedValueOnce({ notifications: [notification(1)], total: 3 })
      .mockResolvedValueOnce({ notifications: [notification(2)], total: 3 })
      .mockResolvedValueOnce({ notifications: [notification(3)], total: 3 });
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValueOnce({ count: 0 }).mockRejectedValueOnce(new Error('count offline')).mockResolvedValueOnce({ count: 0 });
    mount(<Notifications />);
    await screen.findByText('다우1님이 나를 구독하기 시작했습니다.');
    fireEvent.click(screen.getByRole('button', { name: '더 보기' }));
    await screen.findByText('다우2님이 나를 구독하기 시작했습니다.');
    await waitFor(() => expect(screen.getByRole('button', { name: '더 보기' })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: '더 보기' }));
    await screen.findByText('다우3님이 나를 구독하기 시작했습니다.');
    expect(state.getNotifications.mock.calls.map(([page]) => page)).toEqual([1, 2, 3]);
    expect(screen.getAllByText('다우2님이 나를 구독하기 시작했습니다.')).toHaveLength(1);
  });
  it('does not claim there are no notifications after a failed request', async () => {
    state.user = { id: 1, name: '다우' };
    state.getNotifications.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ notifications: [], total: 0 });
    mount(<Notifications />);
    expect(await screen.findByRole('alert')).toHaveTextContent('알림을 불러오지 못했습니다');
    expect(screen.queryByText('새로운 알림이 없습니다.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    await waitFor(() => expect(screen.getByText('새로운 알림이 없습니다.')).toBeInTheDocument());
  });
});
