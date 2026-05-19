import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ModeCarousel } from '../ModeCarousel';

vi.mock('@/contexts/AppModeContext', () => ({
  useAppMode: () => ({
    sessionMode: { active: false },
    blindMode: { active: false },
    toggleSessionMode: vi.fn(),
    toggleBlindMode: vi.fn(),
  }),
}));

describe('ModeCarousel', () => {
  it('다회 모드 카드가 렌더링된다', () => {
    render(<ModeCarousel />);
    expect(screen.getByText('다회 모드')).toBeInTheDocument();
  });

  it('블라인드 테이스팅 카드가 렌더링된다', () => {
    render(<ModeCarousel />);
    expect(screen.getByText('블라인드 테이스팅')).toBeInTheDocument();
  });

  it('inactive 상태에서 ON 뱃지가 표시되지 않는다', () => {
    render(<ModeCarousel />);
    expect(screen.queryByText('ON')).not.toBeInTheDocument();
  });

  it('하드코딩 hex #1a8a30 이 클래스에 없다', () => {
    const { container } = render(<ModeCarousel />);
    const allClasses = Array.from(container.querySelectorAll('*'))
      .map((el) => el.getAttribute('class') ?? '')
      .join(' ');
    expect(allClasses).not.toContain('#1a8a30');
  });

  it('하드코딩 hex #1db93c 이 클래스에 없다', () => {
    const { container } = render(<ModeCarousel />);
    const allClasses = Array.from(container.querySelectorAll('*'))
      .map((el) => el.getAttribute('class') ?? '')
      .join(' ');
    expect(allClasses).not.toContain('#1db93c');
  });

  it('다회 모드 카드가 무채색 카드 스타일을 유지한다', () => {
    const { container } = render(<ModeCarousel />);
    const buttons = container.querySelectorAll('button');
    const sessionCard = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('다회 모드'),
    );
    expect(sessionCard?.className).toContain('neutral');
    expect(sessionCard?.className).toContain('no-underline');
  });
});
