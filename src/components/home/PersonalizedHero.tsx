import { useNavigate } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/components/ui/utils';
import { BrandMark } from '@/components/BrandMark';
import { HeroSection } from '@/components/HeroSection';

interface PersonalizedHeroProps {
  hasTodayNote: boolean;
  streak: number;
  className?: string;
}

export function PersonalizedHero({ hasTodayNote, streak, className }: PersonalizedHeroProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return <HeroSection className={className} />;

  return (
    <section className={cn('flex items-center justify-between gap-4 border-0 bg-transparent py-6 shadow-none sm:py-9', className)}>
      <div className="space-y-3">
        <h2 className="break-keep text-balance text-[clamp(1.5rem,4vw,2.25rem)] font-normal leading-[1.45] [overflow-wrap:anywhere]">{hasTodayNote ? `${user.name}님의 오늘 차록.` : `${user.name}님, 오늘의 차를 남겨요.`}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {streak > 0 ? `${streak}일 연속 기록 중입니다.` : '오늘 마신 차의 향과 맛을 기록해 보세요.'}
        </p>
        {!hasTodayNote && (
          <button onClick={() => navigate('/note/new')} className="flex items-center gap-1.5 border-0 bg-transparent py-2 text-sm shadow-none underline underline-offset-4">
            <PenLine className="h-4 w-4" aria-hidden />차록 쓰기
          </button>
        )}
      </div>
      <BrandMark className="hidden h-20 w-20 shrink-0 sm:block" />
    </section>
  );
}
