import { describe, expect, it } from 'vitest';
import { buildTeaRecapSummary, createTeaRecapSvg, createSvgDataUrl, createSvgFile } from './recap';
import { ReportData } from '@/hooks/useReportData';
import { Note } from '@/types';

const report: ReportData = {
  teaTypeDistribution: [{ type: '녹차', count: 3, percentage: 60 }],
  ratingDistribution: [],
  topTeas: [{ teaName: '우전', count: 2, teaId: 1 }],
  topTags: [{ tag: '풀향', count: 4 }],
  thisMonthCount: 3,
  lastMonthCount: 1,
  totalCount: 5,
  monthlyInsight: null,
};

const notes: Note[] = [
  {
    id: 1,
    teaId: 1,
    teaName: '우전',
    userId: 4,
    userName: '다인',
    schemaId: 1,
    overallRating: 4,
    isRatingIncluded: true,
    memo: null,
    isPublic: true,
    createdAt: new Date('2026-05-01'),
  },
  {
    id: 2,
    teaId: 1,
    teaName: '우전',
    userId: 4,
    userName: '다인',
    schemaId: 1,
    overallRating: 5,
    isRatingIncluded: true,
    memo: null,
    isPublic: true,
    createdAt: new Date('2026-05-02'),
  },
];

describe('tea recap utilities', () => {
  it('차록 통계에서 공유용 요약을 만든다', () => {
    const summary = buildTeaRecapSummary(report, notes, '2026-05', '다인');

    expect(summary.title).toBe('다인님의 차록 리캡');
    expect(summary.periodLabel).toBe('2026년 5월');
    expect(summary.averageRating).toBe(4.5);
    expect(summary.topTeaName).toBe('우전');
    expect(summary.topTeaType).toBe('녹차');
    expect(summary.topTag).toBe('풀향');
    expect(summary.shareText).toContain('차록 5건');
  });

  it('공유 이미지로 사용할 SVG 데이터 URL을 만든다', () => {
    const summary = buildTeaRecapSummary(report, notes, null, '다인');
    const svg = createTeaRecapSvg(summary);

    expect(svg).toContain('<svg');
    expect(svg).toContain('다인님의');
    expect(svg).toContain('우전');
    expect(createSvgDataUrl(svg)).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);

    const file = createSvgFile(svg, 'recap.svg');
    expect(file.name).toBe('recap.svg');
    expect(file.type).toBe('image/svg+xml');
  });
});
