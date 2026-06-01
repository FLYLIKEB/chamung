import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../ui/utils';
import {
  FLAVOR_TAG_GROUP_META,
  getFlavorTagColor,
  groupFlavorTagLabels,
  type FlavorTagDisplayItem,
  type FlavorTagGroup,
} from '../../constants/flavorTags';
import {
  FLAVOR_WHEEL_CATEGORY_COLORS,
  FLAVOR_WHEEL_CATEGORY_LABELS_KO,
  FLAVOR_WHEEL_CATEGORY_MAP,
  FLAVOR_WHEEL_GROUP_COLORS,
} from './flavorWheelConfig';

interface FlavorProfileCardProps {
  tags: readonly string[];
  linked?: boolean;
  className?: string;
  showHeader?: boolean;
}

type PositionedTag = FlavorTagDisplayItem & {
  category: string;
  group: FlavorTagGroup | 'custom';
  x: number;
  y: number;
  angle: number;
  compact: boolean;
  leaderStart?: { x: number; y: number };
};

const GROUPS: FlavorTagGroup[] = ['aroma', 'taste', 'mouthfeel', 'finish'];

function groupItemsByCategory(items: FlavorTagDisplayItem[]) {
  const grouped = new Map<string, FlavorTagDisplayItem[]>();

  items.forEach((item) => {
    const category = item.definition?.category ?? 'custom';
    const categoryItems = grouped.get(category) ?? [];
    categoryItems.push(item);
    grouped.set(category, categoryItems);
  });

  return grouped;
}

function polarToXY(cx: number, cy: number, angleDeg: number, r: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(cx: number, cy: number, startDeg: number, endDeg: number, inner: number, outer: number) {
  const s1 = polarToXY(cx, cy, startDeg, outer);
  const e1 = polarToXY(cx, cy, endDeg, outer);
  const s2 = polarToXY(cx, cy, endDeg, inner);
  const e2 = polarToXY(cx, cy, startDeg, inner);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${outer} ${outer} 0 ${large} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ');
}

function getContrastTextColor(hex: string) {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.72 ? '#111827' : '#ffffff';
}

function tagCategory(item: FlavorTagDisplayItem) {
  return item.definition?.category ?? 'custom';
}

function getRingRadii(itemCount: number) {
  if (itemCount > 18) return [58, 74, 90, 106];
  if (itemCount > 9) return [64, 84, 104];
  if (itemCount > 4) return [68, 94];
  return [78];
}

function buildPositionedTags(tags: readonly string[], cx: number, cy: number) {
  const groupedSummaries = groupFlavorTagLabels(tags);
  const positioned: PositionedTag[] = [];
  const customItems: FlavorTagDisplayItem[] = [];

  groupedSummaries.forEach((summary) => {
    const byCategory = groupItemsByCategory(summary.tags);

    if (summary.group === 'custom') {
      customItems.push(...(byCategory.get('custom') ?? []));
      return;
    }

    const groupIndex = GROUPS.indexOf(summary.group);
    const groupStart = groupIndex * 90;
    const categories = FLAVOR_WHEEL_CATEGORY_MAP[summary.group];
    const categoryOrder = new Map(categories.map((category, index) => [category, index]));
    const groupItems = summary.tags
      .filter((item) => item.definition)
      .sort((a, b) => {
        const aOrder = categoryOrder.get(tagCategory(a)) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = categoryOrder.get(tagCategory(b)) ?? Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      });

    const ringRadii = getRingRadii(groupItems.length);
    const columns = Math.max(1, Math.ceil(groupItems.length / ringRadii.length));
    const anglePadding = groupItems.length > 12 ? 5 : 8;
    const angleStep = columns === 1 ? 0 : (90 - anglePadding * 2) / (columns - 1);

    groupItems.forEach((item, itemIndex) => {
      const column = Math.floor(itemIndex / ringRadii.length);
      const ringIndex = itemIndex % ringRadii.length;
      const baseAngle = groupStart + anglePadding + (columns === 1 ? 45 : column * angleStep);
      const laneNudge = (ringIndex - (ringRadii.length - 1) / 2) * 1.8;
      const angle = Math.min(groupStart + 88, Math.max(groupStart + 2, baseAngle + laneNudge));
      const radius = ringRadii[ringIndex];
      const pos = polarToXY(cx, cy, angle, radius);
      const leaderStart = polarToXY(cx, cy, angle, 114);

      positioned.push({
        ...item,
        category: tagCategory(item),
        group: summary.group,
        x: pos.x,
        y: pos.y,
        angle,
        compact: groupItems.length > 9,
        leaderStart,
      });
    });
  });

  const customColumns = customItems.length > 6 ? 4 : 3;
  const customGap = 64;
  const startX = cx - ((customColumns - 1) * customGap) / 2;

  customItems.forEach((item, index) => {
    const column = index % customColumns;
    const row = Math.floor(index / customColumns);
    positioned.push({
      ...item,
      category: 'custom',
      group: 'custom',
      x: startX + column * customGap,
      y: cy + 152 + row * 24,
      angle: 180,
      compact: customItems.length > 6,
    });
  });

  return positioned;
}

function getTagPillColors(item: FlavorTagDisplayItem) {
  const category = tagCategory(item);
  if (category === 'custom') {
    return { backgroundColor: '#e5e7eb', color: '#4b5563' };
  }

  const color = FLAVOR_WHEEL_CATEGORY_COLORS[category] ?? getFlavorTagColor(item.definition).dot;

  return {
    backgroundColor: color,
    color: getContrastTextColor(color) === '#111827' ? '#4b5563' : 'rgba(255,255,255,0.82)',
  };
}

function FlavorTagPill({
  item,
  linked,
  compact = false,
  className,
  style,
}: {
  item: FlavorTagDisplayItem;
  linked: boolean;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const description = item.definition?.descriptionKo ?? FLAVOR_TAG_GROUP_META.custom.descriptionKo;
  const label = item.label;
  const width = Math.max(34, label.length * (compact ? 9 : 11) + 14);
  const colorStyle = getTagPillColors(item);
  const commonProps = {
    className: cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-full px-1.5 py-0.5 font-[Pretendard] font-semibold leading-none shadow-md ring-1 ring-white/70 transition-transform hover:z-10 hover:scale-105',
      compact ? 'text-[9px]' : 'text-[10px]',
      className,
    ),
    style: {
      minWidth: `${width}px`,
      ...colorStyle,
      ...style,
    },
    title: `${item.label}: ${description}`,
    'aria-label': item.definition ? `${item.label}: ${description}` : `${item.label}: 직접 입력한 향미`,
  } as const;

  if (!linked) {
    return <span {...commonProps}>{label}</span>;
  }

  return <Link to={`/tag/${encodeURIComponent(item.label)}`} {...commonProps}>{label}</Link>;
}

function WheelTag({ item, linked }: { item: PositionedTag; linked: boolean }) {
  return (
    <FlavorTagPill
      item={item}
      linked={linked}
      compact={item.compact}
      className="absolute -translate-x-1/2 -translate-y-1/2 backdrop-blur-[1px]"
      style={{ left: `${item.x}px`, top: `${item.y}px` }}
    />
  );
}

function FlavorWheelInfographic({ tags, linked }: { tags: readonly string[]; linked: boolean }) {
  const size = 280;
  const cx = size / 2;
  const cy = 128;
  const innerR = 34;
  const midR = 88;
  const outerR = 116;
  const positionedTags = buildPositionedTags(tags, cx, cy);
  const activeCategories = new Set(positionedTags.map((item) => item.category));
  const activeGroups = new Set(positionedTags.map((item) => item.group));
  const showCategoryLabels = tags.length <= 14;

  const wheelHeight = Math.max(286, Math.ceil(Math.max(...positionedTags.map((item) => item.y), cy + 116) + 18));

  return (
    <div
      className="relative mx-auto w-[280px]"
      style={{ height: `${wheelHeight}px` }}
      aria-label="선택 향미 원형 인포그래픽"
    >
      <svg width={size} height={260} viewBox={`0 0 ${size} 260`} className="absolute inset-x-0 top-0" aria-hidden="true">
        {GROUPS.map((group, groupIndex) => {
          const startDeg = groupIndex * 90;
          const endDeg = startDeg + 90;
          const categories = FLAVOR_WHEEL_CATEGORY_MAP[group];
          const categorySlice = 90 / categories.length;
          const groupColor = FLAVOR_WHEEL_GROUP_COLORS[group];
          const groupLabelPos = polarToXY(cx, cy, startDeg + 45, 50);
          const groupActive = activeGroups.has(group);

          return (
            <g key={group}>
              <path
                d={sectorPath(cx, cy, startDeg, endDeg, innerR, midR)}
                fill={groupColor.fill}
                stroke="#e5e7eb"
                strokeWidth="0.8"
                strokeOpacity="0.45"
                opacity={groupActive ? 0.48 : 0.22}
              />
              {categories.map((category, categoryIndex) => {
                const categoryStart = startDeg + categoryIndex * categorySlice;
                const categoryEnd = categoryStart + categorySlice;
                const categoryActive = activeCategories.has(category);
                const labelPos = polarToXY(cx, cy, categoryStart + categorySlice / 2, 104);

                return (
                  <g key={category}>
                    <path
                      d={sectorPath(cx, cy, categoryStart, categoryEnd, midR, outerR)}
                      fill={FLAVOR_WHEEL_CATEGORY_COLORS[category] ?? groupColor.fill}
                      stroke="#e5e7eb"
                      strokeWidth="0.55"
                      strokeOpacity="0.32"
                      opacity={categoryActive ? 0.42 : 0.12}
                    />
                    {categoryActive && showCategoryLabels && (
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="7"
                        fontWeight="600"
                        fill="#4b5563"
                        opacity="0.68"
                      >
                        {FLAVOR_WHEEL_CATEGORY_LABELS_KO[category] ?? category}
                      </text>
                    )}
                  </g>
                );
              })}
              <text
                x={groupLabelPos.x}
                y={groupLabelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="600"
                fill={groupColor.text}
                opacity={groupActive ? 0.58 : 0.28}
              >
                {groupColor.label}
              </text>
            </g>
          );
        })}
        {positionedTags.map((item) => item.leaderStart && (
          <line
            key={`leader-${item.label}-${item.category}`}
            x1={item.leaderStart.x}
            y1={item.leaderStart.y}
            x2={item.x}
            y2={item.y}
            stroke="#9ca3af"
            strokeWidth="0.7"
            strokeDasharray="2 2"
            opacity="0.24"
          />
        ))}
        <circle cx={cx} cy={cy} r={innerR} fill="white" stroke="#e5e7eb" strokeWidth="1" opacity="0.72" />
        <text x={cx} y={cy - 7} textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600" opacity="0.72">향미</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="9" fill="#94a3b8">Profile</text>
      </svg>

      {positionedTags.map((item) => (
        <WheelTag key={`${item.label}-${item.category}`} item={item} linked={linked} />
      ))}
    </div>
  );
}

function LegendPill({ item, linked }: { item: FlavorTagDisplayItem; linked: boolean }) {
  return <FlavorTagPill item={item} linked={linked} compact />;
}

export function FlavorProfileCard({ tags, linked = true, className, showHeader = true }: FlavorProfileCardProps) {
  const groups = groupFlavorTagLabels(tags);
  const [isTagListExpanded, setIsTagListExpanded] = useState(false);

  if (groups.length === 0) return null;

  return (
    <section
      className={cn('rounded-2xl border border-border/70 bg-card/75 p-3 shadow-sm', className)}
      aria-label="향미 프로필 카드"
    >
      {showHeader && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-muted-foreground">PROFILE</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">향미 프로필</p>
          </div>
          <span className="shrink-0 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {tags.length} tags
          </span>
        </div>
      )}

      <FlavorWheelInfographic tags={tags} linked={linked} />

      <div className="mt-2 rounded-xl border border-border/50 bg-background/45 p-2" aria-label="향미 스키마 그룹">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={isTagListExpanded}
          aria-controls="flavor-tag-list"
          onClick={() => setIsTagListExpanded((value) => !value)}
        >
          <span className="min-w-0 text-[10px] font-semibold text-foreground">
            선택 태그 전체
            <span className="ml-1 font-normal text-muted-foreground">Flavor tags</span>
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {tags.length}개 {isTagListExpanded ? '접기' : '펼치기'}
          </span>
        </button>

        {isTagListExpanded && (
          <div id="flavor-tag-list" className="mt-2 space-y-2">
            {groups.map((group) => {
              const dotColor = group.group === 'custom' ? '#6b7280' : FLAVOR_WHEEL_GROUP_COLORS[group.group].text;

              return (
                <div key={group.group}>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
                    <span className="font-[Pretendard] text-[10px] font-semibold text-foreground">
                      {group.meta.labelKo}
                      <span className="ml-1 font-normal text-muted-foreground">{group.meta.labelEn}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.tags.map((item) => (
                      <LegendPill key={item.label} item={item} linked={linked} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
