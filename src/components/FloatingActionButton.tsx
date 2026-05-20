import React, { ReactNode } from 'react';
import { cn } from './ui/utils';
import { AddLogoIcon } from './AddLogoIcon';
import { LIQUID_GLASS } from '../constants/liquidGlass';
import { LOGO_FAB_ABOVE_NAV_BOTTOM, LOGO_FAB_BUTTON_CLASS, LOGO_FAB_ICON_CLASS, LOGO_FAB_RIGHT_CLASS } from '../constants/logoFab';

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
        'minimal-fab-exception pointer-events-auto fixed z-[70] flex items-center justify-center rounded-full text-primary shadow-[0_10px_28px_rgba(43,41,38,0.22)] transition-transform hover:scale-[1.03] focus-visible:outline-none',
        LOGO_FAB_BUTTON_CLASS,
        LOGO_FAB_RIGHT_CLASS,
        LIQUID_GLASS.surface,
        LIQUID_GLASS.fab,
        positionClasses[position],
        className
      )}
      style={position === 'aboveNav' ? {
        bottom: LOGO_FAB_ABOVE_NAV_BOTTOM,
      } : undefined}
    >
      {children ?? <AddLogoIcon className={LOGO_FAB_ICON_CLASS} />}
    </button>
  );
}

