import { useNavigate } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/components/ui/utils';
import { BrandMark } from '@/components/BrandMark';

interface PersonalizedHeroProps {
  hasTodayNote: boolean;
  streak: number;
  className?: string;
}

export function PersonalizedHero({ hasTodayNote, streak, className }: PersonalizedHeroProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        '-mx-4 sm:-mx-6 -mt-6 sm:-mt-8',
        'px-5 pt-7 pb-8 sm:px-6 sm:pt-9 sm:pb-10',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center opacity-[0.035]" aria-hidden>
        <BrandMark className="h-40 w-40 text-foreground" />
      </div>

      <div className="relative mx-auto max-w-xl text-center">
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.42em] text-muted-foreground/70">
          ChaMeong Journal
        </p>
        {user ? (
          <div className="space-y-3">
            <h2 className="font-['Nanum_Myeongjo'] text-[2rem] font-bold leading-[1.08] tracking-[-0.08em] text-foreground sm:text-[2.45rem]">
              {hasTodayNote
                ? `${user.name}님의 오늘 차록.`
                : `${user.name}님, 오늘의 차를 남겨요.`}
            </h2>
            <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
              {streak > 0 ? `${streak}일째 이어지는 조용한 취향의 기록.` : '차 한 잔의 온도와 향을 가장 단순한 문장으로 남겨보세요.'}
            </p>
            {!hasTodayNote && (
              <button
                onClick={() => navigate('/note/new')}
                className="mx-auto mt-1 flex items-center gap-1.5 py-1 text-xs font-medium text-foreground transition-colors hover:text-foreground/65"
              >
                <PenLine className="h-3 w-3" aria-hidden />
                차록 쓰기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-['Nanum_Myeongjo'] text-[2rem] font-bold leading-[1.08] tracking-[-0.08em] text-foreground sm:text-[2.45rem]">
              차를 마시고, 소중한 순간을 기록하세요.
            </h2>
            <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
              다우들의 차록으로 새로운 차를 발견하세요.
            </p>
          </div>
        )}
        <div className="mx-auto mt-6 h-px w-16 bg-foreground/20" aria-hidden />
      </div>
    </section>
  );
}
