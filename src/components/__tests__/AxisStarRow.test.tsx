import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AxisStarRow } from '../AxisStarRow';

describe('AxisStarRow', () => {
  it('maps the midpoint to half of the maximum, matching the filled blocks', () => {
    const onChange = vi.fn();
    render(<AxisStarRow label="밀도" value={2.5} onChange={onChange} />);
    const slider = screen.getByRole('slider', { name: '밀도 평점' });
    vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue({ left: 100, width: 200 } as DOMRect);
    const event = new MouseEvent('pointerdown', { bubbles: true, clientX: 200 });
    fireEvent(slider, event);
    expect(onChange).toHaveBeenCalledWith(2.5);
    expect(slider.querySelectorAll('[data-filled="true"]')).toHaveLength(5);
  });

  it('clamps pointer input to the supported minimum and maximum', () => {
    const onChange = vi.fn();
    render(<AxisStarRow label="밀도" value={2.5} minValue={1} maxValue={5} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue({ left: 100, width: 200 } as DOMRect);
    fireEvent(slider, new MouseEvent('pointerdown', { bubbles: true, clientX: 0 }));
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent(slider, new MouseEvent('pointerdown', { bubbles: true, clientX: 400 }));
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('preserves half-point keyboard steps and Home/End bounds', () => {
    const onChange = vi.fn();
    render(<AxisStarRow label="밀도" value={3} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(3.5);
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(slider, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});
