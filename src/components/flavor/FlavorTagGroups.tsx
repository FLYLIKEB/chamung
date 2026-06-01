import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';
import {
  FLAVOR_TAG_GROUP_META,
  getFlavorTagColor,
  groupFlavorTagLabels,
  type FlavorTagDisplayGroup,
} from '../../constants/flavorTags';

const groupHeaderClasses: Record<FlavorTagDisplayGroup, string> = {
  aroma:    'border-pink-200/60 bg-pink-50/60 dark:border-pink-900/40 dark:bg-pink-950/20',
  taste:    'border-amber-200/60 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20',
  mouthfeel:'border-sky-200/60 bg-sky-50/60 dark:border-sky-900/40 dark:bg-sky-950/20',
  finish:   'border-violet-200/60 bg-violet-50/60 dark:border-violet-900/40 dark:bg-violet-950/20',
  custom:   'border-border bg-muted/40',
};

const groupDotColors: Record<FlavorTagDisplayGroup, string> = {
  aroma:    'bg-pink-400',
  taste:    'bg-amber-400',
  mouthfeel:'bg-sky-400',
  finish:   'bg-violet-400',
  custom:   'bg-muted-foreground',
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
        <section key={group.group} className={cn('rounded-xl border p-3', groupHeaderClasses[group.group])}>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', groupDotColors[group.group])} />
              <h3 className="text-xs font-semibold text-foreground">
                {group.meta.labelKo}
                <span className="ml-1 font-normal text-muted-foreground">{group.meta.labelEn}</span>
              </h3>
            </div>
            <span className="shrink-0 rounded-full bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
              {group.tags.length}
            </span>
          </div>
          {!compact && (
            <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">{group.meta.descriptionKo}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {group.tags.map(({ label, definition }) => {
              const color = getFlavorTagColor(definition);
              const description = definition?.descriptionKo ?? FLAVOR_TAG_GROUP_META.custom.descriptionKo;
              const badge = (
                <Badge
                  variant="outline"
                  className={cn(
                    'h-auto cursor-pointer whitespace-normal rounded-full px-2.5 py-1 text-xs font-medium',
                    color.bg, color.text, color.border,
                  )}
                  title={description}
                  aria-label={definition ? `${label}: ${description}` : `${label}: 직접 입력한 향미`}
                >
                  {label}
                  {definition && !compact && (
                    <span className="ml-1 text-[10px] font-normal opacity-60">{definition.tagEn}</span>
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
