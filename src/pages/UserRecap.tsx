import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Loader2, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';
import { formatMonthLabel } from '@/hooks/useReportData';
import { useUserRecapData } from '@/hooks/useUserRecapData';
import { logger } from '@/lib/logger';
import {
  TeaRecapSlide,
  createSvgDataUrl,
  createSvgFile,
  createTeaRecapSvg,
} from '@/utils/recap';

export function UserRecap() {
  const navigate = useNavigate();
  const { id } = useParams();
  const parsedUserId = id ? Number(id) : null;
  const userId = Number.isFinite(parsedUserId) ? parsedUserId : null;
  const [activeIndex, setActiveIndex] = useState(0);
  const {
    availableMonths,
    isLoading,
    isPrivateProfile,
    notes,
    profileName,
    selectedMonth,
    setSelectedMonth,
    slides,
    summary,
  } = useUserRecapData(userId);

  const activeSlide = slides[activeIndex] ?? slides[0];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === slides.length - 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedMonth]);

  const selectedMonthLabel = useMemo(
    () => selectedMonth ? formatMonthLabel(selectedMonth) : '전체 기간',
    [selectedMonth],
  );

  const goPrev = () => setActiveIndex((index) => Math.max(0, index - 1));
  const goNext = () => setActiveIndex((index) => Math.min(slides.length - 1, index + 1));

  const handleDownloadRecap = () => {
    const svg = createTeaRecapSvg(summary);
    const link = document.createElement('a');
    link.href = createSvgDataUrl(svg);
    link.download = `chalog-recap-${selectedMonth ?? 'all'}.svg`;
    link.click();
    toast.success('리캡 이미지를 저장했어요.');
  };

  const handleShareRecap = async () => {
    const svg = createTeaRecapSvg(summary);
    const file = createSvgFile(svg, `chalog-recap-${selectedMonth ?? 'all'}.svg`);
    const textShareData: ShareData = {
      title: summary.title,
      text: summary.shareText,
      url: window.location.href,
    };
    const fileShareData: ShareData = { ...textShareData, files: [file] };

    try {
      if (navigator.share && navigator.canShare?.(fileShareData)) {
        await navigator.share(fileShareData);
        toast.success('리캡 이미지를 공유했어요.');
        return;
      }
      if (navigator.share) {
        await navigator.share(textShareData);
        toast.success('리캡 공유창을 열었어요.');
        return;
      }
      await navigator.clipboard?.writeText(`${summary.shareText}\n${window.location.href}`);
      toast.success('리캡 내용을 클립보드에 복사했어요.');
    } catch (error) {
      logger.error('Failed to share recap:', error);
      handleDownloadRecap();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (isPrivateProfile || notes.length === 0 || !activeSlide) {
    return (
      <div className="flex min-h-screen flex-col bg-background px-5 py-6">
        <RecapTopBar onClose={() => navigate(-1)} />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted text-3xl">🍵</div>
          <h1 className="mt-5 text-xl font-bold text-foreground">
            {isPrivateProfile ? '비공개 프로필입니다' : '아직 리캡이 없어요'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPrivateProfile ? '공개된 기록만 리캡으로 볼 수 있어요.' : '차록을 작성하면 카드형 리캡이 만들어져요.'}
          </p>
          <Button className="mt-5" onClick={() => navigate(-1)}>돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-5 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
        <RecapTopBar onClose={() => navigate(-1)} />

        <div className="mt-3 flex gap-1.5" aria-label="리캡 진행률">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
              aria-label={`${index + 1}번째 카드로 이동`}
            >
              <span className={cn('block h-full rounded-full bg-foreground transition-all', index <= activeIndex ? 'w-full' : 'w-0')} />
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedMonth(null)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              selectedMonth === null ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
            )}
          >
            전체 기간
          </button>
          {availableMonths.map((month) => (
            <button
              key={month}
              type="button"
              onClick={() => setSelectedMonth(month)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                selectedMonth === month ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
              )}
            >
              {formatMonthLabel(month)}
            </button>
          ))}
        </div>

        <main className="relative mt-4 flex flex-1 items-center">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground disabled:opacity-20"
            aria-label="이전 리캡 카드"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <RecapStoryCard
            slide={activeSlide}
            profileName={profileName}
            periodLabel={selectedMonthLabel}
            onShare={handleShareRecap}
            onDownload={handleDownloadRecap}
          />

          <button
            type="button"
            onClick={goNext}
            disabled={isLast}
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground disabled:opacity-20"
            aria-label="다음 리캡 카드"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </main>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">{activeIndex + 1} / {slides.length}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={isLast ? handleShareRecap : goNext}
            className="rounded-full"
          >
            {isLast ? '공유하기' : '다음 카드'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RecapTopBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">ChaLog</p>
        <p className="text-lg font-black tracking-tight text-foreground">Recap</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground"
        aria-label="리캡 닫기"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function RecapStoryCard({
  slide,
  profileName,
  periodLabel,
  onShare,
  onDownload,
}: {
  slide: TeaRecapSlide;
  profileName: string;
  periodLabel: string;
  onShare: () => void;
  onDownload: () => void;
}) {
  return (
    <section
      className="relative mx-auto flex aspect-[9/16] max-h-[70vh] w-full flex-col overflow-hidden rounded-[2rem] border border-border bg-card p-6 text-card-foreground"
      aria-label={slide.title}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">{slide.eyebrow}</p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">{periodLabel}</p>
          </div>
          <div className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{profileName}</div>
        </div>

        <RecapSlideVisual slide={slide} />

        <div className="mt-auto space-y-4 pb-4">
          {slide.metric && <p className="text-5xl font-black leading-none tracking-tight text-foreground">{slide.metric}</p>}
          <h1 className="text-3xl font-black leading-tight tracking-tight text-foreground">{slide.title}</h1>
          <p className="text-base font-medium leading-7 text-muted-foreground">{slide.description}</p>
          {slide.detail && <p className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">{slide.detail}</p>}

          {slide.isSummary && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button type="button" onClick={onShare} className="gap-2 rounded-2xl">
                <Share2 className="h-4 w-4" />
                공유
              </Button>
              <Button type="button" onClick={onDownload} variant="outline" className="gap-2 rounded-2xl">
                <Download className="h-4 w-4" />
                저장
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function RecapSlideVisual({ slide }: { slide: TeaRecapSlide }) {
  const hasImage = Boolean(slide.visual.imageUrl);

  return (
    <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-border bg-muted">
      {hasImage ? (
        <div className="relative aspect-[4/3]">
          <img
            src={slide.visual.imageUrl ?? ''}
            alt={`${slide.visual.label} 리캡 이미지`}
            className="h-full w-full object-cover grayscale"
            loading="lazy"
          />
          <div className="absolute left-4 top-4 rounded-2xl border border-border bg-card/90 px-3 py-2 text-3xl">
            {slide.visual.emoji}
          </div>
        </div>
      ) : (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] border border-border bg-card text-5xl">
            {slide.visual.emoji}
          </div>
          <p className="text-sm font-semibold text-muted-foreground">{slide.visual.label}</p>
        </div>
      )}
    </div>
  );
}
