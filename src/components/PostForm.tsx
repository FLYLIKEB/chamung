import { useState, useEffect, useCallback } from 'react';
import { Loader2, BookOpen, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Note, PostCategory, PostImageItem } from '../types';
import { notesApi } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { PostImageUploader } from './PostImageUploader';
import { useAuth } from '../contexts/AuthContext';
import { cn } from './ui/utils';
import { WRITE_GROUPS, getGroupFromCategory, WriteGroupKey } from '../hooks/usePostForm';

export { getGroupFromCategory };

export interface PostFormValues {
  title: string;
  content: string;
  category: PostCategory;
  isAnonymous: boolean;
  isPinned: boolean;
  isSponsored: boolean;
  sponsorNote: string;
  images: PostImageItem[];
  taggedNoteIds: number[];
}

export interface PostFormInitialValues {
  title: string;
  content: string;
  category: PostCategory;
  isAnonymous: boolean;
  isPinned: boolean;
  isSponsored: boolean;
  sponsorNote: string;
  images: PostImageItem[];
  taggedNotes: Pick<Note, 'id' | 'teaName' | 'overallRating'>[];
}

interface PostFormProps {
  mode: 'create' | 'edit';
  initialValues?: PostFormInitialValues;
  onSubmit: (values: PostFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function PostForm({ mode, initialValues, onSubmit, isSubmitting }: PostFormProps) {
  const { user, isAdmin } = useAuth();

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [category, setCategory] = useState<PostCategory>(initialValues?.category ?? 'brewing_question');
  const [selectedGroup, setSelectedGroup] = useState<WriteGroupKey>(
    initialValues?.category ? getGroupFromCategory(initialValues.category) : 'qna',
  );
  const [isAnonymous, setIsAnonymous] = useState(initialValues?.isAnonymous ?? false);
  const [isPinned, setIsPinned] = useState(initialValues?.isPinned ?? false);
  const [isSponsored, setIsSponsored] = useState(initialValues?.isSponsored ?? false);
  const [sponsorNote, setSponsorNote] = useState(initialValues?.sponsorNote ?? '');
  const [images, setImages] = useState<PostImageItem[]>(initialValues?.images ?? []);

  const [taggedNotes, setTaggedNotes] = useState<Pick<Note, 'id' | 'teaName' | 'overallRating'>[]>(
    initialValues?.taggedNotes ?? [],
  );
  const [notePickerOpen, setNotePickerOpen] = useState(false);
  const [myNotes, setMyNotes] = useState<Pick<Note, 'id' | 'teaName' | 'overallRating'>[]>([]);
  const [noteSearch, setNoteSearch] = useState('');
  const [isNotesLoading, setIsNotesLoading] = useState(false);

  useEffect(() => {
    if (!initialValues) return;
    setTitle(initialValues.title);
    setContent(initialValues.content);
    setCategory(initialValues.category);
    setSelectedGroup(getGroupFromCategory(initialValues.category));
    setIsAnonymous(initialValues.isAnonymous);
    setIsPinned(initialValues.isPinned);
    setIsSponsored(initialValues.isSponsored);
    setSponsorNote(initialValues.sponsorNote);
    setImages(initialValues.images);
    setTaggedNotes(initialValues.taggedNotes);
  }, []);

  const fetchMyNotes = useCallback((query?: string) => {
    if (!user) return;
    setIsNotesLoading(true);
    notesApi.getAll(user.id, undefined, undefined, undefined, undefined, 'latest', 1, 20)
      .then((result: unknown) => {
        const notes: Note[] = Array.isArray(result)
          ? result
          : (result as { data?: Note[] })?.data ?? [];
        const filtered = query
          ? notes.filter((n) => (n.teaName ?? '').toLowerCase().includes(query.toLowerCase()))
          : notes;
        setMyNotes(filtered.map((n) => ({ id: n.id, teaName: n.teaName, overallRating: n.overallRating })));
      })
      .catch(() => setMyNotes([]))
      .finally(() => setIsNotesLoading(false));
  }, [user]);

  useEffect(() => {
    if (!notePickerOpen || !user) return;
    fetchMyNotes();
  }, [notePickerOpen, user, fetchMyNotes]);

  useEffect(() => {
    if (!notePickerOpen || !user) return;
    const timer = setTimeout(() => fetchMyNotes(noteSearch || undefined), 300);
    return () => clearTimeout(timer);
  }, [noteSearch, notePickerOpen, user, fetchMyNotes]);

  const toggleNoteTag = (note: Pick<Note, 'id' | 'teaName' | 'overallRating'>) => {
    setTaggedNotes((prev) => {
      const next = prev.some((n) => n.id === note.id)
        ? prev.filter((n) => n.id !== note.id)
        : prev.length >= 5 ? prev : [...prev, note];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      content,
      category,
      isAnonymous,
      isPinned,
      isSponsored,
      sponsorNote,
      images,
      taggedNoteIds: taggedNotes.map((n) => n.id),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-5">
      {/* 카테고리 선택 (2단계) */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-foreground">어떤 주제인가요?</label>
        <div className="flex flex-wrap gap-2">
          {WRITE_GROUPS.filter((g) => g.key !== 'announcement' || isAdmin).map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => {
                setSelectedGroup(g.key);
                setCategory(g.categories[0].value);
              }}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                selectedGroup === g.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">세부 주제</span>
          <div className="flex flex-wrap gap-2">
            {WRITE_GROUPS.find((g) => g.key === selectedGroup)?.categories.map(({ value, label, hint }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                title={hint}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  category === value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 제목 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="post-title">
          제목 <span className="text-destructive">*</span>
        </label>
        <Input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          maxLength={200}
        />
        <span className="text-xs text-muted-foreground text-right">{title.length}/200</span>
      </div>

      {/* 내용 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="post-content">
          내용 <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요. 마크다운(제목, 리스트, 링크, 테이블 등)을 사용할 수 있어요."
          rows={8}
        />
        <p className="text-xs text-muted-foreground">마크다운 문법 지원</p>
      </div>

      {/* 사진 */}
      <PostImageUploader images={images} onChange={setImages} maxImages={5} />

      {/* 차록 태그 */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setNotePickerOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <BookOpen className="w-4 h-4" />
          차록 태그하기 ({taggedNotes.length}/5)
          {notePickerOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>

        {taggedNotes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {taggedNotes.map((n) => (
              <span key={n.id} className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {n.teaName}
                {n.overallRating !== null && <span className="text-muted-foreground">({Number(n.overallRating).toFixed(1)})</span>}
                <button type="button" onClick={() => toggleNoteTag(n)} className="ml-0.5 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {notePickerOpen && (
          <div className="border border-border rounded-lg p-3 flex flex-col gap-2">
            <Input
              placeholder="차 이름으로 검색"
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
              {isNotesLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isNotesLoading && myNotes.map((n) => {
                const selected = taggedNotes.some((t) => t.id === n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => toggleNoteTag(n)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-md text-sm text-left transition-colors',
                      selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-foreground',
                    )}
                  >
                    <span>{n.teaName}</span>
                    {n.overallRating !== null && (
                      <span className="text-xs text-muted-foreground">★ {Number(n.overallRating).toFixed(1)}</span>
                    )}
                  </button>
                );
              })}
              {!isNotesLoading && myNotes.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {noteSearch ? '검색 결과가 없습니다.' : '작성한 차록이 없습니다.'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 공지 고정 (관리자만) */}
      {isAdmin && (
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <span className="text-sm font-medium text-foreground">공지로 고정</span>
          </label>
        </div>
      )}

      {/* 익명 */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-primary"
          />
          <span className="text-sm font-medium text-foreground">익명으로 작성</span>
        </label>
      </div>

      {/* 광고/협찬 */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isSponsored}
            onChange={(e) => setIsSponsored(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-primary"
          />
          <span className="text-sm font-medium text-foreground">광고/협찬 게시글</span>
        </label>

        {isSponsored && (
          <Input
            type="text"
            value={sponsorNote}
            onChange={(e) => setSponsorNote(e.target.value)}
            placeholder="협찬 다실 또는 내용을 입력하세요 (선택)"
            maxLength={300}
          />
        )}
      </div>

      {/* 제출 버튼 */}
      <Button
        type="submit"
        disabled={isSubmitting || !title.trim() || !content.trim()}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {mode === 'create' ? '작성 중...' : '수정 중...'}
          </>
        ) : (
          mode === 'create' ? '게시글 작성' : '게시글 수정'
        )}
      </Button>
    </form>
  );
}
