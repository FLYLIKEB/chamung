import type { TeawareItem } from '../types';

export const TEAWARE_PRESETS: TeawareItem[] = [
  { kind: 'gaiwan', name: '개완' },
  { kind: 'yixing', name: '자사호' },
  { kind: 'cup', name: '찻잔' },
  { kind: 'pitcher', name: '공도배' },
  { kind: 'kettle', name: '탕관' },
  { kind: 'strainer', name: '거름망' },
];

export const getTeawareImage = (item: TeawareItem) => item.imageUrl || `/teaware/${item.kind}.svg`;
export const teawareKey = (item: TeawareItem) => item.id ? `custom-${item.id}` : `preset-${item.kind}`;
