import { cn } from './ui/utils';
import { BrandMark } from './BrandMark';

interface HeroSectionProps { className?: string; }

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={cn('pixel-hero flex items-center justify-between gap-4 p-6 sm:p-9', className)}>
      <div>
        <h2 className="break-keep text-balance [overflow-wrap:anywhere]">차를 기록하고, 함께 나눠요.</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">마신 차의 향과 맛을 남기고 다우들의 차록을 살펴보세요.</p>
      </div>
      <BrandMark className="hidden h-20 w-20 shrink-0 sm:block" />
    </section>
  );
}
