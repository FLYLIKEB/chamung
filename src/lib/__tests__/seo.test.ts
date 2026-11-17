import { beforeEach, describe, expect, it } from 'vitest';
import { applyMetadata, plainDescription, routeMetadata, SITE_URL } from '../seo';

describe('search metadata', () => {
  beforeEach(() => { document.head.innerHTML = ''; });

  it.each(['/login', '/settings', '/admin', '/admin/notes', '/note/new', '/note/129/edit', '/tea/new', '/chadam/new', '/cellar', '/session/3', '/user/1/recap', '/templates'])('excludes non-search route %s', path => {
    expect(routeMetadata(path).noindex).toBe(true);
  });
  it.each(['/', '/chadam', '/sasaek', '/note/129', '/tea/3', '/chadam/8', '/tag/꽃향', '/teahouse/일운차당'])('allows public route %s', path => {
    expect(routeMetadata(path).noindex).toBe(false);
  });
  it('does not index filtered search URLs', () => {
    expect(routeMetadata('/sasaek', '?q=녹차').noindex).toBe(true);
  });
  it('replaces a single canonical and clears private metadata on navigation', () => {
    applyMetadata('/note/129', { title: '비공개 차록 | 차멍', noindex: true });
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    applyMetadata('/tea/4', { title: '우롱차 | 차멍', description: '우롱차 시음 기록' });
    expect(document.title).toBe('우롱차 | 차멍');
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', SITE_URL + '/tea/4');
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute('content', SITE_URL + '/tea/4');
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute('content', '우롱차 시음 기록');
  });
  it('turns formatted text into a bounded description without generated session tables', () => {
    expect(plainDescription('**꽃향**\n[차 이야기](https://example.com)\n### 다회모드로 작성됨\n|탕|시간|')).toBe('꽃향 차 이야기');
    expect(plainDescription('가'.repeat(200))).toHaveLength(160);
    expect(plainDescription(null)).toBe('');
  });
});
