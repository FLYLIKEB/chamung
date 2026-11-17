import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyMetadata, routeMetadata, type PageMetadata } from '../lib/seo';

/** Reset route metadata before asynchronously loaded detail metadata is applied. */
export function SeoMetadata() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    applyMetadata(pathname, routeMetadata(pathname, search));
  }, [pathname, search]);
  return null;
}

export function usePageMetadata(metadata: PageMetadata | null) {
  const { pathname, search } = useLocation();
  const title = metadata?.title;
  const description = metadata?.description;
  const noindex = metadata?.noindex;
  useEffect(() => {
    if (title) applyMetadata(pathname, { title, description, noindex: noindex || Boolean(search) });
  }, [pathname, search, title, description, noindex]);
}
