import type { TeawareItem } from '../types';
import { TEAWARE_VARIANTS as catalog } from '../../backend/src/teaware/teaware-presets';

export const TEAWARE_PRESETS: TeawareItem[] = [
  { kind: 'gaiwan', name: '개완' },
  { kind: 'yixing', name: '자사호' },
  { kind: 'teapot', name: '다관' },
  { kind: 'cup', name: '찻잔' },
  { kind: 'pitcher', name: '공도배' },
  { kind: 'kettle', name: '탕관' },
  { kind: 'strainer', name: '거름망' },
  { kind: 'tray', name: '차판' },
  { kind: 'accessory', name: '차도구' },
];
export const TEAWARE_VARIANTS: TeawareItem[] = catalog.map(({ variantId, kind, name }) => ({ variantId, kind, name }));
const images = new Map<string, string>(catalog.map(item => [item.variantId, item.imagePath]));
const defaults = new Map(TEAWARE_PRESETS.map(item => [item.kind, catalog.find(entry => entry.kind === item.kind)!.imagePath]));
export const getTeawareImage = (item: TeawareItem): string => item.imageUrl || (item.variantId && images.get(item.variantId)) || defaults.get(item.kind) || '/teaware/cup.svg';
export const teawareKey = (item: TeawareItem) => item.id ? `custom-${item.id}` : `preset-${item.variantId || item.kind}`;
