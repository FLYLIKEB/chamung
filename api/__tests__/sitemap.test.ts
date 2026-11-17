import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../sitemap';
import { buildSitemapIndex, buildUrlset, escapeXml, generateSitemap } from '../../src/lib/sitemap';

const BACKEND = 'https://backend.example';
const NOW = Date.parse('2026-11-18T00:00:00Z');
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const makeRecords = (count: number, start = 1) => Array.from({ length: count }, (_, index) => ({ id: start + index }));

function responseMock() {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader: vi.fn((name: string, value: string) => { headers[name.toLowerCase()] = value; }),
    status: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('sitemap XML', () => {
  it('lists the four canonical child sitemaps without invented lastmod values', () => {
    const xml = buildSitemapIndex();
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    expect(document.querySelector('parsererror')).toBeNull();
    expect([...document.querySelectorAll('loc')].map((node) => node.textContent)).toEqual([
      'https://www.chamung.com/sitemaps/static.xml',
      'https://www.chamung.com/sitemaps/teas.xml',
      'https://www.chamung.com/sitemaps/notes.xml',
      'https://www.chamung.com/sitemaps/posts.xml',
    ]);
    expect(xml).not.toContain('lastmod');
  });

  it('escapes XML, deduplicates URLs and keeps the newest modification date', () => {
    expect(escapeXml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&apos;');
    const loc = 'https://www.chamung.com/tea/1?q=녹차&x="<test>"';
    const xml = buildUrlset([{ loc, lastmod: '2026-01-01' }, { loc, lastmod: '2026-02-01' }]);
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    expect(document.querySelector('parsererror')).toBeNull();
    expect(document.querySelectorAll('url')).toHaveLength(1);
    expect(document.querySelector('loc')?.textContent).toBe(loc);
    expect(document.querySelector('lastmod')?.textContent).toBe('2026-02-01');
  });

  it('does not list account or authenticated template pages in the static sitemap', async () => {
    const fetcher = vi.fn();
    const xml = await generateSitemap('static', undefined, fetcher);
    expect(xml.match(/<url>/g)).toHaveLength(3);
    expect(xml).not.toMatch(/login|templates|level-info|user|my-notes|settings/);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects sitemaps exceeding the URL limit rather than silently truncating', () => {
    expect(() => buildUrlset(makeRecords(50_001).map(({ id }) => ({ loc: `https://www.chamung.com/tea/${id}` }))))
      .toThrow('URL limit');
  });
});

describe('public sitemap data', () => {
  it('collects all public note pages without forwarding credentials and excludes nonpublic records', async () => {
    const firstPage = makeRecords(100).map((record) => ({ ...record, isPublic: true }));
    firstPage[0].isPublic = false;
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ data: firstPage, total: 102, page: 1, limit: 100 }))
      .mockResolvedValueOnce(json({ data: [{ id: 101, isPublic: true }, { id: 102 }], total: 102, page: 2, limit: 100 }));
    const xml = await generateSitemap('notes', BACKEND, fetcher, NOW);
    expect(xml.match(/<url>/g)).toHaveLength(100);
    expect(xml).not.toContain('/note/1</loc>');
    expect(xml).not.toContain('/note/102</loc>');
    expect(xml).toContain('/note/101</loc>');
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      `${BACKEND}/api/notes?public=true&page=1&limit=100`,
      `${BACKEND}/api/notes?public=true&page=2&limit=100`,
    ]);
    for (const [, options] of fetcher.mock.calls) {
      expect(options.headers).toEqual({ Accept: 'application/json' });
      expect(options).not.toHaveProperty('credentials');
      expect(options.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it('paginates posts at the API maximum of 50 and deduplicates overlapping records', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json(makeRecords(50)))
      .mockResolvedValueOnce(json([{ id: 50 }, { id: 51 }]));
    const xml = await generateSitemap('posts', BACKEND, fetcher, NOW);
    expect(xml.match(/<url>/g)).toHaveLength(51);
    expect(fetcher.mock.calls[1][0]).toBe(`${BACKEND}/api/posts?page=2&limit=50`);
  });

  it('uses real lastmod values and falls back to creation date for invalid/future updates', async () => {
    const fetcher = vi.fn().mockResolvedValue(json([
      { id: 1, updatedAt: '2026-11-17T12:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { id: 2, updatedAt: 'invalid', createdAt: '2025-01-01T00:00:00Z' },
      { id: 3, updatedAt: '2027-01-01T00:00:00Z' },
      { id: 4, updatedAt: '2027-01-01T00:00:00Z', createdAt: '2025-02-01T00:00:00Z' },
    ]));
    const xml = await generateSitemap('teas', `${BACKEND}/`, fetcher, NOW);
    expect(xml).toContain('2026-11-17T12:00:00.000Z');
    expect(xml).toContain('2025-01-01T00:00:00.000Z');
    expect(xml).toContain('2025-02-01T00:00:00.000Z');
    expect(xml).not.toContain('2027');
    expect(xml).toContain('<loc>https://www.chamung.com/tea/3</loc></url>');
    expect(fetcher.mock.calls[0][0]).toBe(`${BACKEND}/api/teas`);
  });

  it.each([
    { data: [{ id: 1, isPublic: true }], total: 2, page: 1, limit: 100 },
    { data: [], total: -1, page: 1, limit: 100 },
    { data: [], total: 50_001, page: 1, limit: 100 },
    { data: [], total: 0, page: 2, limit: 100 },
    { data: [], total: 0, page: 1, limit: 20 },
    { data: [], total: '0', page: 1, limit: 100 },
  ])('rejects incomplete or invalid note pagination: %j', async (payload) => {
    await expect(generateSitemap('notes', BACKEND, vi.fn().mockResolvedValue(json(payload)), NOW)).rejects.toThrow();
  });

  it('fails if the total changes while collecting notes', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ data: makeRecords(100), total: 101, page: 1, limit: 100 }))
      .mockResolvedValueOnce(json({ data: makeRecords(2, 101), total: 102, page: 2, limit: 100 }));
    await expect(generateSitemap('notes', BACKEND, fetcher, NOW)).rejects.toThrow('changed');
  });

  it('rejects overlapping note pages that would silently omit records', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ data: makeRecords(100), total: 102, page: 1, limit: 100 }))
      .mockResolvedValueOnce(json({ data: [{ id: 100 }, { id: 101 }], total: 102, page: 2, limit: 100 }));
    await expect(generateSitemap('notes', BACKEND, fetcher, NOW)).rejects.toThrow('duplicate records');
  });

  it('omits impossible calendar dates instead of normalizing them into a false lastmod', async () => {
    const fetcher = vi.fn().mockResolvedValue(json([{ id: 1, updatedAt: '2026-02-30T12:00:00Z' }]));
    expect(await generateSitemap('teas', BACKEND, fetcher, NOW)).not.toContain('<lastmod>');
  });

  it('stops repeated full pages instead of returning incomplete results or looping', async () => {
    const fetcher = vi.fn().mockImplementation(async () => json(makeRecords(50)));
    await expect(generateSitemap('posts', BACKEND, fetcher, NOW)).rejects.toThrow('no progress');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it.each([[{ id: '../private' }], [{ id: -1 }], [{ id: 0 }], [{ id: 1.5 }], {}, null])('rejects malformed records: %j', async (payload) => {
    await expect(generateSitemap('teas', BACKEND, vi.fn().mockResolvedValue(json(payload)), NOW)).rejects.toThrow('Invalid sitemap records');
  });

  it('aborts the upstream request after the total deadline', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_url, options) => new Promise<Response>((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const result = expect(generateSitemap('teas', BACKEND, fetcher, NOW)).rejects.toThrow('aborted');
    await vi.advanceTimersByTimeAsync(12_000);
    await result;
  });
});

describe('sitemap HTTP handler', () => {
  it('serves XML and cache headers for the index without fetching or trusting the host', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const res = responseMock();
    await handler({ method: 'GET', query: {}, headers: { host: 'untrusted.example' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.headers['content-type']).toBe('application/xml; charset=utf-8');
    expect(res.headers['cache-control']).toContain('s-maxage=3600');
    expect(res.end.mock.calls[0][0]).toContain('https://www.chamung.com/sitemaps/notes.xml');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('supports HEAD with no response body', async () => {
    const res = responseMock();
    await handler({ method: 'HEAD', query: { kind: 'static' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalledWith(undefined);
  });

  it('uses short caching for dynamic sitemaps', async () => {
    vi.stubEnv('BACKEND_URL', BACKEND);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([{ id: 1 }])));
    const res = responseMock();
    await handler({ method: 'GET', query: { kind: 'teas' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.headers['cache-control']).toBe('public, max-age=0, s-maxage=300');
  });

  it.each(['other', ['notes', 'teas']])('rejects unknown or repeated sitemap kinds', async (kind) => {
    const res = responseMock();
    await handler({ method: 'GET', query: { kind } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('rejects writes', async () => {
    const res = responseMock();
    await handler({ method: 'POST', query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.headers.allow).toBe('GET, HEAD');
  });

  it.each(['http', 'malformed', 'missing-env'])('returns a noncacheable 503 instead of a partial sitemap on %s failure', async (failure) => {
    vi.stubEnv('BACKEND_URL', failure === 'missing-env' ? '' : BACKEND);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(failure === 'http' ? json({}, 500) : json({ error: 'bad data' })));
    const res = responseMock();
    await handler({ method: 'GET', query: { kind: 'teas' } }, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['retry-after']).toBe('300');
    expect(res.end.mock.calls[0][0]).not.toContain('<urlset');
  });
});
