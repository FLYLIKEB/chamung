import { buildSitemapIndex, generateSitemap, SITEMAP_KINDS, type SitemapKind } from '../src/lib/sitemap.js';

export default async function handler(req: any, res: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Cache-Control', 'no-store');
    res.status(405).end();
    return;
  }
  const kind = req.query?.kind;
  if (kind !== undefined && (typeof kind !== 'string' || !SITEMAP_KINDS.includes(kind as SitemapKind))) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(404).end();
    return;
  }
  try {
    const xml = kind === undefined
      ? buildSitemapIndex()
      : await generateSitemap(kind as SitemapKind, process.env.BACKEND_URL);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${kind === undefined || kind === 'static' ? 3600 : 300}`);
    res.status(200).end(req.method === 'HEAD' ? undefined : xml);
  } catch {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '300');
    res.status(503).end(req.method === 'HEAD' ? undefined : 'Sitemap temporarily unavailable');
  }
}
