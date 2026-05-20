import React, { ReactNode } from 'react';
import { cn } from './ui/utils';
import { AddLogoIcon } from './AddLogoIcon';
import { LIQUID_GLASS } from '../constants/liquidGlass';

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
        'minimal-fab-exception pointer-events-auto fixed right-6 z-[70] flex h-14 w-14 items-center justify-center rounded-full text-primary shadow-[0_10px_28px_rgba(43,41,38,0.22)] transition-transform hover:scale-[1.03] focus-visible:outline-none',
        LIQUID_GLASS.surface,
        LIQUID_GLASS.fab,
        positionClasses[position],
        className
      )}
      style={position === 'aboveNav' ? {
        bottom: 'calc(var(--bottom-nav-spacer) + 0.75rem)',
      } : undefined}
    >
      {children ?? <AddLogoIcon className="h-8 w-8" />}
    </button>
  );
}

