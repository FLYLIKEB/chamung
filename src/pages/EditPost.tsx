import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { PostForm, PostFormValues, PostFormInitialValues } from '../components/PostForm';
import { useAuth } from '../contexts/AuthContext';
import { postsApi } from '../lib/api';
import { toast } from 'sonner';

export function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const postId = Number(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [initialValues, setInitialValues] = useState<PostFormInitialValues | undefined>(undefined);

  useEffect(() => {
    if (!postId || isNaN(postId)) {
      navigate('/chadam', { replace: true });
      return;
    }

    const fetchPost = async () => {
      try {
        const data = await postsApi.getById(postId);
        if (data.userId !== user?.id) {
          toast.error('수정 권한이 없습니다.');
          navigate(`/chadam/${postId}`, { replace: true });
          return;
        }
        setInitialValues({
          title: data.title,
          content: data.content,
          category: data.category,
          isAnonymous: data.isAnonymous ?? false,
          isPinned: data.isPinned ?? false,
          isSponsored: data.isSponsored,
          sponsorNote: data.sponsorNote ?? '',
          images: (data.images ?? []).map((img) => ({
            url: img.url,
            thumbnailUrl: img.thumbnailUrl ?? undefined,
            caption: img.caption ?? undefined,
          })),
          taggedNotes: (data.taggedNotes ?? []).map((n) => ({
            id: n.id,
            teaName: n.teaName,
            overallRating: n.overallRating,
          })),
        });
      } catch {
        toast.error('게시글을 불러오는 데 실패했습니다.');
        navigate('/chadam', { replace: true });
      } finally {
        setIsLoadingPost(false);
      }
    };

    fetchPost();
  }, [postId, user, navigate]);

  if (isLoadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSubmit = async (values: PostFormValues) => {
    if (!values.title.trim() || !values.content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      await postsApi.update(postId, {
        title: values.title.trim(),
        content: values.content.trim(),
        category: values.category,
        isAnonymous: values.isAnonymous,
        isPinned: isAdmin ? values.isPinned : undefined,
        isSponsored: values.isSponsored,
        sponsorNote: values.isSponsored ? values.sponsorNote.trim() || undefined : undefined,
        images: values.images,
      });
      toast.success('게시글이 수정되었습니다.');
      navigate(`/chadam/${postId}`, { replace: true });
    } catch {
      toast.error('게시글 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header showBack title="게시글 수정" showProfile />
      <PostForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
