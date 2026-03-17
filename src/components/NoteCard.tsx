import React, { type FC, useState, memo } from 'react';
import { Star, Lock, Bookmark, Loader2 } from 'lucide-react';
import { Note } from '../types';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { notesApi } from '../lib/api';
import { logger } from '../lib/logger';
import { cn } from './ui/utils';
import { TEA_TYPE_COLORS, TEA_TYPE_PLACEHOLDER_BG, type TeaType } from '../constants';

const TEA_TYPE_TINT: Record<string, string> = {
  녹차: 'bg-gradient-to-br from-emerald-300/[0.03] to-stone-200/10 dark:from-emerald-400/[0.04] dark:to-stone-400/10',
  백차: 'bg-gradient-to-br from-stone-300/[0.03] to-stone-200/10 dark:from-stone-400/[0.04] dark:to-stone-500/10',
  황차: 'bg-gradient-to-br from-amber-300/[0.03] to-stone-200/10 dark:from-amber-400/[0.04] dark:to-stone-400/10',
  '청차/우롱차': 'bg-gradient-to-br from-blue-400/[0.03] to-stone-200/10 dark:from-blue-500/[0.04] dark:to-stone-400/10',
  홍차: 'bg-gradient-to-br from-rose-300/[0.03] to-stone-200/10 dark:from-rose-400/[0.04] dark:to-stone-400/10',
  '흑차/보이차': 'bg-gradient-to-br from-neutral-600/[0.03] to-stone-200/10 dark:from-neutral-500/[0.04] dark:to-stone-400/10',
  대용차: 'bg-gradient-to-br from-slate-300/[0.03] to-stone-200/10 dark:from-slate-500/[0.04] dark:to-stone-400/10',
};

interface NoteCardProps {
  note: Note;
  showTeaName?: boolean;
  onBookmarkToggle?: (isBookmarked: boolean) => void;
}

const NoteCardComponent: FC<NoteCardProps> = ({ note, showTeaName = true, onBookmarkToggle }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasImage = note.images && note.images.length > 0;
  const thumbnail = hasImage
    ? (note.imageThumbnails?.[0] ?? note.images![0])
    : null;
  const isMyNote = note.userId === user?.id;
  const canView = note.isPublic || isMyNote;

  const [isBookmarked, setIsBookmarked] = useState(note.isBookmarked ?? false);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  const accentClass = note.teaType && note.teaType in TEA_TYPE_COLORS
    ? TEA_TYPE_COLORS[note.teaType as keyof typeof TEA_TYPE_COLORS]
    : 'bg-muted-foreground/50';

  const placeholderBg = note.teaType && note.teaType in TEA_TYPE_PLACEHOLDER_BG
    ? TEA_TYPE_PLACEHOLDER_BG[note.teaType as keyof typeof TEA_TYPE_PLACEHOLDER_BG]
    : 'bg-muted';

  const handleClick = () => {
    if (!canView) {
      toast.error('비공개 차록은 작성자만 볼 수 있습니다.');
      return;
    }
    navigate(`/note/${note.id}`);
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (isTogglingBookmark) return;

    try {
      setIsTogglingBookmark(true);
      const result = await notesApi.toggleBookmark(note.id);
      setIsBookmarked(result.bookmarked);
      if (onBookmarkToggle) {
        onBookmarkToggle(result.bookmarked);
      }
    } catch (error: unknown) {
      logger.error('Failed to toggle bookmark:', error);
      toast.error('북마크 처리에 실패했습니다.');
    } finally {
      setIsTogglingBookmark(false);
    }
  };

  const rating = Number(note.overallRating);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'relative aspect-[3/4] w-full overflow-hidden flex flex-col rounded-2xl bg-card border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-left transition-all',
        canView ? 'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]' : 'opacity-60 cursor-not-allowed',
      )}
    >
      {/* 상단 이미지 영역 — 가로 꽉, 세로 절반 */}
      <div className={cn('relative w-full h-[55%] overflow-hidden', !thumbnail && placeholderBg)}>
        {thumbnail ? (
          <ImageWithFallback
            src={thumbnail}
            alt={note.teaName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img src="/logo.png" alt="" className="w-10 h-10 object-contain opacity-25 brightness-0 invert" />
          </div>
        )}

        {/* 이미지 위 오버레이: 차 종류 뱃지 + 잠금 */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between p-2">
          {note.teaType ? (
            <span className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold backdrop-blur-sm',
              'bg-black/30 text-white',
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', accentClass)} />
              {note.teaType}
            </span>
          ) : <span />}
          <div className="flex items-center gap-1">
            {!note.isPublic && (
              <span className="p-1 rounded-full bg-black/30 backdrop-blur-sm">
                <Lock className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </div>
        </div>

        {/* 이미지 하단 그라데이션 */}
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-card to-transparent" />
      </div>

      {/* 하단 정보 영역 — 왼쪽 정렬, 차종별 은은한 틴트 */}
      <div className={cn(
        'flex-1 flex flex-col justify-between px-2.5 pt-1.5 pb-2',
        note.teaType && TEA_TYPE_TINT[note.teaType] ? TEA_TYPE_TINT[note.teaType] : '',
      )}>
        <div className="space-y-0.5">
          {showTeaName && (
            <p className="text-xs font-semibold text-foreground truncate leading-tight">
              {note.teaName}
            </p>
          )}
          <p className="text-[9px] text-muted-foreground truncate">
            {[note.teaYear ? `${note.teaYear}년` : null, note.teaSeller].filter(Boolean).join(' · ') || '\u00A0'}
          </p>
          {note.overallRating !== null && rating > 0 && (
            <div className="flex items-center gap-px pt-0.5">
              {[1, 2, 3, 4, 5].map((i) => {
                const filled = i <= Math.floor(rating);
                const half = !filled && i === Math.ceil(rating) && rating % 1 >= 0.3;
                return (
                  <Star
                    key={i}
                    className={cn(
                      'w-2.5 h-2.5',
                      filled
                        ? 'fill-rating text-rating'
                        : half
                          ? 'fill-rating/50 text-rating'
                          : 'fill-none text-muted-foreground/25',
                    )}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* 하단 미니 푸터: 날짜 + 작성자 + 북마크 */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[9px] text-muted-foreground/60 font-medium shrink-0">
              {note.createdAt
                ? new Date(note.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
                : ''}
            </span>
            {note.userName && (
              <>
                <span className="text-[9px] text-muted-foreground/30">·</span>
                <span className="text-[9px] text-muted-foreground/60 truncate">
                  {note.userName}
                </span>
              </>
            )}
          </div>
          {user && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleBookmarkClick}
              onKeyDown={(e) => { if (e.key === 'Enter') handleBookmarkClick(e as unknown as React.MouseEvent); }}
              className="p-0.5 rounded-full hover:bg-muted/50 transition-colors shrink-0"
              aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}
            >
              {isTogglingBookmark ? (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              ) : (
                <Bookmark
                  className={cn(
                    'w-3 h-3 transition-colors',
                    isBookmarked
                      ? 'fill-primary text-primary'
                      : 'fill-none text-muted-foreground/30',
                  )}
                />
              )}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export const NoteCard = memo(NoteCardComponent);
