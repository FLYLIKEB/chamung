import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FLAVOR_TAGS,
  FLAVOR_TAGS_BY_ID,
  getFlavorTagByLabel,
  getRelatedFlavorTagsByLabel,
  groupFlavorTagLabels,
  ONBOARDING_FLAVOR_TAGS,
  RECOMMENDED_NOTE_TAGS,
} from '../index';

type CsvRow = Record<string, string>;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

describe('tea flavor tag v1 lexicon', () => {
  it('keeps the TypeScript constants synchronized with the published CSV', () => {
    const csvPath = resolve(process.cwd(), 'public/data/tea_flavor_tags_v1.csv');
    const csvRows = parseCsv(readFileSync(csvPath, 'utf8'));

    expect(csvRows).toHaveLength(99);
    expect(FLAVOR_TAGS).toHaveLength(csvRows.length);
    expect(FLAVOR_TAGS.map((tag) => tag.tagId)).toEqual(csvRows.map((row) => row.tag_id));
    expect(FLAVOR_TAGS.map((tag) => tag.tagKo)).toEqual(csvRows.map((row) => row.tag_ko));
  });

  it('defines stable unique tag IDs and description metadata for all four groups', () => {
    const ids = FLAVOR_TAGS.map((tag) => tag.tagId);
    const groups = new Set(FLAVOR_TAGS.map((tag) => tag.group));

    expect(new Set(ids).size).toBe(ids.length);
    expect(groups).toEqual(new Set(['aroma', 'taste', 'mouthfeel', 'finish']));
    expect(FLAVOR_TAGS_BY_ID.jasmine).toMatchObject({
      tagKo: '자스민',
      category: 'floral',
    });
    expect(FLAVOR_TAGS_BY_ID.astringent.descriptionKo).toContain('입 안이 마르고');
  });

  it('uses the issue 311 lexicon for note recommendations and onboarding choices', () => {
    expect(RECOMMENDED_NOTE_TAGS).toContain('자스민');
    expect(RECOMMENDED_NOTE_TAGS).toContain('청량한 여운');
    expect(RECOMMENDED_NOTE_TAGS).toHaveLength(99);
    expect(ONBOARDING_FLAVOR_TAGS).toEqual(
      expect.arrayContaining(['꽃향', '자스민', '감귤/시트러스', '매끄러움', '김']),
    );
  });

  it('groups saved note labels into schema sections and keeps custom labels visible', () => {
    const grouped = groupFlavorTagLabels(['자스민', '단맛', '실키함', '청량한 여운', '나만의 표현']);

    expect(grouped.map((group) => group.group)).toEqual(['aroma', 'taste', 'mouthfeel', 'finish', 'custom']);
    expect(grouped[0].tags[0].definition?.tagId).toBe('jasmine');
    expect(grouped[4].tags[0]).toMatchObject({ label: '나만의 표현', definition: null });
  });

  it('finds schema definitions and related tags from the visible Korean label', () => {
    expect(getFlavorTagByLabel('자스민')).toMatchObject({
      tagId: 'jasmine',
      group: 'aroma',
      category: 'floral',
    });
    expect(getRelatedFlavorTagsByLabel('자스민').map((tag) => tag.tagKo)).toEqual(
      expect.arrayContaining(['꽃향', '장미']),
    );
  });
});
