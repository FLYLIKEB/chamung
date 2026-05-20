import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Loader2,
  Heart,
  Bookmark,
  Pencil,
  Trash2,
  Flag,
  MoreHorizontal,
  Megaphone,
  Pin,
  Shield,
  Share2,
  BookOpen,
  MessageCircle,
} from 'lucide-react';
import { Post, Comment, PostCategory, POST_CATEGORY_LABELS } from '../types';

const CATEGORY_TO_BOARD: Record<PostCategory, string> = {
  brewing_question: '질문·토론',
  recommendation: '질문·토론',
  discussion: '질문·토론',
  tea_review: '리뷰',
  tool_review: '리뷰',
  tea_room_review: '리뷰',
  announcement: '공지',
  bug_report: '제보',
};
import { postsApi, commentsApi } from '../lib/api';
import { Header } from '../components/Header';
import { ImageCarousel } from '../components/ImageCarousel';
import { CommentList } from '../components/CommentList';
import { PostReportModal } from '../components/PostReportModal';
import { useAuth } from '../contexts/AuthContext';
import { useShare } from '../hooks/useShare';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';
import { formatRelativeTime } from '../utils/dateUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const postId = Number(id);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const commentsSectionRef = useRef<HTMLDivElement | null>(null);
  const { share } = useShare();

  const fetchData = useCallback(async () => {
    if (!postId || isNaN(postId)) return;
    setIsLoading(true);
    try {
      const [postData, commentsData] = await Promise.all([
        postsApi.getById(postId),
        commentsApi.getByPost(postId),
      ]);
      setPost(postData);
      setIsLiked(postData.isLiked ?? false);
      setLikeCount(postData.likeCount ?? 0);
      setIsBookmarked(postData.isBookmarked ?? false);
      setComments(commentsData);
    } catch {
      toast.error('게시글을 불러오는 데 실패했습니다.');
      navigate('/chadam', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [postId, navigate]);

  useEffect(() => {
    if (!postId || isNaN(postId)) {
      navigate('/chadam', { replace: true });
      return;
    }
    fetchData();
  }, [postId, navigate, fetchData]);

  useEffect(() => {
    const scrollRoot = articleRef.current?.closest('.overflow-y-auto') as HTMLElement | null;

    const updateReadingProgress = () => {
      const article = articleRef.current;
      if (!article) {
        setReadingProgress(0);
        return;
      }

      if (scrollRoot && scrollRoot.scrollTop + scrollRoot.clientHeight >= scrollRoot.scrollHeight - 2) {
        setReadingProgress(100);
        return;
      }

      const rootRect = scrollRoot?.getBoundingClientRect();
      const articleRect = article.getBoundingClientRect();
      const dockHeight = document.querySelector<HTMLElement>('.post-detail-reading-dock')?.offsetHeight ?? 0;
      const viewportBottom = rootRect
        ? rootRect.bottom - dockHeight
        : window.innerHeight - dockHeight;
      const readableDistance = Math.max(1, articleRect.height);
      const progress = ((viewportBottom - articleRect.top) / readableDistance) * 100;

      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    const previousOverscrollBehaviorY = scrollRoot?.style.overscrollBehaviorY;
    const previousScrollPaddingBottom = scrollRoot?.style.scrollPaddingBottom;

    if (scrollRoot) {
      scrollRoot.style.overscrollBehaviorY = 'none';
      scrollRoot.style.scrollPaddingBottom = '3.5rem';
    }

    updateReadingProgress();
    scrollRoot?.addEventListener('scroll', updateReadingProgress, { passive: true });
    window.addEventListener('scroll', updateReadingProgress, { passive: true });
    window.addEventListener('resize', updateReadingProgress);

    return () => {
      if (scrollRoot) {
        scrollRoot.style.overscrollBehaviorY = previousOverscrollBehaviorY ?? '';
        scrollRoot.style.scrollPaddingBottom = previousScrollPaddingBottom ?? '';
      }
      scrollRoot?.removeEventListener('scroll', updateReadingProgress);
      window.removeEventListener('scroll', updateReadingProgress);
      window.removeEventListener('resize', updateReadingProgress);
    };
  }, [post, comments.length]);

  const handleScrollToComments = () => {
    commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleToggleLike = async () => {
    if (!user) { toast.error('로그인이 필요합니다.'); return; }
    if (isTogglingLike) return;
    try {
      setIsTogglingLike(true);
      const result = await postsApi.toggleLike(postId);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch { toast.error('좋아요 처리에 실패했습니다.'); }
    finally { setIsTogglingLike(false); }
  };

  const handleToggleBookmark = async () => {
    if (!user) { toast.error('로그인이 필요합니다.'); return; }
    if (isTogglingBookmark) return;
    try {
      setIsTogglingBookmark(true);
      const result = await postsApi.toggleBookmark(postId);
      setIsBookmarked(result.bookmarked);
      toast.success(result.bookmarked ? '스크랩했습니다.' : '스크랩을 해제했습니다.');
    } catch { toast.error('스크랩 처리에 실패했습니다.'); }
    finally { setIsTogglingBookmark(false); }
  };

  const handleDelete = async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;
    try {
      await postsApi.delete(postId);
      toast.success('게시글이 삭제되었습니다.');
      navigate('/chadam', { replace: true });
    } catch { toast.error('게시글 삭제에 실패했습니다.'); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) return null;

  const isAuthor = user?.id === post.userId;
  const authorName = post.isAnonymous ? '익명' : (post.user?.name ?? '알 수 없음');
  const authorImage = post.isAnonymous ? null : post.user?.profileImageUrl;

  return (
    <div className="post-detail-page min-h-screen">
      <Header showBack title={CATEGORY_TO_BOARD[post.category] ?? '차담'} showProfile />

      {/* 게시글 영역 */}
      <div ref={articleRef} className="post-detail-paper px-5 pt-4 pb-3">
        {/* 작성자 */}
        <div className="flex items-center gap-2.5 mb-4">
          {authorImage ? (
            <img src={authorImage} alt={authorName} className="w-10 h-10 rounded-full object-cover bg-muted" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-semibold text-muted-foreground">
                {(authorName.charAt(0) ?? '?').toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {post.isAnonymous ? (
                <span className="text-sm font-semibold text-foreground">{authorName}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => post.user?.id && navigate(`/user/${post.user.id}`)}
                  className={cn(
                    'text-sm font-semibold hover:underline text-left',
                    post.user?.role === 'admin' ? 'text-green-600' : 'text-foreground',
                  )}
                >
                  {authorName}
                </button>
              )}
              {post.user?.role === 'admin' && <Shield className="w-3.5 h-3.5 text-green-600 shrink-0" />}
              {post.isPinned && (
                <span className="px-1.5 py-0.5 rounded bg-muted-foreground/15 text-muted-foreground font-medium text-[10px] leading-none inline-flex items-center gap-0.5">
                  <Pin className="w-2.5 h-2.5" />공지
                </span>
              )}
              {post.isSponsored && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium text-[10px] leading-none inline-flex items-center gap-0.5 dark:bg-amber-900/30 dark:text-amber-400">
                  <Megaphone className="w-2.5 h-2.5" />협찬
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
              <span className="text-xs text-primary/70 font-medium">#{POST_CATEGORY_LABELS[post.category]}</span>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs text-muted-foreground">조회 {post.viewCount ?? 0}</span>
            </div>
          </div>
        </div>

        {/* 제목 */}
        {post.title && (
          <h1 className="post-detail-title text-lg font-bold text-foreground leading-snug mb-3">{post.title}</h1>
        )}

        {/* 본문 */}
        <div className="space-y-3">
          <div className="post-detail-content text-[15px] text-foreground leading-relaxed whitespace-pre-wrap [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-medium [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          {/* 이미지 */}
          {post.images && post.images.length > 0 && (
            <ImageCarousel images={post.images.map((img) => ({ url: img.url, caption: img.caption }))} />
          )}
        </div>

        {/* 액션 아이콘 행 - 좌측 정렬 */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-border/30">
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleLike}
              disabled={isTogglingLike}
              className={cn(
                'flex items-center gap-1 text-sm transition-colors disabled:opacity-50',
                isLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isTogglingLike ? (
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
              ) : (
                <Heart className={cn('w-[18px] h-[18px]', isLiked && 'fill-primary')} />
              )}
              {likeCount > 0 && <span className="font-medium">{likeCount}</span>}
            </button>

            <button
              type="button"
              onClick={handleScrollToComments}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              {comments.length > 0 && <span className="font-medium">{comments.length}</span>}
            </button>

            <button
              onClick={handleToggleBookmark}
              disabled={isTogglingBookmark}
              className={cn(
                'flex items-center gap-1 text-sm transition-colors disabled:opacity-50',
                isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isTogglingBookmark ? (
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
              ) : (
                <Bookmark className={cn('w-[18px] h-[18px]', isBookmarked && 'fill-primary')} />
              )}
            </button>

            <button
              onClick={() => share(post?.title ?? '게시글', window.location.href)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-[18px] h-[18px]" />
            </button>
          </div>

          {/* 더보기 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="더보기" className="p-1 rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthor ? (
                <>
                  <DropdownMenuItem onClick={() => navigate(`/chadam/${postId}/edit`)}>
                    <Pencil className="w-4 h-4 mr-2" />수정
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />삭제
                  </DropdownMenuItem>
                </>
              ) : user && (
                <DropdownMenuItem onClick={() => setReportModalOpen(true)}>
                  <Flag className="w-4 h-4 mr-2" />신고
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 구분선 (두꺼운 섹션 브레이크) */}
      <div className="h-2 bg-muted/60 dark:bg-muted/30" />

      {/* 댓글 영역 */}
      <div ref={commentsSectionRef} className="post-detail-comments px-5 pt-4">
        {/* 태그된 차록 */}
        {post.taggedNotes && post.taggedNotes.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" />
              관련 차록
            </div>
            <div className="flex flex-col gap-2">
              {post.taggedNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => navigate(`/note/${note.id}`)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {note.teaName || (note as any).tea?.name || '차록'}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {[
                        (note.teaYear || (note as any).tea?.year) ? `${note.teaYear || (note as any).tea?.year}년` : null,
                        note.teaSeller || (note as any).tea?.seller?.name || (note as any).tea?.seller,
                      ].filter(Boolean).join(' · ') || '*'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    {note.overallRating !== null && <span>★ {Number(note.overallRating).toFixed(1)}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 댓글 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">
            댓글 {comments.length > 0 && <span className="text-primary">{comments.length}</span>}
          </span>
          <span className="text-xs text-muted-foreground">최신순</span>
        </div>

        <CommentList
          postId={postId}
          comments={comments}
          onCommentsChange={setComments}
        />
      </div>

      <PostReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        postId={postId}
      />

      <nav className="post-detail-reading-dock" aria-label="글 상세 액션">
        <div className="post-detail-reading-progress" aria-hidden>
          <span style={{ width: `${readingProgress}%` }} />
        </div>
        <div className="post-detail-reading-actions">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isTogglingLike}
            className={cn('post-detail-reading-action', isLiked && 'is-active')}
            aria-label="좋아요"
          >
            {isTogglingLike ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Heart className={cn('w-5 h-5', isLiked && 'fill-current')} />
            )}
            <span>{likeCount}</span>
          </button>
          <button
            type="button"
            onClick={handleScrollToComments}
            className="post-detail-reading-action post-detail-comment-jump"
            aria-label="댓글로 이동"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{comments.length}</span>
          </button>
          <button
            type="button"
            onClick={() => share(post?.title ?? '게시글', window.location.href)}
            className="post-detail-reading-action"
            aria-label="공유"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleToggleBookmark}
            disabled={isTogglingBookmark}
            className={cn('post-detail-reading-action', isBookmarked && 'is-active')}
            aria-label="스크랩"
          >
            {isTogglingBookmark ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-current')} />
            )}
          </button>
        </div>
      </nav>

    </div>
  );
}
