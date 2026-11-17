import React, { type FC, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from './ui/utils';
import '../styles/pixel-ratings.css';

const MIN = 1;
const MAX = 5;
const STEP = 0.5;

interface AxisStarRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string | null;
  minValue?: number;
  maxValue?: number;
  displayMultiplier?: number;
}

function snapToStep(v: number, min: number, max: number): number {
  const snapped = Math.round(v / STEP) * STEP;
  return Math.max(min, Math.min(max, snapped));
}

export const AxisStarRow: FC<AxisStarRowProps> = ({
  label,
  value,
  onChange,
  description,
  minValue = MIN,
  maxValue = MAX,
  displayMultiplier = 1,
}) => {
  const validatedValue = snapToStep(value, minValue, maxValue);
  const filledBlocks = Math.round(Math.max(0, Math.min(1, validatedValue / maxValue)) * 10);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const valueFromPointer = (clientX: number): number => {
    if (!rowRef.current) return validatedValue;
    const rect = rowRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return snapToStep(fraction * maxValue, minValue, maxValue);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(valueFromPointer(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    onChange(valueFromPointer(e.clientX));
  };

  const handlePointerUp = () => setDragging(false);

  return (
    <div className="pixel-rating-row pixel-rating-input">
      {/* 라벨 */}
      <div className="pixel-rating-label">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description?.trim() && (
          <Popover open={helpOpen} onOpenChange={setHelpOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`${label} 설명`}
              >
                <Info className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="max-w-[260px] text-sm">
              <p className="text-muted-foreground">{description}</p>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* 점수 */}
      <span className="pixel-rating-value" style={{ gridColumn: 3, gridRow: 1 }}>
        {(() => {
          const d = validatedValue * displayMultiplier;
          return d % 1 === 0 ? d.toFixed(0) : d.toString();
        })()}
      </span>

      {/* 드래그 및 키보드로 조절하는 도트 점수 */}
      <div
        ref={rowRef}
        className={cn(
          'pixel-rating-blocks select-none touch-none',
          dragging ? 'cursor-grabbing' : 'cursor-pointer',
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ gridColumn: 2, gridRow: 1 }}
        tabIndex={0}
        onKeyDown={(event) => {
          const nextValue = event.key === 'Home' ? minValue
            : event.key === 'End' ? maxValue
            : ['ArrowRight', 'ArrowUp'].includes(event.key) ? validatedValue + STEP
            : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? validatedValue - STEP
            : null;
          if (nextValue === null) return;
          event.preventDefault();
          onChange(snapToStep(nextValue, minValue, maxValue));
        }}
        role="slider"
        aria-label={`${label} 평점`}
        aria-valuenow={validatedValue}
        aria-valuemin={minValue}
        aria-valuemax={maxValue}
      >
        {Array.from({ length: 10 }, (_, index) => (
          <span key={index} className="pixel-rating-block" data-filled={index < filledBlocks} aria-hidden="true" />
        ))}
      </div>
    </div>
  );
};
