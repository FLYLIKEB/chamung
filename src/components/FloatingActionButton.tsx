import React, { ReactNode } from 'react';
import { cn } from './ui/utils';

type FloatingActionButtonProps = {
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  position?: 'default' | 'aboveNav';
  children?: ReactNode;
};

const positionClasses: Record<NonNullable<FloatingActionButtonProps['position']>, string> = {
  default: 'bottom-6', // 1.5rem = 24px
  aboveNav: 'md:bottom-6', // 데스크톱: 24px (BottomNav 없음), 모바일은 style로 처리
};

export function FloatingActionButton({
  onClick,
  ariaLabel = '새 항목 추가',
  className,
  position = 'default',
  children,
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'minimal-fab-exception fixed right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-[0_2px_12px_rgba(43,41,38,0.22)] flex items-center justify-center transition-colors hover:bg-primary/90 focus-visible:outline-none',
        positionClasses[position],
        className
      )}
      style={position === 'aboveNav' ? {
        bottom: 'calc(var(--bottom-nav-spacer) + 0.75rem)',
      } : undefined}
    >
      {children}
    </button>
  );
}

