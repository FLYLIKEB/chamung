export const TEAWARE_NAMES = {
  gaiwan: '개완',
  yixing: '자사호',
  cup: '찻잔',
  pitcher: '공도배',
  kettle: '탕관',
  strainer: '거름망',
} as const;
export type TeawareKind = keyof typeof TEAWARE_NAMES;
export const TEAWARE_KINDS = Object.keys(TEAWARE_NAMES);
export interface TeawareSnapshot {
  id?: number;
  kind: TeawareKind;
  name: string;
  imageUrl?: string;
}
