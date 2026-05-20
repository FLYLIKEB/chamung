import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Package, Trash2, ChevronUp, ChevronDown, ChevronLeft, Pencil, CheckCircle2, BookOpen, Coffee, Minus } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/button';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { cellarApi } from '../lib/api';
import { CellarItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CellarCardSkeleton } from '../components/CellarCardSkeleton';
import { logger } from '../lib/logger';
import { TEA_TYPES, TEA_TYPE_COLORS } from '../constants';
import { cn } from '../components/ui/utils';
import { InfiniteScrollSentinel } from '../components/InfiniteScrollSentinel';
import { FilterTabBar } from '../components/FilterTabBar';
import { PageListContent } from '../components/ui/PageListContent';
import { AddLogoIcon } from '../components/AddLogoIcon';
import { useScrollHide } from '../hooks/useScrollHide';

const UNIT_LABELS: Record<string, string> = {
  g: 'g',
  ml: 'ml',
  bag: '개',
  cake: '병',
};

type SortKey = 'createdAt' | 'quantity' | 'remindAt' | 'openedAt' | 'name';
type SortDir = 'asc' | 'desc';

const SORT_OPTIONS: { key: SortKey; label: string; defaultDir: SortDir }[] = [
  { key: 'createdAt', label: '추가일', defaultDir: 'desc' },
  { key: 'quantity', label: '잔량', defaultDir: 'desc' },
  { key: 'remindAt', label: '리마인더', defaultDir: 'asc' },
  { key: 'openedAt', label: '개봉일', defaultDir: 'desc' },
  { key: 'name', label: '이름', defaultDir: 'asc' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function getReminderDiff(remindAt: string | null): { label: string; overdue: boolean } | null {
  if (!remindAt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const remind = new Date(remindAt);
  remind.setHours(0, 0, 0, 0);
  const diff = Math.round((remind.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { label: 'D-Day', overdue: false };
  if (diff > 0) return { label: `D-${diff}`, overdue: false };
  return { label: `D+${Math.abs(diff)}`, overdue: true };
}

function CellarRow({
  item,
  onDelete,
  onEdit,
  onNoteClick,
  onSessionClick,
  onQuantityChange,
}: {
  item: CellarItem;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onNoteClick: (teaId: number) => void;
  onSessionClick: (teaId: number) => void;
  onQuantityChange: (item: CellarItem) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleDelete = async () => {
    if (!confirm(`"${item.tea.name}" 찻장 아이템을 삭제하시겠습니까?`)) return;
    setDeleting(true);
    try {
      await cellarApi.remove(item.id);
      onDelete(item.id);
      toast.success('찻장 아이템이 삭제되었습니다.');
    } catch (error) {
      logger.error('Failed to delete cellar item:', error);
      toast.error('삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 30 || Math.abs(dx) < Math.abs(dy)) return;
    setRevealed(dx < 0);
  };

  const adjustQuantity = async (delta: number) => {
    const current = Number(item.quantity) || 0;
    const nextQuantity = Math.max(0, current + delta);
    if (nextQuantity === current || adjusting) return;

    setAdjusting(true);
    try {
      const updated = await cellarApi.update(item.id, { quantity: nextQuantity });
      onQuantityChange(updated);
      toast.success(`잔량을 ${nextQuantity}${UNIT_LABELS[updated.unit] ?? updated.unit}로 변경했습니다.`);
    } catch (error) {
      logger.error('Failed to update cellar quantity:', error);
      toast.error('잔량 변경에 실패했습니다.');
    } finally {
      setAdjusting(false);
    }
  };

  const tea = item.tea;
  const canAdjustGrams = item.unit === 'g';
  const accentClass =
    tea.type && tea.type in TEA_TYPE_COLORS
      ? TEA_TYPE_COLORS[tea.type as keyof typeof TEA_TYPE_COLORS]
      : 'bg-muted-foreground/30';

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 스와이프 액션 버튼 (우측에서 슬라이드 인) */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 flex w-44 transition-transform duration-200 ease-out',
          revealed ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!revealed}
      >
        <button
          type="button"
          onClick={() => { onNoteClick(item.teaId); setRevealed(false); }}
          className="flex-1 bg-primary text-primary-foreground flex flex-col items-center justify-center gap-1 text-[11px] font-medium"
        >
          <BookOpen className="w-4 h-4" />
          차록
        </button>
        <button
          type="button"
          onClick={() => { onSessionClick(item.teaId); setRevealed(false); }}
          className="flex-1 bg-muted text-foreground flex flex-col items-center justify-center gap-1 text-[11px] font-medium"
        >
          <Coffee className="w-4 h-4" />
          다회
        </button>
        <button
          type="button"
          onClick={() => { onEdit(item.id); setRevealed(false); }}
          className="flex-1 bg-secondary text-secondary-foreground flex flex-col items-center justify-center gap-1 text-[11px] font-medium"
        >
          <Pencil className="w-4 h-4" />
          수정
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 bg-destructive text-destructive-foreground flex flex-col items-center justify-center gap-1 text-[11px] font-medium"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          삭제
        </button>
      </div>

      {/* 행 콘텐츠 */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 transition-transform duration-200 ease-out cursor-pointer',
          revealed ? '-translate-x-44' : 'translate-x-0 hover:bg-accent/40',
        )}
        onClick={() => {
          if (revealed) {
            setRevealed(false);
            return;
          }
          setExpanded((prev) => !prev);
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
      >
        {/* 차 종류 색 dot */}
        <span className={cn('w-2 h-2 rounded-full shrink-0', accentClass)} aria-hidden />

        {/* 이름 + 메타 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              className="min-w-0 truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {tea.name}
            </button>
            {tea.type && (
              <span className="text-[10px] text-muted-foreground shrink-0">{tea.type}</span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
            {tea.year ? `${tea.year}년` : '연도미상'}
            {' · '}
            {tea.seller ? (
              <Link
                to={`/teahouse/${encodeURIComponent(tea.seller)}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary/80 hover:underline"
              >
                {tea.seller}
              </Link>
            ) : (
              <span className="opacity-50">판매처 미상</span>
            )}
            {item.openedAt && ` · 개봉 ${formatDate(item.openedAt)}`}
            {(() => {
              const r = getReminderDiff(item.remindAt ?? null);
              if (!r) return null;
              return (
                <span className={cn('inline-flex items-center gap-0.5 ml-1', r.overdue ? 'text-destructive' : 'text-rating')}>
                  {' · '}<Bell className="w-2.5 h-2.5 inline" />{r.label}
                </span>
              );
            })()}
          </div>
          {item.memo && (
            <p className="text-[11px] text-foreground/60 truncate mt-0.5">{item.memo}</p>
          )}
        </div>

        {/* 잔량 */}
        <span className="text-sm tabular-nums text-foreground shrink-0">
          {Number(item.quantity)}
          <span className="text-[11px] text-muted-foreground ml-0.5">{UNIT_LABELS[item.unit] ?? item.unit}</span>
        </span>

        {/* 스와이프 어포던스 힌트 */}
        <ChevronLeft className={cn('w-3.5 h-3.5 text-muted-foreground/30 shrink-0 -mr-1 transition-transform', expanded && '-rotate-90')} aria-hidden />
      </div>

      {expanded && !revealed && (
        <div className="px-4 pb-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="rounded-2xl border border-border/40 bg-card/70 px-4 py-3 text-center shadow-sm">
            <p className="text-[11px] font-medium text-muted-foreground">잔량 빠른 조정</p>

            <div className="mt-2 flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustQuantity(-3);
                }}
                disabled={adjusting || !canAdjustGrams || Number(item.quantity) <= 0}
                className="h-11 min-w-20 rounded-full px-4 text-sm font-semibold"
                aria-label="잔량 3g 줄이기"
              >
                <Minus className="mr-1.5 h-4 w-4" />
                3g
              </Button>

              <div className="min-w-24 rounded-full bg-background/80 px-4 py-2">
                <p className="text-lg font-semibold tabular-nums text-foreground leading-none">
                  {Number(item.quantity)}
                  <span className="ml-0.5 text-xs font-medium text-muted-foreground">{UNIT_LABELS[item.unit] ?? item.unit}</span>
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">현재 잔량</p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustQuantity(3);
                }}
                disabled={adjusting || !canAdjustGrams}
                className="h-11 min-w-20 rounded-full px-4 text-sm font-semibold"
                aria-label="잔량 3g 늘리기"
              >
                <AddLogoIcon className="mr-1.5 h-4 w-4" />
                3g
              </Button>
            </div>

            {!canAdjustGrams && (
              <p className="mt-2 text-[11px] text-muted-foreground">g 단위 아이템만 ±3g 조정이 가능해요.</p>
            )}

            <div className="mt-3 flex items-center justify-center gap-2 text-[11px]">
              <Link
                to={`/tea/${item.teaId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:underline"
              >
                차 상세 보기
              </Link>
              {adjusting && <span className="text-muted-foreground">저장 중...</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



const CELLAR_PAGE_SIZE = 20;

export function Cellar() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const filterHidden = useScrollHide();
  const [items, setItems] = useState<CellarItem[]>([]);
  const [reminders, setReminders] = useState<CellarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(CELLAR_PAGE_SIZE);

  // 필터·정렬 상태
  const [activeType, setActiveType] = useState<'all' | string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [sortOpen, setSortOpen] = useState(false);
  const [finishedOpen, setFinishedOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allItems, reminderItems] = await Promise.all([
        cellarApi.getAll(),
        cellarApi.getReminders(),
      ]);
      setItems(Array.isArray(allItems) ? allItems : []);
      setReminders(Array.isArray(reminderItems) ? reminderItems : []);
    } catch (error) {
      logger.error('Failed to fetch cellar items:', error);
      toast.error('찻장 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }
    fetchData();
  }, [isAuthenticated, user, authLoading, navigate, fetchData]);

  // 잔량 > 0: 찻장 목록, 잔량 = 0: 다 마신 차 목록
  const activeItems = useMemo(
    () => items.filter((item) => Number(item.quantity) > 0),
    [items],
  );
  const finishedItems = useMemo(
    () =>
      items
        .filter((item) => Number(item.quantity) <= 0)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [items],
  );

  // 차 종류별 아이템 수 집계 (보유 중인 차만)
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of activeItems) {
      counts[item.tea.type] = (counts[item.tea.type] ?? 0) + 1;
    }
    return counts;
  }, [activeItems]);

  // 차 종류별 잔량(g) 집계 (unit이 g일 때만 합산)
  const typeGramsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of activeItems) {
      const type = item.tea.type || '기타';
      const qty = Number(item.quantity) || 0;
      if (item.unit === 'g') {
        map[type] = (map[type] ?? 0) + qty;
      }
    }
    return map;
  }, [activeItems]);

  const totalGrams = useMemo(
    () => Object.values(typeGramsMap).reduce((sum, g) => sum + g, 0),
    [typeGramsMap],
  );

  // 요약 카드용: 보유 종류별 잔량 내림차순
  const summaryByType = useMemo(
    () =>
      Object.entries(typeGramsMap)
        .filter(([, g]) => g > 0)
        .sort(([, a], [, b]) => b - a),
    [typeGramsMap],
  );

  // 필터·정렬 적용 (보유 중인 차만)
  const displayedItems = useMemo(() => {
    const filtered =
      activeType === 'all'
        ? activeItems
        : activeItems.filter((item) => item.tea.type === activeType);

    return [...filtered].sort((a, b) => {
      let result = 0;

      if (sortKey === 'name') {
        result = a.tea.name.localeCompare(b.tea.name, 'ko');
      } else if (sortKey === 'quantity') {
        result = Number(a.quantity) - Number(b.quantity);
      } else if (sortKey === 'createdAt') {
        result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === 'remindAt') {
        // null은 항상 뒤로
        if (!a.remindAt && !b.remindAt) result = 0;
        else if (!a.remindAt) result = 1;
        else if (!b.remindAt) result = -1;
        else result = new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime();
      } else if (sortKey === 'openedAt') {
        // null은 항상 뒤로
        if (!a.openedAt && !b.openedAt) result = 0;
        else if (!a.openedAt) result = 1;
        else if (!b.openedAt) result = -1;
        else result = new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime();
      }

      return sortDir === 'asc' ? result : -result;
    });
  }, [activeItems, activeType, sortKey, sortDir]);

  // 필터/정렬 변경 시 표시 수 리셋
  useEffect(() => {
    setDisplayCount(CELLAR_PAGE_SIZE);
  }, [activeType, sortKey, sortDir]);

  const handleSortChange = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      const option = SORT_OPTIONS.find((o) => o.key === key);
      setSortKey(key);
      setSortDir(option?.defaultDir ?? 'desc');
    }
    setSortOpen(false);
  };

  const handleDelete = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setReminders((prev) => prev.filter((item) => item.id !== id));
  };

  const handleQuantityChange = (updatedItem: CellarItem) => {
    setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    setReminders((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  };

  const handleNoteClick = (teaId: number) => {
    navigate(`/note/new?teaId=${teaId}`);
  };

  const handleSessionClick = (teaId: number) => {
    navigate(`/session/new?teaId=${teaId}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/cellar/${id}/edit`);
  };

  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" role="status" aria-label="로딩 중" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pb-32">
        <Header showProfile title="내 찻장" showLogo hideWhenCollapsed />
        <div className="px-4 sm:px-6 py-4 space-y-4">
          <div className="flex gap-2 overflow-x-hidden py-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shrink-0 w-20 h-8 rounded-full bg-accent animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <CellarCardSkeleton key={i} />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <Header showProfile title="내 찻장" showLogo hideWhenCollapsed />

      <div className="space-y-0">
        {/* 리마인더 배너 */}
        {reminders.length > 0 && (
          <div className="mx-4 mt-4 sm:mx-6 flex items-start gap-3 bg-rating/10 border border-rating/30 rounded-xl p-3">
            <Bell className="w-4 h-4 text-rating shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">리마인더 알림</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {reminders.map((r) => r.tea.name).join(', ')} — 확인이 필요합니다.
              </p>
            </div>
          </div>
        )}

        {/* 찻장 요약 */}
        {activeItems.length > 0 && (
          <div className="px-4 sm:px-6 pt-4 pb-2">
            <p className="text-sm text-muted-foreground">
              {activeItems.length}종 보관 중{totalGrams > 0 ? ` · ${totalGrams.toLocaleString()}g` : ''}
            </p>
            {totalGrams > 0 && (
              <div
                data-testid="type-ratio-bar"
                className="mt-2 flex h-0.5 rounded-full overflow-hidden"
                aria-hidden
              >
                {summaryByType.map(([type, g]) => (
                  <div
                    key={type}
                    style={{ flex: g }}
                    className={cn('h-full', type in TEA_TYPE_COLORS ? TEA_TYPE_COLORS[type as keyof typeof TEA_TYPE_COLORS] : 'bg-muted-foreground/50')}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 필터 + 정렬 — sticky */}
        {activeItems.length > 0 && (
          <div className={cn(
            'sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/30',
            'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            filterHidden ? '-translate-y-full' : 'translate-y-0',
          )}>
            {/* 전체 pill + 정렬 */}
            <div className="flex items-center gap-2 px-4 py-2">
              <button
                type="button"
                onClick={() => setActiveType('all')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  activeType === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent border border-border/60 text-muted-foreground hover:text-foreground',
                )}
              >
                전체 {activeItems.length}
                {totalGrams > 0 && (
                  <span className="opacity-70">· {totalGrams.toLocaleString()}g</span>
                )}
              </button>
              {/* 정렬 드롭다운 — 우측 */}
              <div className="ml-auto relative flex items-center gap-1">
                <button
                  type="button"
                  aria-label="정렬 기준"
                  aria-expanded={sortOpen}
                  onClick={() => setSortOpen((prev) => !prev)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
                  {sortDir === 'asc' ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                    <ul
                      role="menu"
                      aria-label="정렬 옵션"
                      className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-sm py-1 min-w-28 overflow-hidden"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <li key={opt.key}>
                          <button
                            type="button"
                            role="menuitem"
                            aria-checked={sortKey === opt.key}
                            onClick={() => handleSortChange(opt.key)}
                            className={[
                              'w-full text-left px-4 py-2 text-sm transition-colors',
                              sortKey === opt.key
                                ? 'text-primary font-medium bg-primary/5'
                                : 'text-foreground hover:bg-secondary',
                            ].join(' ')}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
            {/* 차 종류 탭 */}
            <FilterTabBar
              activeKey={activeType}
              onChange={setActiveType}
              aria-label="차 종류 필터"
              tabs={[...TEA_TYPES]
                .sort((a, b) => (typeCounts[b] ?? 0) - (typeCounts[a] ?? 0))
                .map((type) => {
                  const count = typeCounts[type] ?? 0;
                  const grams = typeGramsMap[type] ?? 0;
                  return {
                    key: type,
                    tabClassName: count === 0 ? 'opacity-40' : undefined,
                    ariaLabel: `${type} ${count}개 ${grams}그램`,
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn('w-1.5 h-1.5 rounded-full shrink-0', TEA_TYPE_COLORS[type])}
                          aria-hidden
                        />
                        {type} {count}
                        {grams > 0 && (
                          <span className="opacity-70">· {grams.toLocaleString()}g</span>
                        )}
                      </span>
                    ),
                  };
                })}
            />
          </div>
        )}

        {/* 찻장 목록 */}
        <PageListContent className="pb-4">
          {activeItems.length === 0 && finishedItems.length === 0 ? (
            // 아이템 자체가 없는 전체 빈 상태
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground px-4">
              <Package className="w-12 h-12 opacity-30" />
              <p className="text-sm">아직 찻장에 차가 없습니다.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/cellar/new')}
                className="gap-1"
              >
                <AddLogoIcon className="w-4 h-4" />
                차 추가하기
              </Button>
            </div>
          ) : activeItems.length === 0 ? (
            // 보유 중인 차 없음, 다 마신 차만 있음
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground px-4">
              <Package className="w-10 h-10 opacity-30" />
              <p className="text-sm">보유 중인 차가 없습니다.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/cellar/new')}
                className="gap-1"
              >
                <AddLogoIcon className="w-4 h-4" />
                차 추가하기
              </Button>
            </div>
          ) : displayedItems.length === 0 ? (
            // 필터 결과가 없는 빈 상태 (보유 중인 차는 있지만 해당 종류 없음)
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground px-4">
              <Package className="w-10 h-10 opacity-30" />
              <p className="text-sm">해당 종류의 차가 없습니다.</p>
              <button
                type="button"
                onClick={() => setActiveType('all')}
                className="text-xs text-primary hover:underline"
              >
                전체 보기
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-accent">
                {displayedItems.slice(0, displayCount).map((item, i) => (
                  <div
                    key={item.id}
                    className="animate-fade-in-up opacity-0"
                    style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}
                  >
                    <CellarRow
                      item={item}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onNoteClick={handleNoteClick}
                      onSessionClick={handleSessionClick}
                      onQuantityChange={handleQuantityChange}
                    />
                  </div>
                ))}
              </div>
              {displayCount < displayedItems.length && (
                <InfiniteScrollSentinel
                  onLoadMore={() => setDisplayCount((prev) => prev + CELLAR_PAGE_SIZE)}
                  loading
                />
              )}
            </>
          )}

          {/* 다 마신 차 목록 */}
          {finishedItems.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border px-4">
              <button
                type="button"
                onClick={() => setFinishedOpen((prev) => !prev)}
                className="flex items-center gap-2 w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>다 마신 차 ({finishedItems.length})</span>
                {finishedOpen ? (
                  <ChevronUp className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                )}
              </button>
              {finishedOpen && (
                <div className="mt-3 divide-y divide-accent -mx-4">
                  {finishedItems.map((item) => (
                    <CellarRow
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onNoteClick={handleNoteClick}
                      onSessionClick={handleSessionClick}
                      onQuantityChange={handleQuantityChange}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </PageListContent>
      </div>

      <FloatingActionButton
        onClick={() => navigate('/cellar/new')}
        ariaLabel="찻장 아이템 추가"
        position="aboveNav"
      />

      <BottomNav />
    </div>
  );
}
