import { useId } from 'react';
import { cn } from './ui/utils';

interface BrandMarkProps {
  className?: string;
  title?: string;
}

/**
 * 차멍 브랜드 마크.
 * 중앙 점을 기준으로 잎이 방사되는 기하학적 단색 패턴이다.
 */
export function BrandMark({ className, title }: BrandMarkProps) {
  const generatedId = useId();
  const titleId = title ? `${generatedId}-title` : undefined;

  return (
    <svg
      viewBox="0 0 64 64"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-labelledby={titleId}
      className={cn('block text-primary', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title id={titleId}>{title}</title>}
      <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 17c5.4 4.8 5.4 10.4 0 15.2C26.6 27.4 26.6 21.8 32 17Z" />
        <path d="M47 32c-4.8 5.4-10.4 5.4-15.2 0C36.6 26.6 42.2 26.6 47 32Z" />
        <path d="M32 47c-5.4-4.8-5.4-10.4 0-15.2C37.4 36.6 37.4 42.2 32 47Z" />
        <path d="M17 32c4.8-5.4 10.4-5.4 15.2 0C27.4 37.4 21.8 37.4 17 32Z" />
      </g>
      <circle cx="32" cy="32" r="3.2" fill="currentColor" />
    </svg>
  );
}
