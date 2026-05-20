import React, { useState } from 'react';
import { Loader2, Trash2, Pencil, Check, X, MessageCircle, ThumbsUp, MoreVertical, Send } from 'lucide-react';
import { Comment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { commentsApi } from '../lib/api';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { formatRelativeTime } from '../utils/dateUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface CommentListProps {
  postId: number;
  comments: Comment[];
  onCommentsChange: (comments: Comment[]) => void;
}

function CommentAvatar({ name, profileImageUrl }: { name?: string; profileImageUrl?: string | null }) {
  if (profileImageUrl) {
    return (
      <img
        src={profileImageUrl}
        alt={name ?? ''}
        className="w-8 h-8 rounded-full object-cover bg-muted shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-muted-foreground">
        {(name?.charAt(0) ?? '?').toUpperCase()}
      </span>
    </div>
  );
}

export function CommentList({ postId, comments, onCommentsChange }: CommentListProps) {
  const { user } = useAuth();
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const comment = await commentsApi.create(postId, newContent.trim());
      onCommentsChange([...comments, comment]);
      setNewContent('');
    } catch {
      toast.error('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStart = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleEditSave = async (commentId: number) => {
    if (!editContent.trim()) return;
    try {
      const updated = await commentsApi.update(commentId, editContent.trim());
      onCommentsChange(comments.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
    } catch {
      toast.error('댓글 수정에 실패했습니다.');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (commentId: number) => {
    try {
      await commentsApi.delete(commentId);
      onCommentsChange(comments.filter((c) => c.id !== commentId));
      toast.success('댓글이 삭제되었습니다.');
    } catch {
      toast.error('댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="post-detail-comment-list flex flex-col">
      <div className="space-y-2">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            첫 번째 댓글을 남겨보세요.
          </p>
        )}
        {comments.map((comment) => {
          const isOwner = user?.id === comment.userId;
          return (
            <div key={comment.id} className="post-detail-comment rounded-xl px-0 py-4 border-b border-border/20 last:border-b-0">
              <div className="flex gap-2.5">
                {/* 프로필 아바타 */}
                <CommentAvatar
                  name={comment.user?.name}
                  profileImageUrl={comment.user?.profileImageUrl}
                />

                {/* 내용 영역 */}
                <div className="flex-1 min-w-0">
                  {/* 이름 + 액션 */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {comment.user?.name ?? '알 수 없음'}
                    </span>

                    {/* 답글/좋아요/더보기 아이콘 (작성자만 더보기) */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        className="post-detail-comment-icon p-1.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        aria-label="답글"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="post-detail-comment-icon p-1.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        aria-label="공감"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      {isOwner && editingId !== comment.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="post-detail-comment-icon p-1.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                              aria-label="더보기"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditStart(comment)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(comment.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {/* 댓글 내용 or 수정 폼 */}
                  {editingId === comment.id ? (
                    <div className="flex flex-col gap-2 mt-1.5">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        autoFocus
                        className="min-h-0 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSave(comment.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleEditCancel}
                          className="h-7 px-2 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed mt-0.5">
                      {comment.content}
                    </p>
                  )}

                  {/* 날짜 */}
                  {editingId !== comment.id && (
                    <span className="text-[11px] text-muted-foreground/60 mt-1 block">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 댓글 입력 - 글 흐름 안에 배치해 항상 떠 있지 않도록 유지 */}
      {user ? (
        <form
          onSubmit={handleSubmit}
          className="post-detail-comment-form mt-5 border-t border-border/40 pt-4"
        >
          <div className="flex items-center gap-0 bg-muted/30 rounded-full overflow-hidden pl-3 pr-1">
            {/* 닉네임 라벨 */}
            <span className="text-xs font-semibold text-primary shrink-0 pr-2">
              {user.name}
            </span>
            {/* 입력 필드 */}
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="댓글을 입력하세요..."
              maxLength={1000}
              className="flex-1 h-10 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none caret-primary"
            />
            {/* 전송 버튼 */}
            <button
              type="submit"
              disabled={!newContent.trim() || isSubmitting}
              className="shrink-0 p-2 text-primary disabled:text-muted-foreground/20 transition-colors"
              aria-label="댓글 작성"
            >
              <span className="sr-only">댓글 작성</span>
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-3 border-t border-border/40 mt-2">
          댓글을 작성하려면 로그인이 필요합니다.
        </p>
      )}
    </div>
  );
}
