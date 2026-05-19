import React, { type FC, useState, memo, useCallback } from 'react';
import { Star, Lock, Bookmark, Loader2 } from 'lucide-react';
import { Note } from '../types';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { notesApi } from '../lib/api';
import { logger } from '../lib/logger';
import { cn } from './ui/utils';
import { BrandMark } from './BrandMark';

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const handleImageLoad = useCallback(() => setImageLoaded(true), []);

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
        'relative aspect-[3/4] w-full overflow-hidden flex flex-col rounded-sm bg-card border-0 shadow-none text-left transition-colors',
        canView ? 'hover:bg-muted/20' : 'opacity-60 cursor-not-allowed',
      )}
    >
      {thumbnail ? (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <ImageWithFallback
            src={thumbnail}
            alt={note.teaName}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
              imageLoaded ? 'opacity-[0.09]' : 'opacity-0',
            )}
            style={{ filter: 'grayscale(1) saturate(0) contrast(0.85) brightness(1.08)' }}
            onLoad={handleImageLoad}
          />
          <div className="absolute inset-0 bg-card/70" aria-hidden="true" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40" aria-hidden="true">
          <BrandMark className="w-12 h-12 text-foreground/8" />
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between px-2.5 pt-2">
        {note.teaType ? (
          <span className="inline-flex items-center gap-1 px-0 py-0 text-[9px] font-semibold text-muted-foreground">
            <span className="w-1 h-1 rounded-full shrink-0 bg-muted-foreground/35" />
            {note.teaType}
          </span>
        ) : <span />}
        {!note.isPublic && (
          <span className="p-0.5 rounded-sm text-muted-foreground" aria-label="비공개">
            <Lock className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between px-2.5 pt-2 pb-2">
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
