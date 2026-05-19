import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Trash2, Globe, Lock, Loader2, Heart, Bookmark, Edit, Flag, Share2 } from 'lucide-react';
import { Header } from '../components/Header';
import { DetailFallback } from '../components/DetailFallback';
import { RatingVisualization } from '../components/RatingVisualization';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ImageCarousel } from '../components/ImageCarousel';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ReportModal } from '../components/ReportModal';
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
      setIsDeleted(true); // 삭제 상태 설정하여 API 재호출 방지
      toast.success('차록이 삭제되었습니다.');
      // 이전 화면으로 돌아가기
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

    if (isTogglingBookmark || isNaN(noteId)) {
      return;
    }

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
    <div className="note-detail-scene relative min-h-dvh overflow-hidden pb-6 text-white">
      <div className="note-detail-ambient" aria-hidden />
      <div className="note-detail-ripples" aria-hidden>
        <span className="note-detail-ripple note-detail-ripple-1" />
        <span className="note-detail-ripple note-detail-ripple-2" />
        <span className="note-detail-ripple note-detail-ripple-3" />
        <span className="note-detail-ripple note-detail-ripple-4" />
      </div>
      <div className="note-detail-geometry-field" aria-hidden>
        <span className="note-detail-geo note-detail-geo-ring" />
        <span className="note-detail-geo note-detail-geo-disc" />
        <span className="note-detail-geo note-detail-geo-slab" />
        <span className="note-detail-geo note-detail-geo-line" />
        <span className="note-detail-geo note-detail-geo-triangle" />
        <span className="note-detail-geo note-detail-geo-dots" />
      </div>

      <Header showBack title="차록" showProfile tone="glassDark" />

      <div className="relative z-10 mx-auto max-w-[430px] px-3 py-4 sm:px-4">
        {/* 일기장 카드 - 하나의 통합 카드 */}
        <article className="note-detail-glass-card relative overflow-hidden">
          <div className="note-detail-card-deck" aria-label="차록 상세 콘텐츠">

          {/* 차 이름 / 한줄평 */}
          <section className="note-detail-hero px-5 pb-6 pt-3">
            {/* 향미태그 기반 레이더/점수 형태 배경 글로우 */}
            {(() => {
              // 대만 특색차 풍미 → 색상 매핑
              const TAG_COLORS: Record<string, string> = {
                // 꽃향
                '꽃향': '255,240,210', '장미': '255,182,185', '재스민': '240,248,200',
                '라일락': '210,195,230', '국화': '255,230,130', '아카시아': '245,235,190',
                '목서화': '255,185,80',
                // 과일향
                '과일향': '255,210,140', '복숭아': '255,195,150', '사과': '220,235,160',
                '배': '235,240,180', '레몬': '255,245,130', '오렌지': '255,165,80',
                '포도': '160,100,160', '딸기': '240,120,120', '매실': '180,80,100',
                '리치': '255,200,200', '망고': '255,190,60',
                // 견과/곡물
                '견과류': '195,155,100', '볶은향': '165,115,65', '호두': '130,85,50',
                '아몬드': '215,175,120', '곡물': '220,195,140', '쌀': '240,225,185',
                '보리': '200,170,110',
                // 풀/채소
                '풀향': '160,205,120', '녹차향': '140,195,110', '해조류': '80,140,110',
                '채소': '130,175,90', '허브': '100,170,130',
                // 나무/흙
                '나무향': '160,120,80', '흙향': '140,105,70', '이끼': '100,130,80',
                '습한흙': '120,100,75',
                // 향신료
                '향신료': '210,110,70', '계피': '185,90,50', '생강': '225,160,80',
                '정향': '120,65,45', '후추': '90,70,60',
                // 달콤/캐러멜
                '달콤함': '255,220,160', '캐러멜': '210,145,70', '꿀': '240,185,80',
                '바닐라': '245,225,190', '초콜릿': '105,55,35', '엿': '190,140,80',
                // 스모키
                '스모키': '85,75,65', '훈연향': '120,85,60', '숯': '55,50,45',
                // 발효/숙성
                '발효향': '130,85,55', '된장': '155,120,75', '숙성향': '110,80,55',
                // 광물/청량
                '광물향': '170,200,210', '청량감': '200,235,230', '시원함': '185,220,225',
              };

              const tags = note.tags ?? [];
              const matched = tags
                .map(t => TAG_COLORS[t] ? { rgb: TAG_COLORS[t], tag: t } : null)
                .filter(Boolean)
                .slice(0, 4) as { rgb: string; tag: string }[];
              const colorEntries = matched.length > 0 ? matched : [{ rgb: '232,203,139', tag: '' }];

              const axes = note.axisValues ?? [];
              const sorted = [...axes].sort((a, b) => (a.axis?.displayOrder ?? 0) - (b.axis?.displayOrder ?? 0));
              const cx = 50; const cy = 50; const r = 38;

              // 태그 타원 위치: 형태 안에서 분산 배치 (중심 기준 상대 오프셋)
              const tagPositions = [
                { ox: 0,   oy: -12 },  // 상단
                { ox: 12,  oy: 8  },   // 우하단
                { ox: -12, oy: 8  },   // 좌하단
                { ox: 0,   oy: 16 },   // 하단
              ];

              // 타원: 카드 너비만큼 크게, 하단으로 내림
              const renderTagEllipses = () => {
                // 태그 개수에 따라 y 위치 분산 (cx=50 기준, 하단부에 몰아서 배치)
                const yPositions = [72, 82, 88, 94];
                return colorEntries.map(({ rgb, tag }, i) => {
                  const ey = yPositions[i] ?? 80;
                  const ex = 50;
                  const filterId = `tag-blur-${i}`;
                  return (
                    <g key={i}>
                      <defs>
                        <filter id={filterId} x="-30%" y="-100%" width="160%" height="300%">
                          <feGaussianBlur stdDeviation="7" />
                        </filter>
                      </defs>
                      {/* rx=48: 거의 카드 전체 너비, ry=10: 옆으로 납작한 타원 */}
                      <ellipse cx={ex} cy={ey} rx={48} ry={10} fill={`rgba(${rgb},0.72)`} filter={`url(#${filterId})`} />
                      {tag && (
                        <text x={ex} y={ey} textAnchor="middle" dominantBaseline="middle"
                          fontSize="3.2" fontWeight="700" letterSpacing="0.06em"
                          fill={`rgba(${rgb},0.42)`}
                          style={{ fontFamily: 'inherit', userSelect: 'none' }}>
                          {tag}
                        </text>
                      )}
                    </g>
                  );
                });
              };

              if (sorted.length >= 3) {
                const points = sorted.map((av, i) => {
                  const angle = (Math.PI * 2 * i) / sorted.length - Math.PI / 2;
                  const max = Number(av.axis?.maxValue) || 5;
                  const val = Math.max(0, Math.min(max, Number(av.valueNumeric) || 0));
                  const ratio = val / max;
                  return `${cx + r * ratio * Math.cos(angle)},${cy + r * ratio * Math.sin(angle)}`;
                }).join(' ');
                return (
                  <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <filter id="hero-shape-blur" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="5" />
                      </filter>
                    </defs>
                    {/* polygon 형태 — blur로 바깥도 부드럽게 */}
                    <polygon points={points} fill="rgba(255,255,255,0.07)" filter="url(#hero-shape-blur)" />
                    {renderTagEllipses()}
                  </svg>
                );
              }
              const rating = note.overallRating != null ? Number(note.overallRating) : null;
              if (rating != null && rating > 0) {
                const ratio = rating / 5;
                const rr = 14 + ratio * 26;
                return (
                  <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <filter id="hero-circle-blur" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="5" />
                      </filter>
                    </defs>
                    <circle cx={cx} cy={cy} r={rr} fill="rgba(255,255,255,0.07)" filter="url(#hero-circle-blur)" />
                    {renderTagEllipses()}
                  </svg>
                );
              }
              return null;
            })()}
            <div className="note-detail-hero-composition" aria-hidden>
              <span className="note-detail-composition-ring" />
              <span className="note-detail-composition-bar" />
              <span className="note-detail-composition-axis" />
              <span className="note-detail-composition-block" />
            </div>
            <div className="note-detail-enter note-detail-enter-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="note-detail-exhibition-label text-[10px] font-semibold uppercase tracking-[0.34em] text-white/35">TASTING LOG</p>
                <button
                  type="button"
                  onClick={() => navigate(`/user/${note.userId}`)}
                  className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs text-white/55 transition hover:bg-white/10 hover:text-white"
                >
                  {note.userName}
                </button>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="note-detail-privacy-chip">
                  {note.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {note.isPublic ? 'PUBLIC' : 'PRIVATE'}
                </span>
                <span className="text-right text-xs leading-tight text-white/45">
                  {dateYear}.{String(dateMonth).padStart(2, '0')}.{String(dateDay).padStart(2, '0')}<br />
                  {dateWeekday}요일
                </span>
              </div>
            </div>

            <div className="note-detail-enter note-detail-enter-2 mt-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">Tea</p>
                {tea ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/tea/${tea.id}`)}
                    className="note-detail-tea-link mt-1 block text-left"
                  >
                    <h2 className="note-detail-tea-title text-white"><span>{tea.name}</span></h2>
                  </button>
                ) : (
                  <h2 className="note-detail-tea-title text-white"><span>차록</span></h2>
                )}
              </div>

              {note.overallRating !== null && (
                <div className="note-detail-score-orb" aria-label={`평점 ${Number(note.overallRating).toFixed(1)}점`}>
                  <Star className="h-3.5 w-3.5 fill-white text-white/90" />
                  <strong>
                    {use10Scale
                      ? (Number(note.overallRating) * 2).toFixed(1)
                      : Number(note.overallRating).toFixed(1)}
                  </strong>
                  <span>/ {use10Scale ? '10' : '5'}</span>
                </div>
              )}
            </div>

            {memoQuote && (
              <figure className="note-detail-quote note-detail-enter note-detail-enter-3 mt-4">
                <span className="note-detail-quote-mark" aria-hidden>“</span>
                <blockquote>{memoQuote}</blockquote>
              </figure>
            )}

            <div className="note-detail-tea-meta note-detail-enter note-detail-enter-4 mt-3 flex flex-wrap items-center gap-1.5 text-xs text-white/52">
              {tea?.type && <TeaTypeBadge type={tea.type} />}
              {tea?.year && <span>{tea.year}년</span>}
              {tea?.seller && (
                <Link
                  to={`/teahouse/${encodeURIComponent(tea.seller)}`}
                  className="text-white/78 underline-offset-4 hover:underline"
                >
                  {tea.seller}
                </Link>
              )}
            </div>

            <div className="note-detail-chip-rail note-detail-enter note-detail-enter-5 mt-3">
              {weather && (
                <span className="note-detail-meta-chip">
                  <span>{weather.emoji}</span>
                  <span>{weather.label}</span>
                  {weather.temperatureMin != null && weather.temperatureMax != null && (
                    <span>{weather.temperatureMin}°~{weather.temperatureMax}°</span>
                  )}
                </span>
              )}
              {brewColor && (
                <span className="note-detail-meta-chip">
                  <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: brewColor.hex }} />
                  <span>{brewColor.label}</span>
                </span>
              )}
              {tea?.price != null && tea.price > 0 && (
                <span className="note-detail-meta-chip">{tea.price.toLocaleString()}원</span>
              )}
              {tea?.weight != null && tea.weight > 0 && (
                <span className="note-detail-meta-chip">{tea.weight}g</span>
              )}
            </div>

            {note.axisValues && note.axisValues.length > 0 && (
              <div className="note-detail-signal-wave note-detail-enter note-detail-enter-6" aria-label="맛 프로파일 요약">
                {[...note.axisValues]
                  .sort((a, b) => (a.axis?.displayOrder ?? 0) - (b.axis?.displayOrder ?? 0))
                  .slice(0, 9)
                  .map((axisValue) => {
                    const value = Math.max(0, Math.min(5, Number(axisValue.value) || 0));
                    return (
                      <span
                        key={axisValue.axisId}
                        title={`${axisValue.axis?.nameKo ?? '평가축'} ${value.toFixed(1)}`}
                        style={{ height: `${18 + value * 13}%` }}
                      />
                    );
                  })}
              </div>
            )}
          </section>

          {(note.memo || (note.images && note.images.length > 0)) && (
            <section className="note-detail-story-card note-detail-enter note-detail-enter-7 px-5 pt-4 pb-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">NOTE</p>
                {note.images && note.images.length > 0 && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">{note.images.length} Photo</span>
                )}
              </div>
              {note.memo && (
                <div className="note-detail-prose text-[0.96rem] leading-[1.78] text-white/90 [&_p]:my-1 [&_p]:whitespace-pre-wrap [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-white/10 [&_pre]:p-3 [&_a]:text-white [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-white/60 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-white/10 [&_th]:bg-white/10 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_td]:border [&_td]:border-white/10 [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.memo}</ReactMarkdown>
                </div>
              )}
              {note.images && note.images.length > 0 && (
                <div className="note-detail-image-stage mt-4">
                  <ImageCarousel images={note.images} />
                </div>
              )}
            </section>
          )}

          {((note.axisValues && note.axisValues.length > 0) || brewColor || (note.tags && note.tags.length > 0) || weather?.teaComment) && (
            <section className="note-detail-profile-card note-detail-section note-detail-section-axis space-y-3 px-5 pt-4 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">PROFILE</p>
                  <p className="text-sm font-medium text-white/82">감각 프로필</p>
                </div>
                {brewColor && (
                  <div className="flex items-center gap-2 text-right text-xs text-white/55">
                    <span className="inline-block h-5 w-5 rounded-full border border-white/15" style={{ backgroundColor: brewColor.hex }} />
                    <span>{brewColor.label}</span>
                  </div>
                )}
              </div>

              {note.axisValues && note.axisValues.length > 0 && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    {((note.schemas?.length ?? 0) > 0 || note.schema) ? (
                      <div className="min-w-0 flex-1 rounded-lg bg-white/[0.04] px-3 py-2">
                        <p className="mb-0.5 text-[10px] uppercase tracking-wider text-white/35">템플릿</p>
                        {(note.schemas?.length ?? 0) > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {note.schemas!.map((s) => (
                              <span key={s.id} className="text-xs font-medium text-white">{s.nameKo}</span>
                            ))}
                          </div>
                        ) : note.schema && (
                          <span className="text-xs font-medium text-white">{note.schema.nameKo}</span>
                        )}
                      </div>
                    ) : <div />}
                    <div role="group" aria-label="점수 표시 단위" className="note-detail-scale-toggle flex p-0.5">
                      <button
                        type="button"
                        aria-pressed={!use10Scale}
                        onClick={() => setUse10Scale(false)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                          !use10Scale ? 'text-white' : 'text-white/38 hover:text-white/82'
                        }`}
                      >
                        5점
                      </button>
                      <button
                        type="button"
                        aria-pressed={use10Scale}
                        onClick={() => setUse10Scale(true)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                          use10Scale ? 'text-white' : 'text-white/38 hover:text-white/82'
                        }`}
                      >
                        10점
                      </button>
                    </div>
                  </div>
                  <RatingVisualization axisValues={note.axisValues} use10Scale={use10Scale} variant="poster" />
                </>
              )}

              {note.tags && note.tags.length > 0 && (
                <div className="note-detail-section-tags pt-1">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">FLAVOR TRACE</p>
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag, index) => (
                      <Link key={index} to={`/tag/${encodeURIComponent(tag)}`}>
                        <Badge variant="secondary" className="cursor-pointer border-white/10 bg-white/[0.06] text-xs text-white transition-colors hover:bg-white/[0.12]">
                          {tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {weather?.teaComment && (
                <p className="pt-1 text-xs italic leading-relaxed text-white/45">&ldquo;{weather.teaComment}&rdquo;</p>
              )}
            </section>
          )}

          </div>

          {/* 좋아요 / 북마크 / 공유 - 카드 하단 */}
          {user && (
            <div className="note-detail-action-dock mx-3 mb-3 mt-3 flex items-center justify-center gap-3 px-3 py-2.5">
              <button
                type="button"
                onClick={handleLikeClick}
                disabled={isTogglingLike}
                className={`min-h-[40px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  isLiked ? 'text-primary' : 'text-white/45 hover:text-white'
                }`}
                title={isLiked ? '좋아요 취소' : '좋아요'}
              >
                <Heart className={`w-4.5 h-4.5 transition-all ${isLiked ? 'fill-primary text-primary' : 'fill-none'}`} />
                {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
              </button>
              <button
                type="button"
                onClick={handleBookmarkClick}
                disabled={isTogglingBookmark}
                className={`min-h-[40px] min-w-[40px] flex items-center justify-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  isBookmarked ? 'text-primary' : 'text-white/45 hover:text-white'
                }`}
                title={isBookmarked ? '북마크 해제' : '북마크 추가'}
              >
                <Bookmark className={`w-4.5 h-4.5 transition-all ${isBookmarked ? 'fill-primary text-primary' : 'fill-none'}`} />
              </button>
              <button
                type="button"
                onClick={() => share(tea?.name ?? '차록', window.location.href)}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg px-4 py-2 text-white/45 transition-colors hover:text-white"
                title="공유하기"
              >
                <Share2 className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </article>

        {/* 카드 밖: 신고 / 수정 / 삭제 */}
        <div className="mt-3 space-y-2">
          {/* 다른 사람 노트일 때 신고 */}
          {user && !isMyNote && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReportModal(true)}
                className="gap-1.5 text-white/45 hover:bg-white/10 hover:text-white"
              >
                <Flag className="w-3.5 h-3.5" />
                신고하기
              </Button>
            </div>
          )}

          {/* 내 노트 액션 */}
          {isMyNote && !isAuthLoading && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/note/${noteId}/edit`)}
                className="min-h-[44px] flex-1 border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                수정
              </Button>
              <Button
                variant="outline"
                onClick={handleTogglePublic}
                className="min-h-[44px] flex-1 border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  note.isPublic ? '비공개로 전환' : '공개하기'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="min-h-[44px] min-w-[44px] border-white/15 bg-white/[0.04] px-3 hover:bg-red-500/10"
                aria-label="삭제"
              >
                <Trash2 className="w-4.5 h-4.5 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 신고 모달 */}
      <ReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        noteId={noteId}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>차록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '삭제'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
