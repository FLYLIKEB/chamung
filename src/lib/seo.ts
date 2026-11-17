export const SITE_URL = 'https://www.chamung.com';
export const SITE_TITLE = '차멍 | 차 기록과 차 이야기';
export const SITE_DESCRIPTION = '마신 차의 향과 맛을 차록으로 기록하고, 다양한 차와 다우들의 이야기를 만나보세요. 나만의 차 기록과 차 커뮤니티, 차멍.';

export type PageMetadata = { title: string; description?: string; noindex?: boolean };

export function plainDescription(text: string | null | undefined): string {
  return (text ?? '').split(/###\s*다회모드로 작성됨/)[0]
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ').replace(/[#*_`~>|]/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, 160);
}

export function routeMetadata(pathname: string, search = ''): PageMetadata {
  const titles: Record<string, string> = {
    '/': SITE_TITLE, '/chadam': '차담 · 차 이야기 | 차멍',
    '/sasaek': '차와 차록 탐색 | 차멍',
    '/level-info': '차록 활동 안내 | 차멍', '/badges': '차록 배지 | 차멍',
  };
  const isPublicDetail = /^\/(?:tea|note|chadam|user)\/\d+$/.test(pathname)
    || /^\/(?:tag|teahouse)\/[^/]+$/.test(pathname) && !pathname.endsWith('/new');
  return {
    title: titles[pathname] ?? SITE_TITLE,
    description: SITE_DESCRIPTION,
    noindex: Boolean(search) || (!titles[pathname] && !isPublicDetail),
  };
}

export function applyMetadata(pathname: string, metadata: PageMetadata) {
  document.title = metadata.title;
  const description = metadata.description || SITE_DESCRIPTION;
  const canonicalUrl = SITE_URL + (pathname === '/' ? '/' : pathname.replace(/\/$/, ''));
  function meta(attribute: 'name' | 'property', key: string, value: string) {
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }
    element.content = value;
  }
  meta('name', 'description', description);
  meta('name', 'robots', metadata.noindex ? 'noindex, follow' : 'index, follow');
  meta('property', 'og:title', metadata.title);
  meta('property', 'og:description', description);
  meta('property', 'og:url', canonicalUrl);
  meta('name', 'twitter:title', metadata.title);
  meta('name', 'twitter:description', description);
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;
}
