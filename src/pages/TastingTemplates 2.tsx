import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { AddTemplateModal } from '../components/AddTemplateModal';
import { notesApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Pin, PinOff, Plus, Loader2, ChevronRight, Pencil } from 'lucide-react';
import { cn } from '../components/ui/utils';

interface RatingAxis {
  id: number;
  nameKo: string;
  nameEn: string;
  displayOrder: number;
}

interface RatingSchema {
  id: number;
  code: string;
  nameKo: string;
  descriptionKo?: string;
  axes?: RatingAxis[];
  isActive: boolean;
}

export function TastingTemplates() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [schemas, setSchemas] = useState<RatingSchema[]>([]);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [axesMap, setAxesMap] = useState<Record<number, RatingAxis[]>>({});
  const [editTarget, setEditTarget] = useState<{
    id: number;
    nameKo: string;
    descriptionKo?: string;
    axes?: RatingAxis[];
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchSchemas();
  }, [authLoading, isAuthenticated, navigate]);

  const fetchSchemas = async () => {
    setIsLoading(true);
    try {
      const result = await notesApi.getActiveSchemas();
      setSchemas(result.schemas);
      setPinnedIds(result.pinnedSchemaIds);
    } catch {
      toast.error('템플릿을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePin = async (schemaId: number) => {
    try {
      await notesApi.toggleSchemaPin(schemaId);
      setPinnedIds((prev) =>
        prev.includes(schemaId)
          ? prev.filter((id) => id !== schemaId)
          : [...prev, schemaId],
      );
      toast.success(pinnedIds.includes(schemaId) ? '고정 해제했습니다.' : '고정했습니다.');
    } catch {
      toast.error('고정 처리에 실패했습니다.');
    }
  };

  const handleExpand = async (schemaId: number) => {
    if (expandedId === schemaId) { setExpandedId(null); return; }
    setExpandedId(schemaId);
    if (!axesMap[schemaId]) {
      try {
        const axes = await notesApi.getSchemaAxes(schemaId);
        setAxesMap((prev) => ({ ...prev, [schemaId]: axes }));
      } catch {
        toast.error('평가 항목을 불러오는데 실패했습니다.');
      }
    }
  };

  const handleCreated = (_schema: unknown) => {
    setIsModalOpen(false);
    fetchSchemas();
    toast.success('템플릿이 생성되었습니다.');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="테이스팅 템플릿" showBack />
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="테이스팅 템플릿" showBack />

      <div className="px-4 py-5 md:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">차록 작성 시 사용할 평가 템플릿을 관리하세요.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold transition-colors hover:bg-primary/90 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            새 템플릿
          </button>
        </div>

        <div className="space-y-2">
          {schemas.map((schema) => {
            const isPinned = pinnedIds.includes(schema.id);
            const isExpanded = expandedId === schema.id;
            const axes = axesMap[schema.id];
            return (
              <div
                key={schema.id}
                className="rounded-xl border border-border/30 bg-card overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => handleExpand(schema.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{schema.nameKo}</span>
                      {isPinned && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">고정됨</span>
                      )}
                    </div>
                    {schema.descriptionKo && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{schema.descriptionKo}</p>
                    )}
                  </div>
                  <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', isExpanded && 'rotate-90')} />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
                    {axes ? (
                      <div className="space-y-1.5">
                        {axes.sort((a, b) => a.displayOrder - b.displayOrder).map((axis) => (
                          <div key={axis.id} className="flex items-center gap-2 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                            <span className="text-foreground font-medium">{axis.nameKo}</span>
                            <span className="text-muted-foreground">({axis.nameEn})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePin(schema.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          isPinned
                            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                            : 'bg-primary/10 text-primary hover:bg-primary/20',
                        )}
                      >
                        {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        {isPinned ? '고정 해제' : '고정하기'}
                      </button>
                      {schema.code.startsWith('CUSTOM_') && (
                        <button
                          onClick={() => setEditTarget({
                            id: schema.id,
                            nameKo: schema.nameKo,
                            descriptionKo: schema.descriptionKo,
                            axes,
                          })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          수정하기
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {schemas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">아직 템플릿이 없습니다.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 text-sm text-primary font-medium"
            >
              첫 템플릿 만들기
            </button>
          </div>
        )}
      </div>

      <AddTemplateModal
        open={isModalOpen || !!editTarget}
        onOpenChange={(open) => {
          if (!open) { setIsModalOpen(false); setEditTarget(null); }
          else setIsModalOpen(open);
        }}
        onSuccess={handleCreated}
        editSchema={editTarget}
      />

      <BottomNav />
    </div>
  );
}
