import React from 'react';
import { cn } from './ui/utils';
import { useIsKorean } from '../hooks/useLocale';
import { BrandMark } from './BrandMark';

interface ChaLogLogoProps {
  /** 아이콘만 표시 (제목과 함께 쓸 때) */
  iconOnly?: boolean;
  className?: string;
  size?: 'default' | 'compact';
  /** 클릭 시 홈으로 이동하는 버튼으로 렌더 */
  asButton?: boolean;
  onClick?: () => void;
}

/** 차멍 로고 - 먹색 단색 기하 패턴 마크. 한국어권: 차멍, 영어권: ChaMeong */
export function ChaLogLogo({ iconOnly = false, className, size = 'default', asButton, onClick }: ChaLogLogoProps) {
  const isKorean = useIsKorean();
  const isCompact = size === 'compact';

  const content = (
    <>
      <div className={cn('flex items-center justify-center shrink-0 text-primary', isCompact ? 'w-9 h-9' : 'w-11 h-11')}>
        <BrandMark className={isCompact ? 'w-9 h-9' : 'w-11 h-11'} />
      </div>
      {!iconOnly && (
        <span className={cn("font-['Nanum_Myeongjo'] font-bold tracking-[-0.04em] text-foreground pt-0.5", isCompact ? 'text-xl' : 'text-2xl')}>
          {isKorean ? '차멍' : 'ChaMeong'}
        </span>
      )}
    </>
  );

  const wrapperClass = cn(
    'flex items-center gap-0.5 transition-colors',
    isCompact ? 'min-h-[40px]' : 'min-h-[48px]',
    (asButton || onClick) && 'hover:opacity-80 cursor-pointer rounded-none px-1 -ml-1',
    className,
  );

  if (asButton || onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={wrapperClass}
        aria-label={isKorean ? '차멍 홈으로' : 'ChaMeong home'}
      >
        {content}
      </button>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
