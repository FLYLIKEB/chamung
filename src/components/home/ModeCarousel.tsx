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
  gradientClass: string;
  tag?: string;
  tagClass?: string;
};

function ModeCard({ title, description, icon, isActive, onClick, gradientClass, tag, tagClass }: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-shrink-0 w-56 rounded-2xl px-3.5 py-3 text-left transition-all active:scale-[0.98] snap-start',
        'text-white shadow-md',
        gradientClass,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20">
          {icon}
        </div>
        <div className="flex items-center gap-1">
          {tag && (
            <span className={cn(
              'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
              tagClass ?? 'bg-white/25 text-white',
            )}>
              {tag}
            </span>
          )}
          {isActive && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/30 text-white">
              ON
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        </div>
      </div>
      <p className="text-[13px] font-semibold">
        {title}
      </p>
      <p className="text-[11px] mt-0.5 line-clamp-2 opacity-75">
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
      icon: <RefreshCw className="w-4 h-4 text-white" />,
      isActive: sessionMode.active,
      onClick: toggleSessionMode,
      gradientClass: 'bg-gradient-to-br from-primary/90 to-primary',
      tag: 'NEW',
      tagClass: 'bg-white/25 text-white',
    },
    {
      title: '블라인드 테이스팅',
      description: '친구를 초대해 함께! 차 정보 없이 감각만으로 평가하고 결과를 비교해요.',
      icon: <EyeOff className="w-4 h-4 text-white" />,
      isActive: blindMode.active,
      onClick: toggleBlindMode,
      gradientClass: 'bg-gradient-to-br from-violet-500 to-purple-700',
      tag: 'NEW',
      tagClass: 'bg-yellow-400 text-yellow-900',
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
