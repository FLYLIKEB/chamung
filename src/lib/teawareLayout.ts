import type { TeawareKind } from '../types';

export const TEAWARE_MAT = '/teaware/bamboo-weave.png';
export interface TeawarePlacement { index: number; center: number; width: number; imageWidth: number }
export interface TeawareRow { items: TeawarePlacement[] }
const brewKinds = new Set<TeawareKind>(['gaiwan', 'yixing', 'teapot']);

/** Coordinates are proportions of the mat width, shared by the UI and PNG. */
export function arrangeTeaware(items: ReadonlyArray<{ kind: TeawareKind }>): TeawareRow[] {
  const indexed = items.map((item, index) => ({ ...item, index }));
  const kettles = indexed.filter(item => item.kind === 'kettle');
  const brewers = indexed.filter(item => brewKinds.has(item.kind));
  const pitchers = indexed.filter(item => item.kind === 'pitcher');
  const middle = indexed.filter(item => !brewKinds.has(item.kind) && !['kettle', 'pitcher', 'cup'].includes(item.kind));
  const cups = indexed.filter(item => item.kind === 'cup');
  const rows: TeawareRow[] = [];
  const add = (row: typeof indexed, stagger = false) => {
    if (!row.length) return;
    const pair = row[0]?.kind === 'kettle' && brewKinds.has(row[1]?.kind) ? [0.19, 0.55] : brewKinds.has(row[0]?.kind) && row[1]?.kind === 'pitcher' ? [0.45, 0.81] : stagger ? [0.33, 0.73] : [0.27, 0.73];
    const centers = row.length === 1 ? [0.5] : row.length === 2 ? pair : [0.17, 0.5, 0.83];
    rows.push({ items: row.map((item, position) => ({
      index: item.index, center: centers[position], width: row.length === 3 ? 0.28 : 0.32,
      imageWidth: item.kind === 'cup' || item.kind === 'strainer' || item.kind === 'accessory' ? 0.18 : item.kind === 'kettle' || item.kind === 'tray' ? 0.28 : 0.24,
    })) });
  };
  while (kettles.length || brewers.length || pitchers.length) {
    const row = [];
    if (kettles.length) row.push(kettles.shift()!);
    while (brewers.length && row.length < (pitchers.length ? 2 : 3)) row.push(brewers.shift()!);
    if (pitchers.length && row.length < 3) row.push(pitchers.shift()!);
    while (row.length < 3 && (kettles.length || pitchers.length)) row.push((kettles.length ? kettles : pitchers).shift()!);
    add(row);
  }
  for (let index = 0; index < middle.length; index += 3) add(middle.slice(index, index + 3), true);
  for (let index = 0; index < cups.length; index += 3) add(cups.slice(index, index + 3));
  return rows;
}
