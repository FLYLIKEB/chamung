import { Info } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const CHART_COLOR = 'rgb(34 197 94)'; // green-500 (rating)
const GRID_COLOR = 'rgb(229 231 235)'; // gray-200
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

const FULL_MARK_5 = 5;
const FULL_MARK_10 = 10;

/** max점 척도 → 5점 환산 */
function toScore5(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(FULL_MARK_5, value * (FULL_MARK_5 / max));
}

/** max점 척도 → 10점 환산 */
function toScore10(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(FULL_MARK_10, value * (FULL_MARK_10 / max));
}

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
  const sortedAxisValues = [...axisValues].sort((a, b) => {
    const orderA = a.axis?.displayOrder || 0;
    const orderB = b.axis?.displayOrder || 0;
    return orderA - orderB;
  });

  const fullMark = use10Scale ? FULL_MARK_10 : FULL_MARK_5;
  const toScore = use10Scale ? toScore10 : toScore5;
  const isPoster = variant === 'poster';
  const chartColor = isPoster ? 'rgba(31, 41, 55, 0.42)' : CHART_COLOR;
  const chartFill = isPoster ? 'rgba(31, 41, 55, 0.14)' : CHART_COLOR;
  const gridColor = isPoster ? 'rgba(31, 41, 55, 0.18)' : GRID_COLOR;

  const radarData = sortedAxisValues.map((av) => {
    const rawNum = Number(av.valueNumeric) || 0;
    const maxValue = Number(av.axis?.maxValue) || 5;
    const displayValue = use10Scale ? rawNum * (FULL_MARK_10 / maxValue) : rawNum;
    const displayMax = use10Scale ? FULL_MARK_10 : maxValue;
    return {
      subject: av.axis?.nameKo || `축 ${av.axisId}`,
      value: toScore(rawNum, maxValue),
      fullMark,
      rawValue: rawNum,
      maxValue,
      displayValue,
      displayMax,
      description: av.axis?.descriptionKo,
    };
  });

  if (radarData.length === 0) return null;

  const radarDataBySubject = new Map(radarData.map((item) => [item.subject, item]));

  const renderAngleTick = ({ x, y, cx, payload }: { x?: number; y?: number; cx?: number; payload?: { value?: string | number } }) => {
    const subject = String(payload?.value ?? '');
    const item = radarDataBySubject.get(subject);
    if (!item) return null;

    const displayScore = `${Number(item.displayValue).toFixed(1)}/${item.displayMax}`;
    const hasDescription = !!item.description?.trim();
    const centerX = cx ?? 150;
    const textAnchor = (x ?? centerX) > centerX + 8 ? 'start' : (x ?? centerX) < centerX - 8 ? 'end' : 'middle';
    const scoreIconX = textAnchor === 'end' ? -4 : textAnchor === 'middle' ? displayScore.length * 2.6 + 5 : displayScore.length * 5.2 + 5;

    return (
      <g transform={`translate(${x ?? 0},${y ?? 0})`} className="rating-visualization-axis-label">
        {hasDescription && <title>{item.description}</title>}
        <text textAnchor={textAnchor} dominantBaseline="central">
          <tspan x={0} dy={isPoster ? -7 : -6} className="rating-visualization-axis-name">
            {subject}
          </tspan>
          <tspan x={0} dy={isPoster ? 15 : 14} className="rating-visualization-axis-score">
            {displayScore}
          </tspan>
        </text>
        {hasDescription && (
          <g
            className="rating-visualization-axis-info-icon"
            transform={`translate(${scoreIconX},${isPoster ? 8 : 8})`}
            aria-hidden="true"
          >
            <circle cx="0" cy="0" r="4.2" />
            <text x="0" y="0.2" textAnchor="middle" dominantBaseline="central">i</text>
          </g>
        )}
      </g>
    );
  };

  // 축이 1~2개면 바형 유지 (레이더는 3개 이상에서 의미 있음)
  if (radarData.length < 3) {
    return (
      <div className={isPoster ? "rating-visualization-poster space-y-4" : "space-y-3"}>
        {radarData.map((item) => (
          <div key={item.subject}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className={isPoster ? "truncate text-sm uppercase tracking-[0.16em] text-black/55" : "text-base truncate"}>{item.subject}</span>
                {item.description?.trim() && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        aria-label={`${item.subject} 설명 보기`}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" side="top" className="max-w-[280px] text-sm">
                      <p className="text-muted-foreground">{item.description}</p>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <span className={isPoster ? "text-xs tabular-nums text-black/45" : "text-sm text-muted-foreground tabular-nums"}>
                {Number(item.displayValue).toFixed(1)}/{item.displayMax}
              </span>
            </div>
            <div className={isPoster ? "h-6 overflow-hidden rounded-full bg-black/[0.035] blur-[0.1px]" : "h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(item.rawValue / item.maxValue) * 100}%`,
                  background: isPoster
                    ? 'linear-gradient(90deg, rgba(0,0,0,0.08), rgba(0,0,0,0.34), rgba(0,0,0,0.08))'
                    : chartColor,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={isPoster ? "rating-visualization-poster space-y-4" : "space-y-4"}>
      <div className={isPoster ? "rating-visualization-poster-chart mx-auto aspect-square max-w-[300px] p-2" : "aspect-square max-w-[300px] mx-auto p-2"}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={radarData}
            margin={{ top: 36, right: 28, bottom: 28, left: 28 }}
            outerRadius="82%"
          >
            <PolarGrid stroke={gridColor} strokeOpacity={isPoster ? 0.55 : 0.8} />
            <PolarAngleAxis
              dataKey="subject"
              tick={renderAngleTick}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={180}
              domain={[0, fullMark]}
              tick={{ fill: isPoster ? 'rgba(30, 30, 30, 0.4)' : 'rgb(156 163 175)', fontSize: isPoster ? 9 : 11 }}
              tickCount={6}
              axisLine={false}
              tickLine={false}
            />
            <Radar
              name="평가"
              dataKey="value"
              stroke={chartColor}
              fill={chartFill}
              fillOpacity={isPoster ? 0.18 : 0.15}
              strokeWidth={isPoster ? 1.15 : 1.5}
              dot={isPoster ? { r: 2.4, fill: 'rgba(17, 24, 39, 0.86)', stroke: 'none' } : { r: 3.5, fill: 'rgb(5 46 22)', stroke: 'none' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const p = payload[0].payload;
                return (
                  <div className={isPoster ? 'rounded bg-black/70 px-3 py-2 text-sm text-white/90 shadow-none backdrop-blur-md' : 'bg-white dark:bg-gray-900 border rounded-lg px-3 py-2 shadow-md text-sm'} style={{ borderColor: isPoster ? 'transparent' : 'rgb(34 197 94 / 0.5)' }}>
                    <p className={isPoster ? "font-medium tracking-tight text-white/80" : "font-medium text-gray-900 dark:text-gray-100"}>{p.subject}</p>
                    <p className={isPoster ? "mt-0.5 text-sm text-white/50" : "text-gray-500 dark:text-gray-400 text-sm mt-0.5"}>
                      {Number(p.displayValue).toFixed(1)}/{p.displayMax}점
                    </p>
                  </div>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
