export const SITEMAP_ORIGIN = 'https://www.chamung.com';
export const SITEMAP_KINDS = ['static', 'teas', 'notes', 'posts'] as const;
export type SitemapKind = typeof SITEMAP_KINDS[number];
type SitemapEntry = { loc: string; lastmod?: string };
type PublicRecord = { id: number; updatedAt?: unknown; createdAt?: unknown; isPublic?: unknown };
const MAX_URLS = 50_000;
const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const XML_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]!);
}

export function buildSitemapIndex(): string {
  return `${XML_HEADER}\n<sitemapindex xmlns="${XML_NAMESPACE}">\n${SITEMAP_KINDS.map((kind) =>
    `  <sitemap><loc>${SITEMAP_ORIGIN}/sitemaps/${kind}.xml</loc></sitemap>`,
  ).join('\n')}\n</sitemapindex>`;
}

export function buildUrlset(entries: SitemapEntry[]): string {
  const unique = new Map<string, SitemapEntry>();
  for (const entry of entries) {
    const previous = unique.get(entry.loc);
    if (!previous || (entry.lastmod && (!previous.lastmod || entry.lastmod > previous.lastmod))) {
      unique.set(entry.loc, entry);
    }
  }
  if (unique.size > MAX_URLS) throw new Error('Sitemap URL limit exceeded');
  const rows = [...unique.values()].sort((a, b) => a.loc.localeCompare(b.loc)).map(({ loc, lastmod }) =>
    `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}</url>`,
  );
  const xml = `${XML_HEADER}\n<urlset xmlns="${XML_NAMESPACE}">\n${rows.join('\n')}\n</urlset>`;
  if (new TextEncoder().encode(xml).byteLength > 50 * 1024 * 1024) throw new Error('Sitemap size limit exceeded');
  return xml;
}

function parseRecords(value: unknown): PublicRecord[] {
  if (!Array.isArray(value) || value.some((record) =>
    !record || typeof record !== 'object' || !Number.isSafeInteger(record.id) || record.id <= 0,
  )) throw new Error('Invalid sitemap records');
  return value;
}

function lastModified(record: PublicRecord, now: number): string | undefined {
  for (const value of [record.updatedAt, record.createdAt]) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) continue;
    const calendarDate = value.slice(0, 10);
    const calendarTimestamp = Date.parse(`${calendarDate}T00:00:00Z`);
    if (!Number.isFinite(calendarTimestamp) || new Date(calendarTimestamp).toISOString().slice(0, 10) !== calendarDate) continue;
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp) && timestamp <= now) return new Date(timestamp).toISOString();
  }
  return undefined;
}

/** Uses only unauthenticated public API responses; never receives visitor credentials. */
export async function generateSitemap(
  kind: SitemapKind,
  backendUrl?: string,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<string> {
  if (kind === 'static') {
    // Templates require authentication; only publicly accessible discovery screens belong here.
    return buildUrlset(['/', '/chadam', '/sasaek'].map((path) => ({ loc: `${SITEMAP_ORIGIN}${path}` })));
  }
  if (!backendUrl) throw new Error('Sitemap backend is not configured');
  const base = new URL(backendUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
    throw new Error('Invalid sitemap backend URL');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  const records: PublicRecord[] = [];
  const seen = new Set<number>();
  const request = async (path: string): Promise<unknown> => {
    const response = await fetcher(`${backendUrl.replace(/\/$/, '')}/api/${path}`, {
      method: 'GET', headers: { Accept: 'application/json' }, signal: controller.signal, cache: 'no-store',
    });
    if (!response.ok) throw new Error('Sitemap upstream request failed');
    return response.json();
  };
  const append = (page: PublicRecord[]) => {
    const oldSize = seen.size;
    for (const record of page) seen.add(record.id);
    if (page.length && seen.size === oldSize) throw new Error('Sitemap pagination made no progress');
    records.push(...page);
    if (records.length > MAX_URLS) throw new Error('Sitemap URL limit exceeded');
  };
  try {
    if (kind === 'teas') {
      append(parseRecords(await request('teas')));
    } else if (kind === 'notes') {
      let expectedTotal: number | undefined;
      for (let page = 1; ; page += 1) {
        const result = await request(`notes?public=true&page=${page}&limit=100`);
        if (!result || typeof result !== 'object') throw new Error('Invalid notes pagination');
        const envelope = result as { data?: unknown; total?: unknown; page?: unknown; limit?: unknown };
        if (!Number.isSafeInteger(envelope.total) || Number(envelope.total) < 0 || Number(envelope.total) > MAX_URLS ||
          envelope.page !== page || envelope.limit !== 100) throw new Error('Invalid notes pagination');
        const total = Number(envelope.total);
        if (expectedTotal !== undefined && total !== expectedTotal) throw new Error('Notes changed during sitemap generation');
        expectedTotal = total;
        const batch = parseRecords(envelope.data);
        if (batch.length !== Math.min(100, total - records.length)) throw new Error('Incomplete notes pagination');
        append(batch);
        if (records.length === total) {
          if (seen.size !== total) throw new Error('Incomplete notes pagination: duplicate records');
          break;
        }
      }
    } else {
      // Posts use a capped 50-record page without a total count.
      for (let page = 1; ; page += 1) {
        if (page > MAX_URLS / 50 + 1) throw new Error('Sitemap page limit exceeded');
        const batch = parseRecords(await request(`posts?page=${page}&limit=50`));
        if (batch.length > 50) throw new Error('Invalid posts pagination');
        append(batch);
        if (batch.length < 50) break;
      }
    }
    const route = { teas: 'tea', notes: 'note', posts: 'chadam' }[kind];
    return buildUrlset(records.filter((record) => kind !== 'notes' || record.isPublic === true).map((record) => ({
      loc: `${SITEMAP_ORIGIN}/${route}/${record.id}`,
      lastmod: lastModified(record, now),
    })));
  } finally {
    clearTimeout(timer);
  }
}
