import { Flame, Trophy } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface StreakCardsProps {
  current: number;
  longest: number;
  className?: string;
}

export function StreakCards({ current, longest, className }: StreakCardsProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      <div className="rounded-2xl border border-border/30 bg-card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
          <Flame className="w-4.5 h-4.5 text-orange-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold leading-tight">{current}</span>
          <span className="text-[11px] text-muted-foreground">현재 연속</span>
        </div>
      </div>
      <div className="rounded-2xl border border-border/30 bg-card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
          <Trophy className="w-4.5 h-4.5 text-yellow-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold leading-tight">{longest}</span>
          <span className="text-[11px] text-muted-foreground">최장 연속</span>
        </div>
      </div>
    </div>
  );
}
