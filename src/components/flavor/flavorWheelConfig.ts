import {
  FLAVOR_TAG_GROUP_ORDER,
  type FlavorTagGroup,
} from '../../constants/flavorTags';

export const FLAVOR_WHEEL_GROUP_COLORS: Record<FlavorTagGroup, { fill: string; text: string; label: string; labelEn: string }> = {
  aroma:     { fill: '#fce7f3', text: '#9d174d', label: '향', labelEn: 'Aroma' },
  taste:     { fill: '#fef3c7', text: '#92400e', label: '맛', labelEn: 'Taste' },
  mouthfeel: { fill: '#e0f2fe', text: '#075985', label: '질감', labelEn: 'Mouthfeel' },
  finish:    { fill: '#ede9fe', text: '#5b21b6', label: '여운', labelEn: 'Finish' },
};

export const FLAVOR_WHEEL_CATEGORY_COLORS: Record<string, string> = {
  vegetal:   '#bbf7d0', floral:    '#fbcfe8', fruity:    '#fed7aa',
  sweet:     '#fef08a', roasted:   '#fde68a', spicy:     '#fecaca',
  earthy:    '#d9f99d', cooling:   '#99f6e4', basic:     '#fde68a',
  direction: '#fed7aa', defect:    '#fecdd3', body:      '#bae6fd',
  texture:   '#bfdbfe', sensation: '#c7d2fe', length:    '#ddd6fe',
  character: '#e9d5ff',
};

export const FLAVOR_WHEEL_CATEGORY_LABELS_KO: Record<string, string> = {
  vegetal:   '식물',   floral:    '꽃',    fruity:    '과일',
  sweet:     '달콤',   roasted:   '볶음',  spicy:     '향신',
  earthy:    '흙/발효', cooling:   '청량',  basic:     '기본맛',
  direction: '맛방향', defect:    '결점',  body:      '바디',
  texture:   '질감',   sensation: '감각',  length:    '길이',
  character: '성격',
};

export const FLAVOR_WHEEL_CATEGORY_MAP: Record<FlavorTagGroup, string[]> = {
  aroma:     ['vegetal', 'floral', 'fruity', 'sweet', 'roasted', 'spicy', 'earthy', 'cooling'],
  taste:     ['basic', 'direction', 'defect'],
  mouthfeel: ['body', 'texture', 'sensation'],
  finish:    ['length', 'character'],
};

export const FLAVOR_WHEEL_CATEGORY_TO_GROUP = Object.fromEntries(
  FLAVOR_TAG_GROUP_ORDER.flatMap((group) => FLAVOR_WHEEL_CATEGORY_MAP[group].map((category) => [category, group])),
) as Record<string, FlavorTagGroup>;

export const FLAVOR_WHEEL_CATEGORY_EMOJIS: Record<string, string> = {
  vegetal:   '🌿', floral:    '🌸', fruity:    '🍊',
  sweet:     '🍯', roasted:   '☕', spicy:     '🌶',
  earthy:    '🪵', cooling:   '❄️', basic:     '👅',
  direction: '🧭', defect:    '⚠️', body:      '💧',
  texture:   '🫧', sensation: '✨', length:    '⏱',
  character: '🎶',
};
