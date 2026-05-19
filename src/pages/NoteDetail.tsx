import React, { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Trash2, Loader2, Heart, Bookmark, Edit, Flag, Share2, Lock, Unlock, ChevronDown } from 'lucide-react';
import { Header } from '../components/Header';
import { DetailFallback } from '../components/DetailFallback';
import { RatingVisualization } from '../components/RatingVisualization';
import { ImageCarousel } from '../components/ImageCarousel';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ReportModal } from '../components/ReportModal';
import { BottomNav } from '../components/BottomNav';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Link } from 'react-router-dom';
import { BREW_COLORS } from '../components/BrewColorPicker';
import { notesApi } from '../lib/api';
import { Note, Tea } from '../types';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/logger';
import { useShare } from '../hooks/useShare';
import { TeaTypeBadge } from '../components/TeaTypeBadge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchWeather, type WeatherInfo } from '../utils/weather';

export function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const noteId = id ? parseInt(id, 10) : NaN;
  const { user, isLoading: isAuthLoading } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [tea, setTea] = useState<Tea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [use10Scale, setUse10Scale] = useState(false);
  const { share } = useShare();
  const cardDeckRef = useRef<HTMLDivElement | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showStoryPhotos, setShowStoryPhotos] = useState(false);

  const fetchData = useCallback(async () => {
    if (isNaN(noteId)) {
      toast.error('유효하지 않은 차록 ID입니다.');
      return;
    }
    try {
      setIsLoading(true);
      const noteData = await notesApi.getById(noteId);
      const normalizedNote = noteData as Note;
      setNote(normalizedNote);
      setIsLiked(normalizedNote.isLiked ?? false);
      setLikeCount(normalizedNote.likeCount ?? 0);
      setIsBookmarked(normalizedNote.isBookmarked ?? false);
      if (normalizedNote.tea) {
        setTea(normalizedNote.tea);
      }
    } catch (error: any) {
      logger.error('Failed to fetch note:', error);
      if (error?.statusCode === 403) {
        toast.error('이 차록을 볼 권한이 없습니다.');
      } else if (error?.statusCode === 404) {
        toast.error('차록을 찾을 수 없습니다.');
      } else {
        toast.error('차록을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    if (isDeleted) return;
    fetchData();
  }, [noteId, isDeleted, fetchData]);

  const weatherDateStr = note?.drinkDate
    ? String(note.drinkDate).slice(0, 10)
    : note?.createdAt
      ? (note.createdAt instanceof Date ? note.createdAt.toISOString().slice(0, 10) : String(note.createdAt).slice(0, 10))
      : null;

  useEffect(() => {
    if (!weatherDateStr) return;
    fetchWeather(weatherDateStr).then(setWeather).catch(() => {});
  }, [weatherDateStr]);

  if (isLoading) {
    return (
      <DetailFallback title="차록 상세">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </DetailFallback>
    );
  }

  if (!note) {
    return (
      <DetailFallback
        title="차록 상세"
        message="차록을 찾을 수 없거나 볼 권한이 없습니다."
      />
    );
  }

  const isMyNote = note.userId === user?.id;
  const privacyLabel = note.isPublic ? '공개 차록' : '비공개 차록';
  const privacyActionLabel = note.isPublic ? '비공개로 전환' : '공개하기';

  const handleTogglePublic = async () => {
    if (isNaN(noteId)) {
      toast.error('유효하지 않은 차록 ID입니다.');
      return;
    }
    try {
      setIsUpdating(true);
      await notesApi.update(noteId, { isPublic: !note.isPublic });
      setNote({ ...note, isPublic: !note.isPublic });
      toast.success(note.isPublic ? '차록이 비공개로 전환되었습니다.' : '차록이 공개되었습니다.');
    } catch (error) {
      logger.error('Failed to update note:', error);
      toast.error('업데이트에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isNaN(noteId)) {
      toast.error('유효하지 않은 차록 ID입니다.');
      return;
    }
    try {
      setIsDeleting(true);
      await notesApi.delete(noteId);
      setIsDeleted(true);
      toast.success('차록이 삭제되었습니다.');
      navigate(-1);
    } catch (error) {
      logger.error('Failed to delete note:', error);
      toast.error('삭제에 실패했습니다.');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleLikeClick = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (isTogglingLike || isNaN(noteId)) return;
    try {
      setIsTogglingLike(true);
      const result = await notesApi.toggleLike(noteId);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (error: any) {
      logger.error('Failed to toggle like:', error);
      toast.error('좋아요 처리에 실패했습니다.');
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleBookmarkClick = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (isTogglingBookmark || isNaN(noteId)) return;
    try {
      setIsTogglingBookmark(true);
      const result = await notesApi.toggleBookmark(noteId);
      setIsBookmarked(result.bookmarked);
    } catch (error: any) {
      logger.error('Failed to toggle bookmark:', error);
      toast.error('북마크 처리에 실패했습니다.');
    } finally {
      setIsTogglingBookmark(false);
    }
  };

  const displayDate = note.drinkDate
    ? new Date(note.drinkDate + 'T00:00:00')
    : note.createdAt instanceof Date
      ? note.createdAt
      : new Date(note.createdAt);
  const dateYear = displayDate.getFullYear();
  const dateMonth = displayDate.getMonth() + 1;
  const dateDay = displayDate.getDate();
  const dateWeekday = ['일', '월', '화', '수', '목', '금', '토'][displayDate.getDay()];

  const brewColor = note.appearance ? BREW_COLORS.find((c) => c.value === note.appearance) : null;
  const hasStoryCard = !!(note.memo || (note.images && note.images.length > 0));
  const hasProfileCard = !!((note.axisValues && note.axisValues.length > 0) || (note.tags && note.tags.length > 0) || weather?.teaComment);
  const cardCount = [true, hasStoryCard, hasProfileCard].filter(Boolean).length;

  const getCardPhotoUrl = (cardIndex: number) => {
    const images = note.images ?? [];
    if (images.length === 0) return undefined;
    if (images.length === 1 && cardIndex > 0) return undefined;

    return images[cardIndex % images.length];
  };

  const getPhotoCardProps = (cardIndex: number) => {
    const imageUrl = getCardPhotoUrl(cardIndex);
    const cssSafeUrl = imageUrl?.replace(/[\\"]/g, '\\$&');
    return {
      'data-has-photo': imageUrl ? 'true' : undefined,
      style: cssSafeUrl
        ? ({ '--note-card-photo': `url("${cssSafeUrl}")` } as CSSProperties)
        : undefined,
    };
  };

  const handleDeckScroll = () => {
    const deck = cardDeckRef.current;
    if (!deck) return;

    const viewportCenter = deck.scrollLeft + deck.clientWidth / 2;
    const cards = Array.from(deck.children) as HTMLElement[];
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setCurrentCardIndex(nearestIndex);
  };

  // 메모 첫 줄 (72자 제한)
  const memoQuoteSource = note.memo
    ?.split(/\n+/)
    .map((line) => line.replace(/[#>*_`~\-[\]()]/g, '').replace(/\s+/g, ' ').trim())
    .find(Boolean);
  const memoQuote = memoQuoteSource
    ? memoQuoteSource.length > 72
      ? `${memoQuoteSource.slice(0, 72).trim()}…`
      : memoQuoteSource
    : null;

  return (
    <div className="note-detail-scene relative min-h-dvh overflow-hidden pb-6 bg-background text-foreground">
      <div className="note-detail-ambient" aria-hidden />
      <div className="note-detail-ripples" aria-hidden>
        <span className="note-detail-ripple note-detail-ripple-1" />
        <span className="note-detail-ripple note-detail-ripple-2" />
        <span className="note-detail-ripple note-detail-ripple-3" />
        <span className="note-detail-ripple note-detail-ripple-4" />
      </div>

      <Header showBack title="차록" showProfile />

      <div className="relative z-10 pt-2 pb-4">
        {/* 글라스 카드 래퍼 + 횡스크롤 카드 덱 */}
        <article className="note-detail-glass-card relative overflow-hidden">
        <div ref={cardDeckRef} onScroll={handleDeckScroll} className="note-detail-card-deck" aria-label="차록 상세 콘텐츠">

          {/* ── 카드 1: HERO ── */}
          <section
            className="note-detail-hero note-detail-photo-card flex flex-col px-4 pb-5 pt-4"
            {...getPhotoCardProps(0)}
          >

            {/* 상단: 작성자 + 공개여부 + 날짜 */}
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate(`/user/${note.userId}`)}
                className="text-xs font-medium text-muted-foreground hover:text-primary cursor-pointer transition-colors"
              >
                {note.userName}
              </button>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{dateYear}.{String(dateMonth).padStart(2, '0')}.{String(dateDay).padStart(2, '0')}</span>
                <button
                  type="button"
                  onClick={isMyNote ? handleTogglePublic : undefined}
                  disabled={!isMyNote || isUpdating}
                  aria-label={isMyNote ? privacyActionLabel : privacyLabel}
                  aria-pressed={!note.isPublic}
                  title={isMyNote ? privacyActionLabel : privacyLabel}
                  className={`note-privacy-lock ${note.isPublic ? 'is-public' : 'is-private'} ${isUpdating ? 'is-updating' : ''}`}
                >
                  <span className="note-privacy-lock__halo" aria-hidden />
                  <span className="note-privacy-lock__icon note-privacy-lock__icon--locked" aria-hidden>
                    <Lock className="h-4 w-4" />
                  </span>
                  <span className="note-privacy-lock__icon note-privacy-lock__icon--unlocked" aria-hidden>
                    <Unlock className="h-4 w-4" />
                  </span>
                  <span className="sr-only">{privacyLabel}</span>
                </button>
              </div>
            </div>

            {/* 차 이름 + 평점 */}
            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                {tea ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/tea/${tea.id}`)}
                    className="text-left"
                  >
                    <h2 className="note-detail-tea-title font-['Nanum_Myeongjo'] text-xl font-bold text-foreground leading-tight">{tea.name}</h2>
                  </button>
                ) : (
                  <h2 className="note-detail-tea-title font-['Nanum_Myeongjo'] text-xl font-bold text-foreground leading-tight">차록</h2>
                )}
              </div>
              {note.overallRating !== null && (
                <div className="shrink-0 flex items-center gap-1 text-foreground">
                  <Star className="h-4 w-4 fill-rating text-rating" />
                  <span className="text-lg font-bold">{Number(note.overallRating).toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/ 5</span>
                </div>
              )}
            </div>

            {/* 차 메타 */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {tea?.type && <TeaTypeBadge type={tea.type} />}
              {tea?.year && <span>{tea.year}년</span>}
              {tea?.seller && (
                <Link to={`/teahouse/${encodeURIComponent(tea.seller)}`} className="text-primary/80 hover:underline underline-offset-4">
                  {tea.seller}
                </Link>
              )}
            </div>

            {/* 한줄 메모 */}
            {memoQuote && (
              <p className="mt-3 text-sm text-foreground/80 leading-snug">"{memoQuote}"</p>
            )}

            {/* 칩 레일: 날씨 / 수색 / 가격 / 무게 */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {weather && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                  {weather.emoji} {weather.label}
                  {weather.temperatureMin != null && weather.temperatureMax != null && (
                    <span className="ml-0.5">{weather.temperatureMin}°~{weather.temperatureMax}°</span>
                  )}
                </span>
              )}
              {brewColor && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: brewColor.hex }} />
                  {brewColor.label}
                </span>
              )}
              {tea?.price != null && tea.price > 0 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{tea.price.toLocaleString()}원</span>
              )}
              {tea?.weight != null && tea.weight > 0 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{tea.weight}g</span>
              )}
            </div>

            {/* 향미 태그 */}
            {note.tags && note.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {note.tags.slice(0, 6).map((tag, i) => (
                  <Link key={i} to={`/tag/${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className="cursor-pointer text-[11px]">
                      {tag}
                    </Badge>
                  </Link>
                ))}
                {note.tags.length > 6 && (
                  <Badge variant="secondary" className="text-[11px] text-muted-foreground">
                    +{note.tags.length - 6}
                  </Badge>
                )}
              </div>
            )}

            {isMyNote && !isAuthLoading && (
              <div className="note-detail-owner-actions mt-auto flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(`/note/${noteId}/edit`)}
                  className="note-detail-owner-action"
                  aria-label="수정"
                  title="수정"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  className="note-detail-owner-action note-detail-owner-action--danger"
                  aria-label="삭제"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}

          </section>

          {/* ── 카드 2: NOTE (메모 + 이미지) ── */}
          {hasStoryCard && (
            <section
              className="note-detail-story-card note-detail-photo-card px-5 pt-4 pb-5"
              {...getPhotoCardProps(1)}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-muted-foreground">NOTE</p>
                {note.images && note.images.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowStoryPhotos((value) => !value)}
                    className="note-detail-photo-toggle inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground transition-colors"
                    aria-expanded={showStoryPhotos}
                  >
                    사진
                    <ChevronDown className={`h-3 w-3 transition-transform ${showStoryPhotos ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {note.memo && (
                <div className="note-detail-prose text-[0.92rem] leading-[1.75] text-foreground
                  [&_p]:my-1 [&_p]:whitespace-pre-wrap
                  [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1]:text-lg [&_h1]:font-bold
                  [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold
                  [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5
                  [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5
                  [&_li]:my-0.5
                  [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-xs
                  [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                  [&_a]:text-primary [&_a]:underline">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.memo}</ReactMarkdown>
                </div>
              )}
              {showStoryPhotos && note.images && note.images.length > 0 && (
                <div className="note-detail-image-stage mt-4">
                  <ImageCarousel images={note.images} />
                </div>
              )}
            </section>
          )}

          {/* ── 카드 3: PROFILE (향미 그래프 + 태그) ── */}
          {hasProfileCard && (
            <section
              className="note-detail-profile-card note-detail-section note-detail-section-axis note-detail-photo-card space-y-3 px-5 pt-4 pb-5"
              {...getPhotoCardProps(hasStoryCard ? 2 : 1)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-muted-foreground">PROFILE</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">감각 프로필</p>
                </div>
                {note.axisValues && note.axisValues.length > 0 && (
                  <div role="group" className="note-detail-scale-toggle flex p-0.5">
                    <button
                      type="button"
                      aria-pressed={!use10Scale}
                      onClick={() => setUse10Scale(false)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${!use10Scale ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      5점
                    </button>
                    <button
                      type="button"
                      aria-pressed={use10Scale}
                      onClick={() => setUse10Scale(true)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${use10Scale ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      10점
                    </button>
                  </div>
                )}
              </div>

              {note.axisValues && note.axisValues.length > 0 && (
                <>
                  {((note.schemas?.length ?? 0) > 0 || note.schema) && (
                    <div className="rounded-lg bg-muted px-3 py-2">
                      <p className="mb-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">템플릿</p>
                      {(note.schemas?.length ?? 0) > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {note.schemas!.map((s) => (
                            <span key={s.id} className="text-xs font-medium text-foreground">{s.nameKo}</span>
                          ))}
                        </div>
                      ) : note.schema && (
                        <span className="text-xs font-medium text-foreground">{note.schema.nameKo}</span>
                      )}
                    </div>
                  )}
                  <RatingVisualization axisValues={note.axisValues} use10Scale={use10Scale} variant="poster" />
                </>
              )}

              {note.tags && note.tags.length > 0 && (
                <div className="note-detail-section-tags pt-1">
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">FLAVOR TRACE</p>
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag, index) => (
                      <Link key={index} to={`/tag/${encodeURIComponent(tag)}`}>
                        <Badge variant="secondary" className="cursor-pointer text-xs">
                          {tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {weather?.teaComment && (
                <p className="pt-1 text-xs italic leading-relaxed text-muted-foreground">&ldquo;{weather.teaComment}&rdquo;</p>
              )}
            </section>
          )}
        </div>

        {/* 페이지 인디케이터 */}
        {cardCount > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-2" aria-label={`현재 ${currentCardIndex + 1}번째 카드`}>
            {Array.from({ length: cardCount }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === currentCardIndex ? 'w-4 bg-primary' : 'w-1.5 bg-foreground/25'
                }`}
              />
            ))}
          </div>
        )}

        {/* 액션 독 */}
        {user && (
          <div className="note-detail-action-dock mx-3 mb-3 mt-1 flex items-center justify-center gap-2 px-3 py-2">
            <button
              type="button"
              onClick={handleLikeClick}
              disabled={isTogglingLike}
              className={`min-h-[40px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${isLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Heart className={`w-[18px] h-[18px] transition-all ${isLiked ? 'fill-primary text-primary' : ''}`} />
              {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
            </button>
            <button
              type="button"
              onClick={handleBookmarkClick}
              disabled={isTogglingBookmark}
              className={`min-h-[40px] min-w-[40px] flex items-center justify-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Bookmark className={`w-[18px] h-[18px] transition-all ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => share(tea?.name ?? '차록', window.location.href)}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-[18px] h-[18px]" />
            </button>
          </div>
        )}

        {/* 카드 밖: 수정/삭제/신고 */}
        <div className="mt-3 space-y-2 px-4">
          {user && !isMyNote && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReportModal(true)}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Flag className="w-3.5 h-3.5" />신고하기
              </Button>
            </div>
          )}

        </div>
        </article>
      </div>

      <ReportModal open={showReportModal} onOpenChange={setShowReportModal} noteId={noteId} />
      <BottomNav className="max-md:hidden" />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>차록 삭제</AlertDialogTitle>
            <AlertDialogDescription>정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
