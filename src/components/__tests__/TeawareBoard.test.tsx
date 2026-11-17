import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TeawareBoard } from '../TeawareBoard';

describe('TeawareBoard', () => {
  it('does not add an empty panel to old notes', () => {
    const { container } = render(<TeawareBoard />);
    expect(container).toBeEmptyDOMElement();
  });
  it('places preset and personal tools on one board with their saved names', () => {
    render(<TeawareBoard items={[
      { kind: 'gaiwan', name: '개완' },
      { id: 7, kind: 'cup', name: '백자 찻잔', imageUrl: 'https://example.com/cup.jpg' },
    ]} />);
    const board = screen.getByRole('region', { name: '사용한 다구' });
    expect(within(board).getByText('개완')).toBeInTheDocument();
    expect(within(board).getByText('백자 찻잔')).toBeInTheDocument();
    const images = board.querySelectorAll('img');
    expect(images[0]).toHaveAttribute('src', '/teaware/gaiwan.svg');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/cup.jpg');
    fireEvent.error(images[1]);
    expect(images[1]).toHaveAttribute('src', '/teaware/cup.svg');
    expect(within(board).getByText('사진을 불러오지 못했어요')).toBeInTheDocument();
    expect(images[1].parentElement).toHaveAttribute('data-teaware-image-url', 'https://example.com/cup.jpg');
    expect(within(board).getByText('백자 찻잔')).toBeInTheDocument();
  });
});
