import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from '../Header';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock('../../hooks/useNotificationCount', () => ({ useNotificationCount: () => 3 }));
vi.mock('../ChaLogLogo', () => ({ ChaLogLogo: () => <span>차멍</span> }));

beforeEach(() => navigate.mockClear());

describe('Header navigation', () => {
  it('keeps navigation available after scrolling', () => {
    render(<main><Header showBack showProfile title="차록" /></main>);
    const main = screen.getByRole('main');
    Object.defineProperty(main, 'scrollTop', { configurable: true, value: 300 });
    fireEvent.scroll(main);
    expect(screen.getByRole('button', { name: '뒤로' })).toBeVisible();
    expect(screen.getByRole('button', { name: '탐색' })).toBeVisible();
    expect(screen.getByRole('button', { name: '알림' })).toBeVisible();
    expect(screen.getByRole('button', { name: '설정' })).toBeVisible();
  });
  it('shows the page title alongside an optional home logo', () => {
    render(<Header showBack showLogo showProfile title="대홍포 요약" />);
    expect(screen.getByRole('heading', { level: 1, name: '대홍포 요약' })).toBeVisible();
    const homeLink = screen.getByRole('button', { name: '차멍 홈으로' });
    expect(homeLink).toBeVisible();
    fireEvent.click(homeLink);
    expect(navigate).toHaveBeenCalledWith('/');
  });
  it('preserves custom back and route actions', () => {
    const onBack = vi.fn();
    render(<Header showBack showProfile title="차록" onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }));
    fireEvent.click(screen.getByRole('button', { name: '탐색' }));
    fireEvent.click(screen.getByRole('button', { name: '알림' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(navigate.mock.calls).toEqual([['/sasaek'], ['/notifications']]);
  });
});
