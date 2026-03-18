import React from 'react';
import { cn } from './ui/utils';

interface FilterTab<T extends string> {
  key: T;
  label: React.ReactNode;
  tabClassName?: string;
  ariaLabel?: string;
}

interface FilterTabBarProps<T extends string> {
  tabs: FilterTab<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  className?: string;
  'aria-label'?: string;
}

export function FilterTabBar<T extends string>({
  tabs,
  activeKey,
  onChange,
  className,
  'aria-label': ariaLabel,
}: FilterTabBarProps<T>) {
  return (
    <div className={cn('flex items-center border-b border-border/40', className)}>
      <div
        className="flex overflow-x-auto scrollbar-hide px-4 gap-0 flex-1"
        role="group"
        aria-label={ariaLabel}
      >
        {tabs.map(({ key, label, tabClassName, ariaLabel }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={activeKey === key}
            aria-label={ariaLabel}
            className={cn(
              'shrink-0 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
              activeKey === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
              tabClassName,
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
