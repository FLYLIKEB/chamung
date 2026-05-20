import { BrandMark } from './BrandMark';
import { cn } from './ui/utils';

type AddLogoIconProps = {
  className?: string;
  title?: string;
};

/** Shared logo-shaped replacement for add/plus affordances. */
export function AddLogoIcon({ className, title }: AddLogoIconProps) {
  return <BrandMark title={title} className={cn('shrink-0', className)} />;
}
