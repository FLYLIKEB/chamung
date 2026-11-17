import { useRef } from 'react';
import { RefreshCw, EyeOff, ChevronRight } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { useAppMode } from '@/contexts/AppModeContext';

type ModeCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
};

function ModeCard({ title, description, icon, isActive, onClick }: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mode-card-exception flex-shrink-0 w-56 rounded-sm px-3.5 py-3 text-left transition-colors snap-start no-underline bg-card text-card-foreground border border-border',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-muted border-0">
          {icon}
        </div>
        <div className="flex items-center gap-1">
          {isActive && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-muted text-foreground">
              진행 중
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 opacity-35" />
        </div>
      </div>
      <p className="font-title text-sm">
        {title}
      </p>
      <p className="text-sm mt-0.5 line-clamp-2 opacity-75">
        {description}
      </p>
    </button>
  );
}

export function ModeCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { sessionMode, blindMode, toggleSessionMode, toggleBlindMode } = useAppMode();

  const modes: ModeCardProps[] = [
    {
      title: '다회 모드',
      description: '같은 차를 여러 번 우려내며 회차별 변화를 기록해요.',
      icon: <RefreshCw className="w-4 h-4 text-foreground" />,
      isActive: sessionMode.active,
      onClick: toggleSessionMode,
    },
    {
      title: '블라인드 테이스팅',
      description: '친구를 초대해 함께! 차 정보 없이 감각만으로 평가하고 결과를 비교해요.',
      icon: <EyeOff className="w-4 h-4 text-foreground" />,
      isActive: blindMode.active,
      onClick: toggleBlindMode,
    },
  ];

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
    >
      {modes.map((mode) => (
        <ModeCard key={mode.title} {...mode} />
      ))}
    </div>
  );
}
