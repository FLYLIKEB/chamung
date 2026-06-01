import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
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

export function TagInput({ tags, onChange, maxTags = 10 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 입력값에 따라 추천 태그 필터링
  const filteredSuggestions = useMemo(() => {
    const normalizedInput = inputValue.trim().replace(/\s+/g, '').toLowerCase();
    return FLAVOR_TAGS.filter((tag) => {
      if (tags.includes(tag.tagKo)) {
        return false;
      }
      if (!normalizedInput) {
        return true;
      }
      const searchable = [
        tag.tagKo,
        tag.tagEn,
        tag.category,
        tag.descriptionKo,
      ].join(' ').replace(/\s+/g, '').toLowerCase();
      return searchable.includes(normalizedInput);
    }).slice(0, 24);
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
    })).filter((group) => group.tags.length > 0);
  }, [filteredSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 입력 중(조합 중)일 때는 Enter 키를 무시
    if (isComposing && e.key === 'Enter') {
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      // 중복 처리 방지
      if (isProcessing) {
        return;
      }
      
      // 이벤트에서 직접 최신 값을 가져오기 (상태 업데이트 지연 방지)
      const currentValue = (e.target as HTMLInputElement).value.trim();
      
      if (currentValue) {
        setIsProcessing(true);
        addTag(currentValue);
        // 입력 필드를 즉시 비우기
        (e.target as HTMLInputElement).value = '';
        setInputValue('');
        
        // 처리 완료 후 플래그 해제
        setTimeout(() => {
          setIsProcessing(false);
        }, 100);
      }
    } else if (e.key === 'Backspace') {
      const currentValue = (e.target as HTMLInputElement).value;
      if (!currentValue && tags.length > 0) {
        // 빈 입력 상태에서 Backspace 누르면 마지막 태그 제거
        e.preventDefault();
        removeTag(tags.length - 1);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const addTag = (tag: string) => {
    // 공백 제거 및 검증
    const trimmedTag = tag.trim();
    if (!trimmedTag || trimmedTag.length === 0) {
      return;
    }
    
    // 중복 체크
    if (tags.includes(trimmedTag)) {
      return;
    }
    
    // 최대 개수 체크
    if (tags.length >= maxTags) {
      return;
    }
    
    // 태그 추가
    onChange([...tags, trimmedTag]);
    setInputValue('');
    
    // 입력 필드 값 초기화 (포커스는 이동하지 않음)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }, 0);
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleSuggestionClick = (tag: string) => {
    addTag(tag);
  };

  return (
    <div
      ref={containerRef}
      className="space-y-2"
    >
      <Label>향미</Label>

      {/* 맞춤차 향미 - 항상 위에 표시 */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
        <div className="mb-2 px-1">
          <p className="text-xs font-medium text-foreground">맞춤차 향미</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            향·맛·질감·여운 스키마에 맞춰 차록에 남길 감각을 고르세요.
          </p>
        </div>
        {groupedSuggestions.length > 0 ? (
          <div className="space-y-2">
            {groupedSuggestions.map(({ group, meta, tags: suggestionTags }) => (
              <section key={group} aria-label={`${meta.labelKo} ${meta.labelEn} 향미 추천`}>
                <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>{meta.labelKo}</span>
                  <span className="font-normal">{meta.labelEn}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestionTags.map((tag) => (
                    <Button
                      key={tag.tagId}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-[34px] h-auto max-w-full py-1 px-2 text-left text-[11px] leading-tight"
                      onClick={() => handleSuggestionClick(tag.tagKo)}
                      title={tag.descriptionKo}
                      aria-label={`${tag.tagKo} 향미 추가`}
                    >
                      <AddLogoIcon className="w-4 h-4 mr-1 shrink-0" />
                      <span className="min-w-0">
                        <span className="block font-medium">{tag.tagKo}</span>
                        <span className="block max-w-[9rem] truncate text-[10px] font-normal text-muted-foreground">{tag.descriptionKo}</span>
                      </span>
                    </Button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="px-1 py-2 text-xs text-muted-foreground">일치하는 스키마 향미가 없습니다. 직접 입력해 추가할 수 있어요.</p>
        )}
      </div>
      
      {/* 입력된 태그 표시 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                aria-label={`${tag} 향미 삭제`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 태그 입력 필드 */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="향미를 입력하거나 맞춤차 향미를 선택하세요"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          disabled={tags.length >= maxTags}
        />

      </div>

      {/* 도움말 텍스트 */}
      <p className="text-xs text-gray-500">
        {tags.length >= maxTags
          ? `최대 ${maxTags}개까지 추가할 수 있습니다.`
          : `Enter 키로 향미를 추가하거나 맞춤차 향미를 클릭하세요. (${tags.length}/${maxTags})`}
      </p>
    </div>
  );
}
