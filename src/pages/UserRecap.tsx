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
  TeaRecapSlideTone,
  createSvgDataUrl,
  createSvgFile,
  createTeaRecapSvg,
} from '@/utils/recap';

const SLIDE_TONE_CLASSES: Record<TeaRecapSlideTone, string> = {
  matcha: 'from-[#172516] via-[#406b36] to-[#d9e8b2] text-white',
  roast: 'from-[#24150f] via-[#855a37] to-[#f3d6a1] text-white',
  oolong: 'from-[#10222b] via-[#2e7780] to-[#bde8df] text-white',
  berry: 'from-[#2b1024] via-[#8b3f63] to-[#f2bdd4] text-white',
  night: 'from-[#0c1010] via-[#1f3324] to-[#dbe8c2] text-white',
};

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
    <div className="min-h-screen overflow-hidden bg-[#050806] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-5 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
        <RecapTopBar onClose={() => navigate(-1)} />

        <div className="mt-3 flex gap-1.5" aria-label="리캡 진행률">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
              aria-label={`${index + 1}번째 카드로 이동`}
            >
              <span className={cn('block h-full rounded-full bg-white transition-all', index <= activeIndex ? 'w-full' : 'w-0')} />
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedMonth(null)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              selectedMonth === null ? 'bg-white text-[#172516]' : 'bg-white/10 text-white/75',
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
                selectedMonth === month ? 'bg-white text-[#172516]' : 'bg-white/10 text-white/75',
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
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur disabled:opacity-20"
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
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur disabled:opacity-20"
            aria-label="다음 리캡 카드"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </main>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-white/55">{activeIndex + 1} / {slides.length}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={isLast ? handleShareRecap : goNext}
            className="rounded-full bg-white text-[#172516] hover:bg-white/90"
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
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/50">ChaLog</p>
        <p className="text-lg font-black tracking-tight text-white">Recap</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
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
      className={cn(
        'relative mx-auto flex aspect-[9/16] max-h-[70vh] w-full flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 shadow-2xl shadow-black/40',
        SLIDE_TONE_CLASSES[slide.tone],
      )}
      aria-label={slide.title}
    >
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-white/14 blur-3xl" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/65">{slide.eyebrow}</p>
            <p className="mt-2 text-sm font-semibold text-white/70">{periodLabel}</p>
          </div>
          <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/80">{profileName}</div>
        </div>

        <div className="mt-auto space-y-4 pb-4">
          {slide.metric && <p className="text-5xl font-black leading-none tracking-tight drop-shadow-sm">{slide.metric}</p>}
          <h1 className="text-3xl font-black leading-tight tracking-tight">{slide.title}</h1>
          <p className="text-base font-medium leading-7 text-white/78">{slide.description}</p>
          {slide.detail && <p className="rounded-2xl bg-white/14 px-4 py-3 text-sm font-semibold text-white/82 backdrop-blur">{slide.detail}</p>}

          {slide.isSummary && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button type="button" onClick={onShare} className="gap-2 rounded-2xl bg-white text-[#172516] hover:bg-white/90">
                <Share2 className="h-4 w-4" />
                공유
              </Button>
              <Button type="button" onClick={onDownload} variant="outline" className="gap-2 rounded-2xl border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
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
