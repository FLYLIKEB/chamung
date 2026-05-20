import { type FC, memo } from 'react';
import { Pin, Megaphone, Shield, Heart, MessageCircle, Eye, MoreHorizontal, ChevronRight, Share2, Flag, Bookmark } from 'lucide-react';
import { Post, POST_CATEGORY_LABELS } from '../types';
import { useNavigate } from 'react-router-dom';
import { cn } from './ui/utils';
import { formatRelativeTime } from '../utils/dateUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useShare } from '../hooks/useShare';
import { useAuth } from '../contexts/AuthContext';

interface PostCardProps {
  post: Post;
  commentCount?: number;
  onBookmarkToggle?: (isBookmarked: boolean) => void;
}

const PostCardComponent: FC<PostCardProps> = ({ post, commentCount }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { share } = useShare();

  const handleClick = () => {
    navigate(`/chadam/${post.id}`);
  };

  const authorName = post.isAnonymous ? '익명' : (post.user?.name ?? '알 수 없음');
  const authorImage = post.isAnonymous ? null : post.user?.profileImageUrl;
  const likeCount = post.likeCount ?? 0;
  const comments = post.commentCount ?? commentCount ?? 0;

  if (post.isPinned) {
    return (
      <div
        onClick={handleClick}
        className="px-4 py-3.5 bg-muted/40 rounded-lg cursor-pointer active:bg-muted/60 transition-colors flex items-center gap-2"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <Pin className="w-4 h-4 text-green-600 shrink-0" />
        <span className={cn('flex-1 min-w-0 text-sm font-medium text-foreground truncate', !post.title && 'post-card-content-preview')}>{post.title || post.content}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="px-4 py-4 cursor-pointer active:bg-muted/30 transition-colors"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* 작성자 행 */}
      <div className="flex items-center gap-2 mb-2">
        {/* 아바타 */}
        {authorImage ? (
          <img
            src={authorImage}
            alt={authorName}
            className="w-9 h-9 rounded-full object-cover bg-muted shrink-0"
            onClick={(e) => { e.stopPropagation(); if (post.user?.id) navigate(`/user/${post.user.id}`); }}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-muted-foreground">
              {(authorName.charAt(0) ?? '?').toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'text-sm font-semibold',
              post.user?.role === 'admin' ? 'text-green-600' : 'text-foreground',
            )}>
              {authorName}
            </span>
            {post.user?.role === 'admin' && <Shield className="w-3 h-3 text-green-600 shrink-0" />}
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
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex gap-3 items-start min-w-0">
        <div className="flex-1 min-w-0">
          {post.title && (
            <h3 className="text-[15px] font-bold text-foreground leading-snug mb-0.5 line-clamp-1">
              {post.title}
            </h3>
          )}
          <p className="post-card-content-preview text-[14px] text-foreground/80 line-clamp-2 leading-relaxed">
            {post.content}
          </p>
        </div>

        {post.images && post.images.length > 0 && (
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
              <img
                src={post.images[0].thumbnailUrl || post.images[0].url}
                alt={post.images[0].caption || post.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {post.images.length > 1 && (
              <span className="absolute bottom-0.5 right-0.5 text-[9px] font-semibold bg-black/50 text-white rounded px-0.5 leading-tight">
                +{post.images.length - 1}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 액션 행 */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-4 text-muted-foreground/60">
          <span className="inline-flex items-center gap-1 text-xs">
            <Heart className="w-[15px] h-[15px]" />
            {likeCount > 0 && <span>{likeCount}</span>}
          </span>
          <span className="inline-flex items-center gap-1 text-xs">
            <MessageCircle className="w-[15px] h-[15px]" />
            {comments > 0 && <span>{comments}</span>}
          </span>
          <span className="inline-flex items-center gap-1 text-xs">
            <Eye className="w-[15px] h-[15px]" />
            {post.viewCount > 0 && <span>{post.viewCount}</span>}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="p-1 -m-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground/30" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => share(post.title || '게시글', `${window.location.origin}/chadam/${post.id}`)}>
              <Share2 className="w-4 h-4 mr-2" />공유
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/chadam/${post.id}`)}>
              <Bookmark className="w-4 h-4 mr-2" />자세히 보기
            </DropdownMenuItem>
            {user && user.id !== post.userId && (
              <DropdownMenuItem onClick={() => navigate(`/chadam/${post.id}`, { state: { openReport: true } })} className="text-destructive focus:text-destructive">
                <Flag className="w-4 h-4 mr-2" />신고
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const PostCard = memo(PostCardComponent);
