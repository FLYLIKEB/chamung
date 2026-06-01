import React, { useState, useRef, useMemo } from 'react';
import { Info, X } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { cn } from './ui/utils';
import {
  FLAVOR_CATEGORY_COLORS,
  FLAVOR_TAG_GROUP_META,
  FLAVOR_TAG_GROUP_ORDER,
  FLAVOR_TAGS,
  getFlavorTagColor,
  type FlavorTagDefinition,
  type FlavorTagGroup,
} from '../constants/flavorTags';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

// 풍미룬 섹터 색상 (SVG fill용 hex)
const GROUP_COLORS: Record<FlavorTagGroup, { fill: string; text: string; label: string; labelEn: string }> = {
  aroma:    { fill: '#fce7f3', text: '#9d174d', label: '향',  labelEn: 'Aroma'    },
  taste:    { fill: '#fef3c7', text: '#92400e', label: '맛',  labelEn: 'Taste'    },
  mouthfeel:{ fill: '#e0f2fe', text: '#075985', label: '질감', labelEn: 'Mouthfeel'},
  finish:   { fill: '#ede9fe', text: '#5b21b6', label: '여운', labelEn: 'Finish'  },
};

const CATEGORY_COLORS_HEX: Record<string, string> = {
  vegetal:   '#bbf7d0', floral:    '#fbcfe8', fruity:    '#fed7aa',
  sweet:     '#fef08a', roasted:   '#fde68a', spicy:     '#fecaca',
  earthy:    '#d9f99d', cooling:   '#99f6e4', basic:     '#fde68a',
  direction: '#fed7aa', defect:    '#fecdd3', body:      '#bae6fd',
  texture:   '#bfdbfe', sensation: '#c7d2fe', length:    '#ddd6fe',
  character: '#e9d5ff',
};

function TagTooltip({ description }: { description: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        aria-label="향미 설명 보기"
        tabIndex={-1}
      >
        <Info className="h-3 w-3" />
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 w-48 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-[11px] leading-relaxed text-popover-foreground shadow-md pointer-events-none">
          {description}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border" />
        </span>
      )}
    </span>
  );
}

// SVG 플레이버 휠 컴포넌트
function FlavorWheel({
  activeGroup,
  onGroupClick,
  selectedTags,
}: {
  activeGroup: FlavorTagGroup | null;
  onGroupClick: (group: FlavorTagGroup) => void;
  selectedTags: string[];
}) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 96;
  const innerR = 36;

  // 4분면: 상단부터 시계방향 aroma, taste, mouthfeel, finish
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

  // 카테고리별 서브 섹터 (그룹 내 분할)
  const categoryMap: Record<FlavorTagGroup, string[]> = {
    aroma:     ['vegetal', 'floral', 'fruity', 'sweet', 'roasted', 'spicy', 'earthy', 'cooling'],
    taste:     ['basic', 'direction', 'defect'],
    mouthfeel: ['body', 'texture', 'sensation'],
    finish:    ['length', 'character'],
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto block"
      aria-label="풍미 휠"
    >
      {groups.map((group, gi) => {
        const startDeg = gi * 90;
        const endDeg = startDeg + 90;
        const cats = categoryMap[group];
        const catSlice = 90 / cats.length;
        const isActive = activeGroup === group;
        const gc = GROUP_COLORS[group];

        return (
          <g key={group}>
            {/* 서브 카테고리 링 (바깥) */}
            {cats.map((cat, ci) => {
              const cs = startDeg + ci * catSlice;
              const ce = cs + catSlice;
              const hex = CATEGORY_COLORS_HEX[cat] ?? gc.fill;
              return (
                <path
                  key={cat}
                  d={sectorPath(cs, ce, outerR, outerR + 16)}
                  fill={hex}
                  stroke="white"
                  strokeWidth="1.5"
                  opacity={isActive ? 1 : 0.7}
                />
              );
            })}

            {/* 메인 섹터 (도넛) */}
            <path
              d={sectorPath(startDeg, endDeg, innerR, outerR)}
              fill={gc.fill}
              stroke="white"
              strokeWidth="2"
              opacity={isActive ? 1 : 0.75}
              className="cursor-pointer transition-opacity"
              onClick={() => onGroupClick(group)}
            />

            {/* 활성 표시 링 */}
            {isActive && (
              <path
                d={sectorPath(startDeg, endDeg, innerR, outerR)}
                fill="none"
                stroke={gc.text}
                strokeWidth="2.5"
                opacity={0.6}
                pointerEvents="none"
              />
            )}

            {/* 그룹 레이블 */}
            {(() => {
              const midDeg = startDeg + 45;
              const midR = (innerR + outerR) / 2;
              const pos = polarToXY(midDeg, midR);
              return (
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight={isActive ? '700' : '600'}
                  fill={gc.text}
                  className="cursor-pointer select-none pointer-events-none"
                >
                  {gc.label}
                </text>
              );
            })()}
          </g>
        );
      })}

      {/* 중앙 원 */}
      <circle cx={cx} cy={cy} r={innerR} fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600">풍미</text>
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize="9" fill="#9ca3af">Flavor</text>

      {/* 선택 수 표시 */}
      {selectedTags.length > 0 && (
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="9" fill="#6b7280">
          {selectedTags.length}개 선택
        </text>
      )}
    </svg>
  );
}

export function TagInput({ tags, onChange, maxTags = 10 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [activeGroup, setActiveGroup] = useState<FlavorTagGroup | null>('aroma');
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearching = inputValue.trim().length > 0;

  const filteredSuggestions = useMemo(() => {
    const normalizedInput = inputValue.trim().replace(/\s+/g, '').toLowerCase();
    return FLAVOR_TAGS.filter((tag) => {
      if (tags.includes(tag.tagKo)) return false;
      if (!normalizedInput) return true;
      const searchable = [tag.tagKo, tag.tagEn, tag.category, tag.descriptionKo]
        .join(' ').replace(/\s+/g, '').toLowerCase();
      return searchable.includes(normalizedInput);
    });
  }, [inputValue, tags]);

  // 활성 그룹 태그 (검색 중이면 전체, 아니면 선택 그룹)
  const displayTags = useMemo(() => {
    if (isSearching) return filteredSuggestions;
    if (!activeGroup) return [];
    return filteredSuggestions.filter((t) => t.group === activeGroup);
  }, [filteredSuggestions, activeGroup, isSearching]);

  // 카테고리별로 묶기
  const displayByCategory = useMemo(() => {
    const map = new Map<string, FlavorTagDefinition[]>();
    displayTags.forEach((tag) => {
      const list = map.get(tag.category) ?? [];
      list.push(tag);
      map.set(tag.category, list);
    });
    return Array.from(map.entries());
  }, [displayTags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value);
  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing && e.key === 'Enter') return;
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (isProcessing) return;
      const val = (e.target as HTMLInputElement).value.trim();
      if (val) {
        setIsProcessing(true);
        addTag(val);
        (e.target as HTMLInputElement).value = '';
        setInputValue('');
        setTimeout(() => setIsProcessing(false), 100);
      }
    } else if (e.key === 'Backspace') {
      if (!(e.target as HTMLInputElement).value && tags.length > 0) {
        e.preventDefault();
        removeTag(tags.length - 1);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || tags.includes(t) || tags.length >= maxTags) return;
    onChange([...tags, t]);
    setInputValue('');
    setTimeout(() => { if (inputRef.current) inputRef.current.value = ''; }, 0);
  };

  const removeTag = (index: number) => onChange(tags.filter((_, i) => i !== index));

  const handleGroupClick = (group: FlavorTagGroup) => {
    setActiveGroup((prev) => (prev === group ? null : group));
    setInputValue('');
  };

  const activeGroupMeta = activeGroup ? GROUP_COLORS[activeGroup] : null;

  return (
    <div className="space-y-3">
      <Label>향미</Label>

      {/* 선택된 태그 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => {
            const def = FLAVOR_TAGS.find((t) => t.tagKo === tag);
            const color = getFlavorTagColor(def ?? null);
            return (
              <Badge
                key={index}
                variant="outline"
                className={cn('flex items-center gap-1 pr-1 rounded-full text-xs', color.bg, color.text, color.border)}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-0.5 rounded-full p-0.5 opacity-60 hover:opacity-100"
                  aria-label={`${tag} 향미 삭제`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* 플레이버 휠 */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
        <FlavorWheel
          activeGroup={activeGroup}
          onGroupClick={handleGroupClick}
          selectedTags={tags}
        />

        {/* 검색 */}
        <div className="mt-3">
          <Input
            ref={inputRef}
            type="text"
            placeholder={activeGroupMeta ? `${activeGroupMeta.label} 검색 또는 직접 입력…` : '향미 검색 또는 직접 입력…'}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            disabled={tags.length >= maxTags}
            className="h-8 text-xs"
          />
        </div>

        {/* 태그 목록 */}
        {displayByCategory.length > 0 && (
          <div className="mt-3 space-y-2">
            {displayByCategory.map(([category, catTags]) => {
              const hexColor = CATEGORY_COLORS_HEX[category];
              const colorSet = FLAVOR_CATEGORY_COLORS[category];
              return (
                <div key={category}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: hexColor ?? '#94a3b8' }}
                    />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      {category}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {catTags.map((tag) => (
                      <button
                        key={tag.tagId}
                        type="button"
                        onClick={() => addTag(tag.tagKo)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium transition-all active:scale-95 hover:opacity-80',
                          colorSet?.bg, colorSet?.text, colorSet?.border,
                        )}
                        aria-label={`${tag.tagKo} 향미 추가`}
                      >
                        {tag.tagKo}
                        <TagTooltip description={tag.descriptionKo} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isSearching && activeGroup && displayByCategory.length === 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {GROUP_COLORS[activeGroup].label} 향미를 모두 선택했어요.
          </p>
        )}

        {!activeGroup && !isSearching && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            휠에서 원하는 섹터를 눌러 향미를 고르세요.
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {tags.length >= maxTags
          ? `최대 ${maxTags}개까지 추가할 수 있습니다.`
          : `휠 섹터 클릭 → 향미 선택, 또는 직접 입력 후 Enter. (${tags.length}/${maxTags})`}
      </p>
    </div>
  );
}
