import { Skeleton } from './ui/skeleton';

export function NoteCardSkeleton() {
  return (
    <div className="min-h-44 h-full w-full rounded-sm border border-border/35 bg-card flex flex-col gap-3 p-3">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="mt-auto h-3 w-1/2" />
    </div>
  );
}
