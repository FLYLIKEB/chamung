import { describe, expect, it } from 'vitest';
import { arrangeTeaware } from '../teawareLayout';
import type { TeawareKind } from '../../types';

describe('teaware placement', () => {
  it('places cups forward and brewing vessel between kettle and pitcher regardless of selection order', () => {
    const rows = arrangeTeaware([{ kind: 'cup' }, { kind: 'pitcher' }, { kind: 'gaiwan' }, { kind: 'kettle' }, { kind: 'strainer' }]);
    expect(rows[0].items.map(item => item.index)).toEqual([3, 2, 1]);
    expect(rows.at(-1)?.items.map(item => item.index)).toEqual([0]);
  });
  it.each(['cup', 'kettle', 'gaiwan', 'accessory'] as TeawareKind[])('fits twelve %s tools without horizontal overlap or loss', kind => {
    const rows = arrangeTeaware(Array.from({ length: 12 }, () => ({ kind })));
    expect(rows.flatMap(row => row.items)).toHaveLength(12);
    expect(rows).toHaveLength(4);
    rows.forEach(row => row.items.forEach((item, index) => {
      expect(item.center - item.width / 2).toBeGreaterThanOrEqual(0);
      expect(item.center + item.width / 2).toBeLessThanOrEqual(1);
      if (index) {
        const previous = row.items[index - 1];
        expect(previous.center + previous.width / 2).toBeLessThanOrEqual(item.center - item.width / 2);
      }
    }));
  });
});
