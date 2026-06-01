import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';
import {
  FLAVOR_TAG_GROUP_META,
  groupFlavorTagLabels,
  type FlavorTagDisplayGroup,
} from '../../constants/flavorTags';

const groupToneClasses: Record<FlavorTagDisplayGroup, string> = {
  aroma: 'border-pink-200/80 bg-pink-50/80 text-pink-900 dark:border-pink-900/60 dark:bg-pink-950/30 dark:text-pink-100',
  taste: 'border-amber-200/80 bg-amber-50/80 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100',
  mouthfeel: 'border-cyan-200/80 bg-cyan-50/80 text-cyan-900 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-100',
  finish: 'border-violet-200/80 bg-violet-50/80 text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-100',
  custom: 'border-border bg-muted/60 text-foreground',
};

interface FlavorTagGroupsProps {
  tags: readonly string[];
  linked?: boolean;
  className?: string;
  compact?: boolean;
}

export function FlavorTagGroups({ tags, linked = true, className, compact = false }: FlavorTagGroupsProps) {
  const groups = groupFlavorTagLabels(tags);

  if (groups.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)} aria-label="향미 스키마 그룹">
      {groups.map((group) => (
        <section key={group.group} className="rounded-xl border border-border/60 bg-background/45 p-3">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-foreground">
                {group.meta.labelKo} <span className="font-normal text-muted-foreground">{group.meta.labelEn}</span>
              </h3>
              {!compact && (
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{group.meta.descriptionKo}</p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {group.tags.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {group.tags.map(({ label, definition }) => {
              const description = definition?.descriptionKo ?? FLAVOR_TAG_GROUP_META.custom.descriptionKo;
              const badge = (
                <Badge
                  variant="outline"
                  className={cn('h-auto cursor-pointer whitespace-normal rounded-full px-2.5 py-1 text-xs font-medium', groupToneClasses[group.group])}
                  title={description}
                  aria-label={definition ? `${label}: ${description}` : `${label}: 직접 입력한 향미`}
                >
                  <span>{label}</span>
                  {definition && !compact && (
                    <span className="ml-1 text-[10px] font-normal opacity-70">{definition.tagEn}</span>
                  )}
                </Badge>
              );

              return linked ? (
                <Link key={label} to={`/tag/${encodeURIComponent(label)}`} className="inline-flex">
                  {badge}
                </Link>
              ) : (
                <span key={label} className="inline-flex">{badge}</span>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
