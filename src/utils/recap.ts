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

export function createTeaRecapSvg(summary: TeaRecapSummary): string {
  const topTea = summary.topTeaName ? `${summary.topTeaName} · ${summary.topTeaCount}번` : '아직 데이터 없음';
  const topType = summary.topTeaType ? `${summary.topTeaType} · ${summary.topTeaTypeCount}건` : '기록을 기다리는 중';
  const topTag = summary.topTag ? `#${summary.topTag} · ${summary.topTagCount}회` : '향미 태그를 남겨보세요';
  const rating = summary.averageRating ? `★ ${summary.averageRating}` : '—';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-label="${escapeXml(summary.title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5f0e8"/>
      <stop offset="52%" stop-color="#dfead6"/>
      <stop offset="100%" stop-color="#b8d7b5"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#30452f" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="1080" height="1350" rx="72" fill="url(#bg)"/>
  <circle cx="904" cy="170" r="168" fill="#ffffff" opacity="0.28"/>
  <circle cx="154" cy="1130" r="226" fill="#ffffff" opacity="0.2"/>
  <g filter="url(#shadow)">
    <rect x="96" y="110" width="888" height="1130" rx="56" fill="#fffaf2" opacity="0.94"/>
  </g>
  <text x="144" y="198" fill="#58734d" font-size="34" font-family="Pretendard, Apple SD Gothic Neo, sans-serif" font-weight="700">CHALOG RECAP</text>
  <text x="144" y="280" fill="#24331f" font-size="64" font-family="Pretendard, Apple SD Gothic Neo, sans-serif" font-weight="800">${escapeXml(summary.profileName)}님의</text>
  <text x="144" y="356" fill="#24331f" font-size="64" font-family="Pretendard, Apple SD Gothic Neo, sans-serif" font-weight="800">차록 리캡</text>
  <text x="144" y="430" fill="#6d7d64" font-size="30" font-family="Pretendard, Apple SD Gothic Neo, sans-serif">${escapeXml(summary.periodLabel)}</text>

  <rect x="144" y="508" width="792" height="184" rx="34" fill="#eff6e9"/>
  <text x="190" y="585" fill="#2d4128" font-size="34" font-family="Pretendard, Apple SD Gothic Neo, sans-serif" font-weight="700">${escapeXml(summary.headline)}</text>
  <text x="190" y="644" fill="#60745a" font-size="28" font-family="Pretendard, Apple SD Gothic Neo, sans-serif">차 기록을 한 장의 이미지로 공유해요.</text>

  <g font-family="Pretendard, Apple SD Gothic Neo, sans-serif">
    <rect x="144" y="750" width="236" height="164" rx="32" fill="#ffffff"/>
    <text x="174" y="816" fill="#708066" font-size="26">차록</text>
    <text x="174" y="878" fill="#24331f" font-size="54" font-weight="800">${summary.totalCount}</text>

    <rect x="422" y="750" width="236" height="164" rx="32" fill="#ffffff"/>
    <text x="452" y="816" fill="#708066" font-size="26">평균 별점</text>
    <text x="452" y="878" fill="#24331f" font-size="54" font-weight="800">${escapeXml(rating)}</text>

    <rect x="700" y="750" width="236" height="164" rx="32" fill="#ffffff"/>
    <text x="730" y="816" fill="#708066" font-size="26">대표 차종</text>
    <text x="730" y="878" fill="#24331f" font-size="42" font-weight="800">${escapeXml(summary.topTeaType ?? '—')}</text>
  </g>

  <g font-family="Pretendard, Apple SD Gothic Neo, sans-serif" fill="#24331f">
    <text x="144" y="1010" font-size="30" font-weight="700">가장 자주 마신 차</text>
    <text x="144" y="1062" font-size="42" font-weight="800">${escapeXml(topTea)}</text>
    <text x="144" y="1146" font-size="30" font-weight="700">대표 차종 · 향미</text>
    <text x="144" y="1198" font-size="38" font-weight="800">${escapeXml(topType)} / ${escapeXml(topTag)}</text>
  </g>

  <text x="144" y="1270" fill="#7a8a70" font-size="28" font-family="Pretendard, Apple SD Gothic Neo, sans-serif">chalog.app</text>
</svg>`;
}

export function createSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createSvgFile(svg: string, fileName: string): File {
  return new File([svg], fileName, { type: 'image/svg+xml' });
}
