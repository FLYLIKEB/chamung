import { cn } from './ui/utils';
import { BrandMark } from './BrandMark';

interface HeroSectionProps {
  className?: string;
}

/** 홈 화면 상단 Hero - 차멍 소개 및 앱 설명 */
export function HeroSection({ className }: HeroSectionProps) {
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
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.42em] text-muted-foreground/70">ChaMeong Journal</p>
        <h2 className="font-['Nanum_Myeongjo'] text-[2rem] font-bold leading-[1.08] tracking-[-0.08em] text-foreground sm:text-[2.45rem]">
          차를 마시고, 소중한 순간을 기록하세요.
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
          다우들의 차록으로 새로운 차를 발견하세요.
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-foreground/20" aria-hidden />
      </div>
    </section>
  );
}
