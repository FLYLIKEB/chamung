import { useState, useEffect, useCallback, useRef } from 'react';
import { teasApi, tagsApi } from '../lib/api';
import { Tea, Seller } from '../types';
import { logger } from '../lib/logger';
import { SEARCH_DEBOUNCE_DELAY } from '../constants';

interface TeaSearchState {
  teas: Tea[];
  isLoading: boolean;
  hasSearched: boolean;
  searchError: string | null;
  setSearchError: (error: string | null) => void;
  sectionsError: string | null;
  flavorError: string | null;
  setTeas: (teas: Tea[]) => void;
  setIsLoading: (loading: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  search: (query: string, addToHistory: (q: string) => void) => Promise<void>;
  reset: () => void;
  // sections
  popularTeas: Tea[];
  newTeas: Tea[];
  curationTeas: Tea[];
  sellers: Seller[];
  popularTags: { name: string; noteCount: number }[];
  sectionsLoading: boolean;
  fetchSections: () => Promise<void>;
  // flavor tag explore
  selectedFlavorTag: string | null;
  flavorTeas: Tea[];
  isFlavorLoading: boolean;
  handleFlavorTagClick: (tagName: string) => Promise<void>;
}

export function useTeaSearch(): TeaSearchState {
  const [teas, setTeas] = useState<Tea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sectionsError, setSectionsError] = useState<string | null>(null);
  const [flavorError, setFlavorError] = useState<string | null>(null);

  const [popularTeas, setPopularTeas] = useState<Tea[]>([]);
  const [newTeas, setNewTeas] = useState<Tea[]>([]);
  const [curationTeas, setCurationTeas] = useState<Tea[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [popularTags, setPopularTags] = useState<{ name: string; noteCount: number }[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  const [selectedFlavorTag, setSelectedFlavorTag] = useState<string | null>(null);
  const [flavorTeas, setFlavorTeas] = useState<Tea[]>([]);
  const [isFlavorLoading, setIsFlavorLoading] = useState(false);
  const flavorRequestRef = useRef<number | null>(null);

  const searchAbortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string, addToHistory: (q: string) => void) => {
    if (query.trim().length < 2) return;
    addToHistory(query.trim());

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    try {
      setIsLoading(true);
      setSearchError(null);
      setHasSearched(true);
      const data = await teasApi.getAll(query);
      if (!Array.isArray(data)) throw new Error('Invalid tea search response');
      if (!controller.signal.aborted) {
        setTeas(data);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        logger.error('Search failed:', error);
        setSearchError('차 검색 결과를 불러오지 못했습니다.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    searchAbortRef.current?.abort();
    setSearchError(null);
    setIsLoading(false);
    setHasSearched(false);
    setTeas([]);
  }, []);

  const fetchSections = useCallback(async () => {
    setSectionsLoading(true);
    setSectionsError(null);
    const [popularRes, newRes, curationRes, sellersRes, tagsRes] = await Promise.allSettled([
      teasApi.getPopularRankings(10),
      teasApi.getNewRankings(3),
      teasApi.getCuration(3),
      teasApi.getSellers(),
      tagsApi.getPopularTags(15),
    ]);
    if (popularRes.status === 'fulfilled' && Array.isArray(popularRes.value)) {
      setPopularTeas(popularRes.value);
    } else {
      logger.error('Failed to fetch popular rankings:', popularRes.status === 'rejected' ? popularRes.reason : 'Invalid response');
    }
    if (newRes.status === 'fulfilled' && Array.isArray(newRes.value)) {
      setNewTeas(newRes.value);
    } else {
      logger.error('Failed to fetch new rankings:', newRes.status === 'rejected' ? newRes.reason : 'Invalid response');
    }
    if (curationRes.status === 'fulfilled' && Array.isArray(curationRes.value)) {
      setCurationTeas(curationRes.value);
    } else {
      logger.error('Failed to fetch curation:', curationRes.status === 'rejected' ? curationRes.reason : 'Invalid response');
    }
    if (sellersRes.status === 'fulfilled' && Array.isArray(sellersRes.value?.sellers)) {
      setSellers(sellersRes.value.sellers);
    } else if (sellersRes.status === 'rejected') {
      logger.error('Failed to fetch sellers:', sellersRes.reason);
    }
    if (tagsRes.status === 'fulfilled' && Array.isArray(tagsRes.value)) {
      setPopularTags(
        tagsRes.value.map((t: { name: string; noteCount: number }) => ({
          name: t.name,
          noteCount: t.noteCount ?? 0,
        })),
      );
    }
    const anyFailed =
      popularRes.status === 'rejected' || !Array.isArray(popularRes.value) ||
      newRes.status === 'rejected' || !Array.isArray(newRes.value) ||
      curationRes.status === 'rejected' || !Array.isArray(curationRes.value) ||
      sellersRes.status === 'rejected' || !Array.isArray(sellersRes.value?.sellers) ||
      tagsRes.status === 'rejected' || !Array.isArray(tagsRes.value);
    if (anyFailed) {
      setSectionsError('탐색 데이터를 모두 불러오지 못했습니다.');
    }
    setSectionsLoading(false);
  }, []);

  const handleFlavorTagClick = useCallback(
    async (tagName: string) => {
      if (selectedFlavorTag === tagName) {
        setFlavorError(null);
        setSelectedFlavorTag(null);
        setFlavorTeas([]);
        flavorRequestRef.current = null;
        setIsFlavorLoading(false);
        return;
      }

      setFlavorError(null);
      setSelectedFlavorTag(tagName);
      setIsFlavorLoading(true);

      const requestId = (flavorRequestRef.current ?? 0) + 1;
      flavorRequestRef.current = requestId;

      try {
        const data = await teasApi.getByTags([tagName], 'match', 20);
        if (!Array.isArray(data)) throw new Error('Invalid flavor search response');
        if (flavorRequestRef.current === requestId) {
          setFlavorTeas(data);
        }
      } catch {
        if (flavorRequestRef.current === requestId) {
          setFlavorError('향미 검색 결과를 불러오지 못했습니다.');
        }
      } finally {
        if (flavorRequestRef.current === requestId) {
          setIsFlavorLoading(false);
        }
      }
    },
    [selectedFlavorTag],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
    };
  }, []);

  return {
    teas,
    isLoading,
    hasSearched,
    searchError,
    setSearchError,
    sectionsError,
    flavorError,
    setTeas,
    setIsLoading,
    setHasSearched,
    search,
    reset,
    popularTeas,
    newTeas,
    curationTeas,
    sellers,
    popularTags,
    sectionsLoading,
    fetchSections,
    selectedFlavorTag,
    flavorTeas,
    isFlavorLoading,
    handleFlavorTagClick,
  };
}

export function useTeaSearchDebounce(
  searchQuery: string,
  search: (query: string, addToHistory: (q: string) => void) => Promise<void>,
  addToHistory: (q: string) => void,
  reset: () => void,
) {
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length >= 2) {
      const id = setTimeout(() => {
        search(searchQuery, addToHistory);
      }, SEARCH_DEBOUNCE_DELAY);
      return () => clearTimeout(id);
    }
    if (trimmed.length === 0) {
      reset();
    }
  }, [searchQuery, search, addToHistory, reset]);
}
