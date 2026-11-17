import { useId } from 'react';
import { cn } from './ui/utils';

interface BrandMarkProps {
  className?: string;
  title?: string;
}

/**
 * 차멍 브랜드 마크.
 * 4px 격자 위에 찻잔과 김을 그린 도트 마크.
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
      <g fill="currentColor" shapeRendering="crispEdges">
        <path d="M24 8h4v8h-4zM28 4h4v4h-4zM36 8h4v8h-4zM40 4h4v4h-4zM20 20h24v4H20zM16 24h4v16h-4zM20 40h4v4h-4zM24 44h16v4H24zM40 40h4v4h-4zM44 24h4v16h-4zM48 24h8v4h-8zM52 28h4v8h-4zM48 36h4v4h-4zM12 52h40v4H12z" />
        <path d="M24 28h16v8H24z" opacity=".3" />
      </g>
    </svg>
  );
}
