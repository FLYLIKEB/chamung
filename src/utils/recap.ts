import { ReportData, formatMonthLabel } from '@/hooks/useReportData';
import { Note } from '@/types';

export interface TeaRecapSummary {
  title: string;
  periodLabel: string;
  profileName: string;
  totalCount: number;
  averageRating: number | null;
  topTeaName: string | null;
  topTeaCount: number;
  topTeaType: string | null;
  topTeaTypeCount: number;
  topTag: string | null;
  topTagCount: number;
  headline: string;
  shareText: string;
}

export interface TeaRecapSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  metric?: string;
  detail?: string;
  isSummary?: boolean;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getAverageRating(notes: Note[]): number | null {
  const ratings = notes
    .map((note) => note.overallRating)
    .filter((rating): rating is number => typeof rating === 'number' && rating > 0);

  if (ratings.length === 0) return null;
  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return Number(average.toFixed(1));
}

export function getRecapPeriodLabel(selectedMonth: string | null): string {
  return selectedMonth ? formatMonthLabel(selectedMonth) : '전체 기간';
}


export function getNoteMonthKey(note: Note): string {
  const createdAt = new Date(note.createdAt);
  return `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
}

export function filterNotesByMonth(notes: Note[], selectedMonth: string | null): Note[] {
  if (!selectedMonth) return notes;
  return notes.filter((note) => getNoteMonthKey(note) === selectedMonth);
}

export function buildTeaRecapSummary(
  report: ReportData,
  notes: Note[],
  selectedMonth: string | null,
  profileName: string,
): TeaRecapSummary {
  const periodLabel = getRecapPeriodLabel(selectedMonth);
  const topTea = report.topTeas[0] ?? null;
  const topType = report.teaTypeDistribution[0] ?? null;
  const topTag = report.topTags[0] ?? null;
  const averageRating = getAverageRating(notes);
  const safeName = profileName.trim() || '차 애호가';

  const headline = report.totalCount > 0
    ? `${safeName}님은 ${periodLabel}에 ${topType?.type ?? '다양한 차'}를 가장 자주 마셨어요.`
    : `${safeName}님의 차 취향을 기록해보세요.`;

  const shareText = [
    `🍵 ${safeName}님의 차록 리캡`,
    `${periodLabel} · 차록 ${report.totalCount}건`,
    topTea ? `가장 자주 마신 차: ${topTea.teaName} ${topTea.count}번` : null,
    topTag ? `대표 향미: #${topTag.tag}` : null,
  ].filter((line): line is string => Boolean(line)).join('\n');

  return {
    title: `${safeName}님의 차록 리캡`,
    periodLabel,
    profileName: safeName,
    totalCount: report.totalCount,
    averageRating,
    topTeaName: topTea?.teaName ?? null,
    topTeaCount: topTea?.count ?? 0,
    topTeaType: topType?.type ?? null,
    topTeaTypeCount: topType?.count ?? 0,
    topTag: topTag?.tag ?? null,
    topTagCount: topTag?.count ?? 0,
    headline,
    shareText,
  };
}


export function buildTeaRecapSlides(summary: TeaRecapSummary): TeaRecapSlide[] {
  const ratingText = summary.averageRating ? `★ ${summary.averageRating}` : '별점 기록 없음';

  return [
    {
      id: 'intro',
      eyebrow: 'CHALOG RECAP',
      title: `${summary.profileName}님의 차 취향을 넘겨볼게요`,
      description: `${summary.periodLabel} 동안 쌓인 차록을 카드로 정리했어요.`,
      metric: `${summary.totalCount}개의 차록`,
      detail: '좌우 버튼으로 한 장씩 넘겨보세요.',
    },
    {
      id: 'type',
      eyebrow: '가장 많이 마신 차종',
      title: summary.topTeaType ?? '아직 대표 차종이 없어요',
      description: summary.topTeaType
        ? `${summary.topTeaTypeCount}개의 차록에서 가장 자주 등장했어요.`
        : '차록을 더 남기면 대표 차종을 보여드릴게요.',
      metric: summary.topTeaType ? `${summary.topTeaTypeCount}건` : '—',
      detail: '차종 분포 기준',
    },
    {
      id: 'tea',
      eyebrow: '자꾸 손이 간 차',
      title: summary.topTeaName ?? '기록을 기다리는 중',
      description: summary.topTeaName
        ? `${summary.topTeaName}를 ${summary.topTeaCount}번 기록했어요.`
        : '같은 차를 여러 번 기록하면 이 카드가 채워져요.',
      metric: summary.topTeaName ? `${summary.topTeaCount}번` : '—',
      detail: '자주 마신 차 기준',
    },
    {
      id: 'flavor',
      eyebrow: '기억에 남은 향미',
      title: summary.topTag ? `#${summary.topTag}` : '향미 태그 없음',
      description: summary.topTag
        ? `${summary.topTagCount}번 사용한 대표 향미 태그예요.`
        : '향미 태그를 남기면 취향이 더 선명해져요.',
      metric: summary.topTag ? `${summary.topTagCount}회` : '—',
      detail: `평균 별점 ${ratingText}`,
    },
    {
      id: 'summary',
      eyebrow: '공유 가능한 요약 카드',
      title: summary.title,
      description: summary.headline,
      metric: `${summary.totalCount}건 · ${ratingText}`,
      detail: [
        summary.topTeaType ? `대표 차종 ${summary.topTeaType}` : null,
        summary.topTeaName ? `최다 기록 ${summary.topTeaName}` : null,
        summary.topTag ? `향미 #${summary.topTag}` : null,
      ].filter(Boolean).join(' · '),
      isSummary: true,
    },
  ];
}

export function createTeaRecapSvg(summary: TeaRecapSummary): string {
  const topTea = summary.topTeaName ? `${summary.topTeaName} · ${summary.topTeaCount}번` : '아직 데이터 없음';
  const topType = summary.topTeaType ? `${summary.topTeaType} · ${summary.topTeaTypeCount}건` : '기록을 기다리는 중';
  const topTag = summary.topTag ? `#${summary.topTag} · ${summary.topTagCount}회` : '향미 태그를 남겨보세요';
  const rating = summary.averageRating ? `★ ${summary.averageRating}` : '—';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-label="${escapeXml(summary.title)}">
  <rect width="1080" height="1350" rx="72" fill="#f2f2f2"/>
  <rect x="96" y="110" width="888" height="1130" rx="56" fill="#ffffff" stroke="#d7d7d7" stroke-width="2"/>
  <line x1="144" y1="470" x2="936" y2="470" stroke="#e5e5e5" stroke-width="2"/>
  <text x="144" y="198" fill="#6b6b6b" font-size="34" font-family="Pretendard, Apple SD Gothic Neo, sans-serif" font-weight="700">CHALOG RECAP</text>
  <text x="144" y="280" fill="#1a1a1a" font-size="64" font-family="Pretendard, Apple SD Gothic Neo, sans-serif" font-weight="800">${escapeXml(summary.profileName)}님의</text>
  <text x="144" y="356" fill="#1a1a1a" font-size="64" font-family="Pretendard, Apple SD Gothic Neo, sans-serif" font-weight="800">차록 리캡</text>
  <text x="144" y="430" fill="#6b6b6b" font-size="30" font-family="Pretendard, Apple SD Gothic Neo, sans-serif">${escapeXml(summary.periodLabel)}</text>

  <rect x="144" y="508" width="792" height="184" rx="34" fill="#f7f7f7" stroke="#e5e5e5" stroke-width="2"/>
  <text x="190" y="585" fill="#1a1a1a" font-size="34" font-family="Pretendard, Apple SD Gothic Neo, sans-serif" font-weight="700">${escapeXml(summary.headline)}</text>
  <text x="190" y="644" fill="#6b6b6b" font-size="28" font-family="Pretendard, Apple SD Gothic Neo, sans-serif">차 기록을 한 장의 이미지로 공유해요.</text>

  <g font-family="Pretendard, Apple SD Gothic Neo, sans-serif">
    <rect x="144" y="750" width="236" height="164" rx="32" fill="#f7f7f7" stroke="#e5e5e5" stroke-width="2"/>
    <text x="174" y="816" fill="#6b6b6b" font-size="26">차록</text>
    <text x="174" y="878" fill="#1a1a1a" font-size="54" font-weight="800">${summary.totalCount}</text>

    <rect x="422" y="750" width="236" height="164" rx="32" fill="#f7f7f7" stroke="#e5e5e5" stroke-width="2"/>
    <text x="452" y="816" fill="#6b6b6b" font-size="26">평균 별점</text>
    <text x="452" y="878" fill="#1a1a1a" font-size="54" font-weight="800">${escapeXml(rating)}</text>

    <rect x="700" y="750" width="236" height="164" rx="32" fill="#f7f7f7" stroke="#e5e5e5" stroke-width="2"/>
    <text x="730" y="816" fill="#6b6b6b" font-size="26">대표 차종</text>
    <text x="730" y="878" fill="#1a1a1a" font-size="42" font-weight="800">${escapeXml(summary.topTeaType ?? '—')}</text>
  </g>

  <g font-family="Pretendard, Apple SD Gothic Neo, sans-serif" fill="#1a1a1a">
    <text x="144" y="1010" font-size="30" font-weight="700">가장 자주 마신 차</text>
    <text x="144" y="1062" font-size="42" font-weight="800">${escapeXml(topTea)}</text>
    <text x="144" y="1146" font-size="30" font-weight="700">대표 차종 · 향미</text>
    <text x="144" y="1198" font-size="38" font-weight="800">${escapeXml(topType)} / ${escapeXml(topTag)}</text>
  </g>

  <text x="144" y="1270" fill="#6b6b6b" font-size="28" font-family="Pretendard, Apple SD Gothic Neo, sans-serif">chalog.app</text>
</svg>`;
}

export function createSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createSvgFile(svg: string, fileName: string): File {
  return new File([svg], fileName, { type: 'image/svg+xml' });
}
