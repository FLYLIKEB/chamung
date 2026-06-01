import { describe, expect, it } from 'vitest';
import { buildTeaRecapSlides, buildTeaRecapSummary, createTeaRecapSvg, createSvgDataUrl, createSvgFile, filterNotesByMonth } from './recap';
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
    images: ['https://example.com/tea.jpg'],
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
    expect(summary.photoCount).toBe(1);
    expect(summary.heroImageUrl).toBe('https://example.com/tea.jpg');
    expect(summary.shareText).toContain('차록 5건');
  });


  it('유튜브 리캡처럼 넘길 수 있는 여러 장 카드와 마지막 공유 카드를 만든다', () => {
    const summary = buildTeaRecapSummary(report, notes, '2026-05', '다인');
    const slides = buildTeaRecapSlides(summary);

    expect(slides.length).toBeGreaterThan(1);
    expect(slides.at(-1)?.isSummary).toBe(true);
    expect(slides.at(-1)?.title).toBe('다인님의 차록 리캡');
    expect(slides.every((slide) => slide.visual.emoji)).toBe(true);
    expect(slides.find((slide) => slide.id === 'photo')?.visual.imageUrl).toBe('https://example.com/tea.jpg');
  });

  it('선택 월 기준으로 리캡 계산에 사용할 차록을 거른다', () => {
    const extraNote = { ...notes[0], id: 3, createdAt: new Date('2026-06-01') };

    expect(filterNotesByMonth([...notes, extraNote], '2026-05')).toHaveLength(2);
    expect(filterNotesByMonth([...notes, extraNote], null)).toHaveLength(3);
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
