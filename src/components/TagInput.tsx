import React, { useState, useRef, useMemo } from 'react';
import { Info, X } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { AddLogoIcon } from './AddLogoIcon';
import {
  FLAVOR_TAG_GROUP_META,
  FLAVOR_TAG_GROUP_ORDER,
  FLAVOR_TAGS,
  type FlavorTagDefinition,
  type FlavorTagGroup,
} from '../constants/flavorTags';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

function TagTooltip({ description }: { description: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        aria-label="향미 설명 보기"
        tabIndex={-1}
      >
        <Info className="h-3 w-3" />
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 w-48 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-[11px] leading-relaxed text-popover-foreground shadow-md">
          {description}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border" />
        </span>
      )}
    </span>
  );
}

export function TagInput({ tags, onChange, maxTags = 10 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isSearching = inputValue.trim().length > 0;

  const filteredSuggestions = useMemo(() => {
    const normalizedInput = inputValue.trim().replace(/\s+/g, '').toLowerCase();
    return FLAVOR_TAGS.filter((tag) => {
      if (tags.includes(tag.tagKo)) return false;
      if (!normalizedInput) return true;
      const searchable = [tag.tagKo, tag.tagEn, tag.category, tag.descriptionKo]
        .join(' ').replace(/\s+/g, '').toLowerCase();
      return searchable.includes(normalizedInput);
    });
  }, [inputValue, tags]);

  const groupedSuggestions = useMemo(() => {
    const byGroup = new Map<FlavorTagGroup, FlavorTagDefinition[]>();
    filteredSuggestions.forEach((tag) => {
      const group = byGroup.get(tag.group) ?? [];
      group.push(tag);
      byGroup.set(tag.group, group);
    });
    return FLAVOR_TAG_GROUP_ORDER.map((group) => ({
      group,
      meta: FLAVOR_TAG_GROUP_META[group],
      tags: byGroup.get(group) ?? [],
    })).filter((g) => g.tags.length > 0);
  }, [filteredSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing && e.key === 'Enter') return;

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (isProcessing) return;
      const currentValue = (e.target as HTMLInputElement).value.trim();
      if (currentValue) {
        setIsProcessing(true);
        addTag(currentValue);
        (e.target as HTMLInputElement).value = '';
        setInputValue('');
        setTimeout(() => setIsProcessing(false), 100);
      }
    } else if (e.key === 'Backspace') {
      const currentValue = (e.target as HTMLInputElement).value;
      if (!currentValue && tags.length > 0) {
        e.preventDefault();
        removeTag(tags.length - 1);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag || tags.includes(trimmedTag) || tags.length >= maxTags) return;
    onChange([...tags, trimmedTag]);
    setInputValue('');
    setTimeout(() => {
      if (inputRef.current) inputRef.current.value = '';
    }, 0);
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <Label>향미</Label>

      {/* 맞춤차 향미 */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
        <div className="mb-2 px-1">
          <p className="text-xs font-medium text-foreground">맞춤차 향미</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            향·맛·질감·여운 스키마에 맞춰 차록에 남길 감각을 고르세요.
          </p>
        </div>

        {groupedSuggestions.length > 0 ? (
          <div className="space-y-3">
            {groupedSuggestions.map(({ group, meta, tags: suggestionTags }) => (
              <section key={group} aria-label={`${meta.labelKo} ${meta.labelEn} 향미 추천`}>
                <div className="mb-1.5 flex items-center gap-1.5 border-b border-border/40 pb-1 px-1">
                  <span className="text-[11px] font-semibold text-foreground">{meta.labelKo}</span>
                  <span className="text-[10px] font-normal text-muted-foreground">{meta.labelEn}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestionTags.map((tag) => (
                    <button
                      key={tag.tagId}
                      type="button"
                      onClick={() => addTag(tag.tagKo)}
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-muted active:scale-95"
                      aria-label={`${tag.tagKo} 향미 추가`}
                    >
                      <AddLogoIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {tag.tagKo}
                      <TagTooltip description={tag.descriptionKo} />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            일치하는 스키마 향미가 없습니다. 직접 입력해 추가할 수 있어요.
          </p>
        )}
      </div>

      {/* 선택된 태그 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-1 rounded-full p-0.5 hover:bg-gray-300"
                aria-label={`${tag} 향미 삭제`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 직접 입력 */}
      <Input
        ref={inputRef}
        type="text"
        placeholder="향미를 직접 입력하거나 위에서 선택하세요"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        disabled={tags.length >= maxTags}
      />

      <p className="text-xs text-muted-foreground">
        {tags.length >= maxTags
          ? `최대 ${maxTags}개까지 추가할 수 있습니다.`
          : `Enter 키로 직접 추가하거나 맞춤차 향미를 클릭하세요. (${tags.length}/${maxTags})`}
      </p>
    </div>
  );
}
