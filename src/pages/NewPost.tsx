import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { PostForm, PostFormValues } from '../components/PostForm';
import { useAuth } from '../contexts/AuthContext';
import { postsApi, CreatePostRequest } from '../lib/api';
import { toast } from 'sonner';

export function NewPost() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSubmit = async (values: PostFormValues) => {
    if (!values.title.trim() || !values.content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const dto: CreatePostRequest = {
        title: values.title.trim(),
        content: values.content.trim(),
        category: values.category,
        isAnonymous: values.isAnonymous,
        isPinned: isAdmin ? values.isPinned : undefined,
        isSponsored: values.isSponsored,
        sponsorNote: values.isSponsored ? values.sponsorNote.trim() || undefined : undefined,
        images: values.images.length > 0 ? values.images : undefined,
        taggedNoteIds: values.taggedNoteIds.length > 0 ? values.taggedNoteIds : undefined,
      };
      const post = await postsApi.create(dto);
      toast.success('게시글이 작성되었습니다.');
      navigate(`/chadam/${post.id}`, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      toast.error(msg && typeof msg === 'string' ? msg : '게시글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header showBack title="새 게시글" showProfile showLogo />
      <PostForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
