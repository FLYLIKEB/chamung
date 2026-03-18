import { ReactNode } from 'react';
import { cn } from './utils';

interface PageListContentProps {
  children: ReactNode;
  className?: string;
}

export function PageListContent({ children, className }: PageListContentProps) {
  return (
    <div className={cn('bg-transparent', className)}>
      {children}
    </div>
  );
}
