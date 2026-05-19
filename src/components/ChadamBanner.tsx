import { cn } from './ui/utils';
import { BrandMark } from './BrandMark';

interface ChadamBannerProps {
  className?: string;
}

/** 차담(게시판) 페이지 상단 배너 */
export function ChadamBanner({ className }: ChadamBannerProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden',
        '-mx-4 -mt-4',
        'px-5 py-4 sm:px-6 sm:py-5',
        className,
      )}
    >
      <div
        className="absolute right-6 top-1/2 -translate-y-1/2 w-44 h-44 sm:w-56 sm:h-56 opacity-[0.035] pointer-events-none"
        aria-hidden
      >
        <BrandMark className="w-full h-full" />
      </div>

      <div className="relative flex flex-col gap-1.5">
        <div className="space-y-1">
          <p className="text-sm sm:text-base text-foreground/90 font-medium leading-snug">
            차를 사랑하는 사람들의 이야기
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            차 추천, 차를 우리는 방법, 다실 후기 등 다양한 이야기를 나눠보세요.
          </p>
        </div>
      </div>
    </section>
  );
}
