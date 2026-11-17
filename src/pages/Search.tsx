import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAutoFocus } from '../hooks/useAutoFocus';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { Search as SearchIcon, Clock, X } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { BottomNav } from '../components/BottomNav';
import { tagsApi, notesApi, cellarApi, teasApi, usersApi } from '../lib/api';
import { Seller, Note, CellarItem, Tea } from '../types';
import { SEARCH_DEBOUNCE_DELAY } from '../constants';
import { cn } from '../components/ui/utils';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { useSearchFilters } from '../hooks/useSearchFilters';
import { useAuth } from '../contexts/AuthContext';
import { useTeaSearch, useTeaSearchDebounce } from '../hooks/useTeaSearch';
import { FilterPanel } from '../components/search/FilterPanel';
import { SearchResults } from '../components/search/SearchResults';
import { ExploreSection } from '../components/search/ExploreSection';
import type { SearchCategory } from '../components/search/SearchResults';

const SEARCH_CATEGORIES: { key: SearchCategory; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'tea', label: '차' },
  { key: 'note', label: '내 차록' },
  { key: 'cellar', label: '찻장' },
  { key: 'seller', label: '찻집' },
  { key: 'tag', label: '향미' },
];

const SECTION_TITLES: Record<string, string> = {
  popular: '🏆 사랑받는 차',
  new: '🆕 신규 차',
  curation: '✨ 맞춤차',
};

export function Search() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useAutoFocus();
  useScrollRestoration(scrollContainerRef);

  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();
  const { user } = useAuth();
  const { recentSearches, addSearch, removeSearch, clearAll } = useRecentSearches();
  const filters = useSearchFilters();
  const {
    filterType, filterMinRating,
    filterSort, noteSort, setNoteSort,
    filterOpen, setFilterOpen, activeFilterCount,
    urlTags, hasTagParams, hasFilterParams,
    handleTagClick, applyFilters, fetchWithFilters,
  } = filters;

  const {
    teas, isLoading, hasSearched, searchError, setSearchError, sectionsError, flavorError,
    setTeas, setIsLoading, setHasSearched,
    search, reset: resetSearch,
    popularTeas, newTeas, curationTeas, sellers,
    popularTags, sectionsLoading, fetchSections,
    selectedFlavorTag, flavorTeas, isFlavorLoading, handleFlavorTagClick,
  } = useTeaSearch();

  const [cellarSort, setCellarSort] = useState<'name' | 'quantity' | 'recent'>('recent');
  const [trendingTeas, setTrendingTeas] = useState<Tea[]>([]);
  const [trendingCreators, setTrendingCreators] = useState<Array<{ id: number; name: string; profileImageUrl?: string | null; followerCount: number }>>([]);
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [allTags, setAllTags] = useState<{ name: string; noteCount: number }[]>([]);
  const [noteResults, setNoteResults] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [sellerResults, setSellerResults] = useState<Seller[]>([]);
  const [tagResults, setTagResults] = useState<{ name: string; noteCount: number }[]>([]);
  const [cellarResults, setCellarResults] = useState<CellarItem[]>([]);
  const [allCellar, setAllCellar] = useState<CellarItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const filterCallbacks = useMemo(
    () => ({ setTeas, setIsLoading, setHasSearched, setError: setSearchError }),
    [setTeas, setIsLoading, setHasSearched, setSearchError],
  );
  const urlTagsStr = searchParams.get('tags') ?? '';

  useTeaSearchDebounce(searchQuery, search, addSearch, resetSearch);

  useEffect(() => {
    let cancelled = false;
    setCategoryError(null);
    if (searchCategory === 'tea') { setCategoryLoading(false); return; }
    setCategoryLoading(true);
    const timer = setTimeout(async () => {
      const includes = (category: SearchCategory) => searchCategory === 'all' || searchCategory === category;
      try {
        const [notesData, tagsData, cellarData, sellersData] = await Promise.all([
          includes('note') && user?.id
            ? notesApi.getAll(user.id, undefined, undefined, undefined, undefined, noteSort, 1, 200)
            : Promise.resolve([]),
          includes('tag') ? tagsApi.getPopularTags(100) : Promise.resolve([]),
          includes('cellar') && user?.id ? cellarApi.getAll() : Promise.resolve([]),
          includes('seller') ? teasApi.getSellers(searchQuery.trim() || undefined) : Promise.resolve({ sellers: [] }),
        ]);
        if (cancelled) return;
        const notes = Array.isArray(notesData) ? notesData : (notesData as { data?: Note[] })?.data;
        if (!Array.isArray(notes) || !Array.isArray(tagsData) || !Array.isArray(cellarData) || !Array.isArray(sellersData?.sellers)) {
          throw new Error('Invalid search response');
        }
        setAllNotes(notes);
        setAllTags(tagsData);
        setAllCellar(cellarData);
        setSellerResults(sellersData.sellers);
      } catch {
        if (!cancelled) setCategoryError('검색 결과를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setCategoryLoading(false);
      }
    }, SEARCH_DEBOUNCE_DELAY);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchCategory, user?.id, noteSort, searchQuery, retry]);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (searchCategory === 'note' || searchCategory === 'all') {
      const filtered = allNotes.filter((n) => {
        if (q && !n.teaName?.toLowerCase().includes(q) && !n.memo?.toLowerCase().includes(q) && !n.teaSeller?.toLowerCase().includes(q)) return false;
        if (filterType && n.teaType !== filterType) return false;
        if (filterMinRating != null && (n.overallRating == null || n.overallRating < filterMinRating)) return false;
        if (urlTags.length > 0 && !urlTags.every((tag) => n.tags?.includes(tag))) return false;
        return true;
      });
      setNoteResults(searchCategory === 'all' ? filtered.slice(0, 6) : filtered);
    }
    if (searchCategory === 'cellar' || searchCategory === 'all') {
      let filtered = allCellar.filter((c) => {
        if (q && !c.tea?.name?.toLowerCase().includes(q)) return false;
        if (filterType && c.tea?.type !== filterType) return false;
        return true;
      });
      if (searchCategory === 'cellar') {
        if (cellarSort === 'name') filtered = [...filtered].sort((a, b) => (a.tea?.name ?? '').localeCompare(b.tea?.name ?? ''));
        else if (cellarSort === 'quantity') filtered = [...filtered].sort((a, b) => b.quantity - a.quantity);
        else filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      setCellarResults(searchCategory === 'all' ? filtered.slice(0, 4) : filtered);
    }
    if (searchCategory === 'tag' || searchCategory === 'all') {
      const filtered = q ? allTags.filter((t) => t.name?.toLowerCase().includes(q)) : allTags;
      setTagResults(searchCategory === 'all' ? filtered.slice(0, 8) : filtered);
    }
  }, [searchQuery, searchCategory, allNotes, allCellar, allTags, filterType, filterMinRating, urlTagsStr, cellarSort]);

  const noteHasFilters = !!(filterType || filterMinRating != null || urlTags.length > 0);
  const cellarHasFilters = !!filterType;
  const showResults =
    searchCategory === 'tea'
      ? searchQuery.length > 0 || hasSearched || hasFilterParams
      : searchCategory === 'all'
        ? searchQuery.trim().length >= 2
        : searchQuery.trim().length >= 2 ||
          (searchCategory === 'note' && noteHasFilters) ||
          (searchCategory === 'cellar' && cellarHasFilters);

  const navigableItems = useMemo(() => {
    if (!showResults) return [];
    if (searchCategory === 'tea') return teas.map((t) => `/tea/${t.id}`);
    if (searchCategory === 'note') return noteResults.map((n) => `/note/${n.id}`);
    if (searchCategory === 'cellar') return cellarResults.map((c) => `/cellar/${c.id}`);
    if (searchCategory === 'seller') return sellerResults.map((s) => `/teahouse/${encodeURIComponent(s.name)}`);
    if (searchCategory === 'tag') return tagResults.map((t) => `/tag/${encodeURIComponent(t.name)}`);
    if (searchCategory === 'all') return [
      ...teas.slice(0, 5).map((t) => `/tea/${t.id}`),
      ...noteResults.slice(0, 6).map((n) => `/note/${n.id}`),
      ...sellerResults.slice(0, 6).map((s) => `/teahouse/${encodeURIComponent(s.name)}`),
      ...tagResults.slice(0, 8).map((t) => `/tag/${encodeURIComponent(t.name)}`),
    ];
    return [];
  }, [searchCategory, teas, noteResults, cellarResults, sellerResults, tagResults, showResults]);

  useEffect(() => { setSelectedIndex(-1); }, [searchQuery, searchCategory]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (navigableItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, navigableItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      navigate(navigableItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      setSelectedIndex(-1);
    }
  }, [navigableItems, selectedIndex, navigate]);

  useEffect(() => {
    if (hasFilterParams) {
      setHasSearched(true);
      const urlSort = searchParams.get('sort') as 'popular' | 'new' | 'rating' | 'match' | 'recent' | null;
      const urlType = searchParams.get('type');
      const urlMinRating = searchParams.get('minRating');
      if (hasTagParams) {
        fetchWithFilters({ tags: urlTags, sort: urlSort && ['match', 'popular', 'recent'].includes(urlSort) ? urlSort : 'match' }, { setTeas, setIsLoading, setError: setSearchError });
      } else {
        fetchWithFilters({ q: searchQuery.trim() || undefined, type: urlType || undefined, minRating: urlMinRating ? parseFloat(urlMinRating) : undefined, sort: urlSort || 'popular' }, { setTeas, setIsLoading, setError: setSearchError });
      }
    }
  }, [hasFilterParams, hasTagParams, urlTagsStr, searchParams, fetchWithFilters, searchQuery, setTeas, setIsLoading, setHasSearched, setSearchError, urlTags, retry]);

  useEffect(() => {
    if (!searchQuery.trim() && !hasSearched && !hasFilterParams) {
      fetchSections();
    }
  }, [searchQuery, hasSearched, hasFilterParams, fetchSections]);

  const [trendingError, setTrendingError] = useState<string | null>(null);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingRetry, setTrendingRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setTrendingError(null);
    setTrendingLoading(true);
    const loadTrending = async () => {
      try {
        const [teas, creators] = await Promise.all([
          teasApi.getTrending('7d'),
          usersApi.getTrending('7d'),
        ]);
        if (!Array.isArray(teas) || !Array.isArray(creators)) throw new Error('Invalid trending response');
        if (!cancelled) {
          setTrendingTeas(teas);
          setTrendingCreators(creators);
        }
      } catch {
        if (!cancelled) setTrendingError('인기 차와 다우 목록을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setTrendingLoading(false);
      }
    };
    void loadTrending();
    return () => { cancelled = true; };
  }, [trendingRetry]);

  const handleApplyFilters = useCallback(() => {
    if (searchCategory === 'tea' || searchCategory === 'all') {
      applyFilters('tea', searchQuery, filterCallbacks);
    } else {
      setFilterOpen(false);
    }
  }, [applyFilters, searchCategory, searchQuery, filterCallbacks, setFilterOpen]);

  const urlSection = searchParams.get('section') as 'popular' | 'new' | 'curation' | null;
  const resultsTitle =
    urlSection && SECTION_TITLES[urlSection]
      ? SECTION_TITLES[urlSection]
      : urlTags.length > 0
        ? `🔍 #${urlTags.join(', #')} 추천`
        : searchQuery.trim()
          ? '🔍 검색 결과'
          : '🔍 차 탐색';

  const goBackToExplore = useCallback(() => {
    setSearchParams({});
    setSearchQuery('');
    setHasSearched(false);
  }, [setSearchParams, setHasSearched]);

  const onTagClick = useCallback(
    (tagName: string) => {
      handleTagClick(tagName);
      setHasSearched(true);
    },
    [handleTagClick, setHasSearched],
  );

  return (
    <div className="min-h-screen pb-20 flex flex-col overflow-hidden">
      <Header
        title={showResults ? resultsTitle : '차 탐색'}
        showBack={showResults}
        onBack={showResults ? goBackToExplore : undefined}
        showLogo
        showProfile
      />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="차 이름, 종류, 구매처로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn('pl-10 rounded-full transition-all', searchQuery ? 'pr-10' : '')}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="검색어 지우기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {searchQuery.trim().length === 1 && (
            <p className="absolute -bottom-5 left-4 text-xs text-muted-foreground animate-fade-in">
              한 글자 더 입력하면 검색됩니다
            </p>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1">
            {SEARCH_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSearchCategory(cat.key)}
                className={cn(
                  'shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  searchCategory === cat.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

        {!showResults && searchQuery.trim().length === 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">최근 검색어</span>
              {recentSearches.length > 0 && (
                <button type="button" onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  전체 삭제
                </button>
              )}
            </div>
            {recentSearches.length > 0 ? (
              <ul className="space-y-1">
                {recentSearches.map((term) => (
                  <li key={term} className="flex items-center gap-2 py-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(term); search(term, addSearch); }}
                      className="flex-1 text-left text-sm truncate"
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSearch(term)}
                      className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`${term} 삭제`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground py-2">아직 검색어가 없어요.</p>
            )}
          </div>
        )}

        {(searchCategory === 'tea' || searchCategory === 'note' || searchCategory === 'cellar' || searchCategory === 'all') && (
          <FilterPanel
            category={searchCategory}
            filterOpen={filterOpen}
            setFilterOpen={setFilterOpen}
            activeFilterCount={activeFilterCount}
            filterType={filterType}
            setFilterType={filters.setFilterType}
            filterMinRating={filterMinRating}
            setFilterMinRating={filters.setFilterMinRating}
            filterSort={filterSort}
            setFilterSort={filters.setFilterSort}
            noteSort={noteSort}
            setNoteSort={setNoteSort}
            cellarSort={cellarSort}
            setCellarSort={setCellarSort}
            hasTagParams={hasTagParams}
            urlTags={urlTags}
            popularTags={popularTags}
            handleTagClick={onTagClick}
            onApply={handleApplyFilters}
          />
        )}

        {showResults && !user && (searchCategory === 'note' || searchCategory === 'cellar') ? (
          <div className="space-y-3 py-8 text-center"><p>내 기록을 보려면 로그인해 주세요.</p><Button onClick={() => navigate('/login')}>로그인</Button></div>
        ) : showResults && (
          <SearchResults
            error={categoryError || ((searchCategory === 'tea' || searchCategory === 'all') ? searchError : null)}
            onRetry={() => { setRetry((value) => value + 1); if (!hasFilterParams && (searchCategory === 'tea' || searchCategory === 'all')) void search(searchQuery, addSearch); }}
            searchCategory={searchCategory}
            isLoading={isLoading}
            categoryLoading={categoryLoading}
            teas={teas}
            noteResults={noteResults}
            cellarResults={cellarResults}
            sellerResults={sellerResults}
            tagResults={tagResults}
            hasSearched={hasSearched}
            hasFilterParams={hasFilterParams}
            onGoBack={goBackToExplore}
            selectedIndex={selectedIndex}
          />
        )}

        {!showResults && searchQuery.trim().length === 0 && trendingLoading && (
          <p role="status" className="text-sm text-muted-foreground">인기 목록을 불러오는 중…</p>
        )}
        {!showResults && searchQuery.trim().length === 0 && trendingError && (
          <div role="alert" className="space-y-3 py-4">
            <p>{trendingError}</p>
            <Button onClick={() => setTrendingRetry((value) => value + 1)}>인기 목록 다시 시도</Button>
          </div>
        )}
        {!showResults && sectionsError && (
          <div role="alert" className="space-y-3 py-4"><p>{sectionsError}</p><Button onClick={fetchSections}>다시 시도</Button></div>
        )}
        {!showResults && flavorError && (
          <div role="alert" className="space-y-3"><p>{flavorError}</p><Button onClick={() => selectedFlavorTag && handleFlavorTagClick(selectedFlavorTag)}>향미 선택으로 돌아가기</Button></div>
        )}
        {!showResults && !sectionsError && !flavorError && searchQuery.trim().length === 0 && (
          <ExploreSection
            sectionsLoading={sectionsLoading}
            popularTeas={popularTeas}
            newTeas={newTeas}
            curationTeas={curationTeas}
            sellers={sellers}
            popularTags={popularTags}
            selectedFlavorTag={selectedFlavorTag}
            flavorTeas={flavorTeas}
            isFlavorLoading={isFlavorLoading}
            onFlavorTagClick={handleFlavorTagClick}
            trendingTeas={trendingTeas}
            trendingCreators={trendingCreators}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
