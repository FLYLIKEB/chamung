import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import '../styles/pixel-ratings.css';

interface RatingVisualizationProps {
  use10Scale?: boolean;
  variant?: 'default' | 'poster';
  axisValues: Array<{
    axisId: number;
    valueNumeric: number;
    axis?: {
      id: number;
      nameKo: string;
      nameEn: string;
      descriptionKo?: string | null;
      minValue?: number;
      maxValue: number;
      displayOrder: number;
    };
  }>;
}

export function RatingVisualization({ axisValues, use10Scale = false, variant = 'default' }: RatingVisualizationProps) {
  const sortedAxisValues = [...axisValues].sort((a, b) =>
    (a.axis?.displayOrder || 0) - (b.axis?.displayOrder || 0),
  );

  if (sortedAxisValues.length === 0) return null;

  return (
    <div className={`pixel-ratings ${variant === 'poster' ? 'rating-visualization-poster' : ''}`}>
      {sortedAxisValues.map((item) => {
        const value = Number(item.valueNumeric) || 0;
        const max = Number(item.axis?.maxValue) || 5;
        const displayValue = use10Scale ? value * (10 / max) : value;
        const displayMax = use10Scale ? 10 : max;
        const label = item.axis?.nameKo || `축 ${item.axisId}`;
        const filled = Math.round(Math.max(0, Math.min(1, value / max)) * 10);

        return (
          <div key={item.axisId} className="pixel-rating-row">
            <div className="pixel-rating-label">
              <span>{label}</span>
              {item.axis?.descriptionKo?.trim() && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="pixel-rating-help" aria-label={`${label} 설명 보기`}>
                      <Info className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" side="top" className="max-w-[280px] text-sm">
                    <p className="text-muted-foreground">{item.axis.descriptionKo}</p>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="pixel-rating-blocks" role="img" aria-label={`${label} ${Number(displayValue.toFixed(1))}/${displayMax}점`}>
              {Array.from({ length: 10 }, (_, index) => (
                <span key={index} className="pixel-rating-block" data-filled={index < filled} aria-hidden="true" />
              ))}
            </div>
            <span className="pixel-rating-value" aria-hidden="true">{Number(displayValue.toFixed(1))}</span>
          </div>
        );
      })}
    </div>
  );
}
