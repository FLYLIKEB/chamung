import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BottomNav } from '../BottomNav';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));

function renderBottomNav(initialPath = '/') {
  render(<MemoryRouter initialEntries={[initialPath]}><BottomNav /></MemoryRouter>);
  return screen.getAllByRole('navigation').map((nav) => within(nav));
}

describe('BottomNav', () => {
  beforeEach(() => vi.clearAllMocks());

  it('모바일과 데스크톱 메뉴에 홈·차담·찻장·내 차록을 제공한다', () => {
    const menus = renderBottomNav();
    expect(menus).toHaveLength(2);
    for (const menu of menus) {
      for (const label of ['홈', '차담', '찻장', '내 차록']) {
        expect(menu.getByRole('button', { name: label })).toBeInTheDocument();
      }
    }
    expect(screen.queryByRole('button', { name: '더보기' })).not.toBeInTheDocument();
  });

  it('현재 홈을 누르면 중복 탐색하지 않는다', () => {
    const [menu] = renderBottomNav('/');
    fireEvent.click(menu.getByRole('button', { name: '홈' }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it.each([['차담', '/chadam'], ['내 차록', '/my-notes'], ['찻장', '/cellar']])(
    '%s 버튼은 %s로 이동한다', (label, route) => {
      const menus = renderBottomNav('/');
      for (const menu of menus) fireEvent.click(menu.getByRole('button', { name: label }));
      expect(mockNavigate).toHaveBeenCalledTimes(2);
      expect(mockNavigate).toHaveBeenLastCalledWith(route);
    },
  );

  it('/chadam 상세 경로에서도 차담을 현재 메뉴로 표시한다', () => {
    for (const menu of renderBottomNav('/chadam/12')) {
      expect(menu.getByRole('button', { name: '차담' })).toHaveAttribute('aria-current', 'page');
      expect(menu.getByRole('button', { name: '홈' })).not.toHaveAttribute('aria-current');
    }
  });

  it('/my-notes 경로에서 내 차록을 강조한다', () => {
    for (const menu of renderBottomNav('/my-notes')) {
      expect(menu.getByRole('button', { name: '내 차록' })).toHaveClass('text-primary');
    }
  });
});
