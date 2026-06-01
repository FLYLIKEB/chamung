import type { KeyboardEvent } from 'react';
import type { FlavorTagGroup } from '../../constants/flavorTags';
import {
  FLAVOR_WHEEL_CATEGORY_COLORS,
  FLAVOR_WHEEL_CATEGORY_EMOJIS,
  FLAVOR_WHEEL_CATEGORY_LABELS_KO,
  FLAVOR_WHEEL_CATEGORY_MAP,
  FLAVOR_WHEEL_GROUP_COLORS,
} from './flavorWheelConfig';

interface FlavorWheelProps {
  activeGroup: FlavorTagGroup | null;
  activeCategory: string | null;
  onGroupClick: (group: FlavorTagGroup) => void;
  onCategoryClick: (category: string) => void;
  selectedTags: string[];
}

export function FlavorWheel({
  activeGroup,
  activeCategory,
  onGroupClick,
  onCategoryClick,
  selectedTags,
}: FlavorWheelProps) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 90;
  const innerR = 36;
  const rimInner = outerR;
  const rimOuter = outerR + 22;
  const groups: FlavorTagGroup[] = ['aroma', 'taste', 'mouthfeel', 'finish'];

  function polarToXY(angleDeg: number, r: number) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function sectorPath(startDeg: number, endDeg: number, inner: number, outer: number) {
    const s1 = polarToXY(startDeg, outer);
    const e1 = polarToXY(endDeg, outer);
    const s2 = polarToXY(endDeg, inner);
    const e2 = polarToXY(startDeg, inner);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${outer} ${outer} 0 ${large} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${inner} ${inner} 0 ${large} 0 ${e2.x} ${e2.y}`,
      'Z',
    ].join(' ');
  }

  function handleCategoryKeyDown(event: KeyboardEvent<SVGGElement>, category: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onCategoryClick(category);
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block" aria-label="풍미 휠">
      {groups.map((group, gi) => {
        const startDeg = gi * 90;
        const endDeg = startDeg + 90;
        const categories = FLAVOR_WHEEL_CATEGORY_MAP[group];
        const categorySlice = 90 / categories.length;
        const isGroupActive = activeGroup === group;
        const groupColor = FLAVOR_WHEEL_GROUP_COLORS[group];

        return (
          <g key={group}>
            {categories.map((category, ci) => {
              const categoryStart = startDeg + ci * categorySlice;
              const categoryEnd = categoryStart + categorySlice;
              const hex = FLAVOR_WHEEL_CATEGORY_COLORS[category] ?? groupColor.fill;
              const isCategoryActive = activeCategory === category;
              const midDeg = categoryStart + categorySlice / 2;
              const emojiPos = polarToXY(midDeg, (rimInner + rimOuter) / 2);
              const emoji = FLAVOR_WHEEL_CATEGORY_EMOJIS[category] ?? '•';

              return (
                <g
                  key={category}
                  role="button"
                  tabIndex={0}
                  aria-label={`${FLAVOR_WHEEL_CATEGORY_LABELS_KO[category] ?? category} 향미 카테고리 보기`}
                  className="cursor-pointer"
                  onClick={() => onCategoryClick(category)}
                  onKeyDown={(event) => handleCategoryKeyDown(event, category)}
                >
                  <path
                    d={sectorPath(categoryStart, categoryEnd, rimInner, rimOuter)}
                    fill={hex}
                    stroke="#e5e7eb"
                    strokeWidth="0.55"
                    strokeOpacity="0.32"
                    opacity={isCategoryActive ? 1 : isGroupActive ? 0.85 : 0.55}
                  />
                  {isCategoryActive && (
                    <path
                      d={sectorPath(categoryStart, categoryEnd, rimInner, rimOuter)}
                      fill="none"
                      stroke="#374151"
                      strokeWidth="2"
                      opacity={0.5}
                      pointerEvents="none"
                    />
                  )}
                  <text
                    x={emojiPos.x}
                    y={emojiPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    className="select-none pointer-events-none"
                  >
                    {emoji}
                  </text>
                </g>
              );
            })}

            <path
              d={sectorPath(startDeg, endDeg, innerR, outerR)}
              fill={groupColor.fill}
              stroke="#e5e7eb"
              strokeWidth="0.8"
              strokeOpacity="0.45"
              opacity={isGroupActive ? 1 : 0.72}
              className="cursor-pointer transition-opacity"
              onClick={() => onGroupClick(group)}
            />
            {isGroupActive && (
              <path
                d={sectorPath(startDeg, endDeg, innerR, outerR)}
                fill="none"
                stroke={groupColor.text}
                strokeWidth="2.5"
                opacity={0.5}
                pointerEvents="none"
              />
            )}
            {(() => {
              const pos = polarToXY(startDeg + 45, (innerR + outerR) / 2);
              return (
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight={isGroupActive ? '700' : '600'}
                  fill={groupColor.text}
                  className="select-none pointer-events-none"
                >
                  {groupColor.label}
                </text>
              );
            })()}
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={innerR} fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600">풍미</text>
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize="9" fill="#9ca3af">Flavor</text>
      {selectedTags.length > 0 && (
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="9" fill="#6b7280">{selectedTags.length}개 선택</text>
      )}
    </svg>
  );
}
