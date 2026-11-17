import { cn } from './ui/utils';

interface HeroSectionProps { className?: string; }

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={cn('py-6 sm:py-9', className)}>
      <div>
        <h2 className="break-keep text-balance text-[clamp(1.5rem,4vw,2.25rem)] font-normal leading-[1.45] [overflow-wrap:anywhere]">차를 기록하고, 함께 나눠요.</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">마신 차의 향과 맛을 남기고 다우들의 차록을 살펴보세요.</p>
      </div>
    </section>
  );
}
