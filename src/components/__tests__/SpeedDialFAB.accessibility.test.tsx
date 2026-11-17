import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { SpeedDialFAB } from '../SpeedDialFAB';
const toggle = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/AppModeContext', () => ({ useAppMode: () => ({ sessionMode: { active: false }, blindMode: { active: false }, toggleSessionMode: toggle, toggleBlindMode: vi.fn() }) }));
describe('SpeedDialFAB visibility', () => {
  it('unmounts closed actions and exposes truthful actions only when open', () => {
    render(<MemoryRouter><SpeedDialFAB /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: '차록 작성', hidden: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }));
    const mode = screen.getByRole('button', { name: '다회 시작' });
    fireEvent.click(mode);
    expect(toggle).toHaveBeenCalledOnce();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: '차록 작성', hidden: true })).not.toBeInTheDocument();
  });
});
