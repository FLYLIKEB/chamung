import { LucideIcon } from 'lucide-react';
import { cn } from './utils';

interface CtaButtonProps {
  onClick: () => void;
  icon?: LucideIcon;
  label: string;
  variant?: 'muted' | 'primary';
  className?: string;
}

export function CtaButton({ onClick, icon: Icon, label, variant = 'muted', className }: CtaButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-none bg-transparent border-0 text-sm font-medium underline underline-offset-[0.32em] decoration-current transition-colors',
        variant === 'primary'
          ? 'text-foreground hover:text-foreground/65 font-semibold'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}
