import { useRef } from 'react';
import { RefreshCw, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { useAppMode } from '@/contexts/AppModeContext';

type ModeCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  accentClass: string;
  inactiveClass: string;
};

function ModeCard({ title, description, icon, isActive, onClick, accentClass, inactiveClass }: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-shrink-0 w-64 rounded-2xl p-4 text-left transition-all active:scale-[0.98] snap-start',
        isActive
          ? `${accentClass} shadow-md`
          : inactiveClass,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center',
          'bg-white/20',
        )}>
          {icon}
        </div>
        <div className="flex items-center gap-1">
          {isActive && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20">
              ON
            </span>
          )}
          <ChevronRight className="w-4 h-4 opacity-50" />
        </div>
      </div>
      <p className={cn(
        'text-sm font-semibold',
        'text-inherit',
      )}>
        {title}
      </p>
      <p className={cn(
        'text-xs mt-0.5 line-clamp-2',
        'opacity-80',
      )}>
        {description}
      </p>
    </button>
  );
}

export function ModeCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { sessionMode, blindMode, toggleSessionMode, toggleBlindMode } = useAppMode();

  const modes = [
    {
      title: '다회 모드',
      description: '같은 차를 여러 번 우려내며 회차별 변화를 기록해요.',
      icon: <RefreshCw className="w-4.5 h-4.5 text-white" />,
      isActive: sessionMode.active,
      onClick: toggleSessionMode,
      accentClass: 'bg-[#1a8a30] text-white shadow-md',
      inactiveClass: 'bg-[#1db93c] text-white hover:bg-[#1a8a30]',
    },
    {
      title: '블라인드 테이스팅',
      description: '차 정보 없이 순수한 감각으로 맛과 향을 평가해요.',
      icon: <EyeOff className="w-4.5 h-4.5 text-white" />,
      isActive: blindMode.active,
      onClick: toggleBlindMode,
      accentClass: 'bg-violet-700 text-white shadow-md',
      inactiveClass: 'bg-violet-600 text-white hover:bg-violet-700',
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
