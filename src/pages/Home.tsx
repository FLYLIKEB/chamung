import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { HomeFooter } from '../components/HomeFooter';
import { PersonalizedHero } from '../components/home/PersonalizedHero';
import { WeeklyStreak } from '../components/home/WeeklyStreak';
import { ModeCarousel } from '../components/home/ModeCarousel';
import { ForYouFeed } from '../components/feeds/ForYouFeed';
import { FollowingFeed } from '../components/feeds/FollowingFeed';
import { TagsFeed } from '../components/feeds/TagsFeed';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { notesApi, tagsApi } from '../lib/api';
import { Note, PopularTagItem } from '../types';
import { logger } from '../lib/logger';
import { Button } from '../components/ui/button';

type FeedTab = 'forYou' | 'following' | 'tags';

export function Home() {
  useScrollRestoration();
  const navigate = useNavigate();

  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [feedTab, setFeedTab] = useState<FeedTab>('forYou');
  const [publicNotes, setPublicNotes] = useState<Note[]>([]);
  const [followingNotes, setFollowingNotes] = useState<Note[]>([]);
  const [tagNotes, setTagNotes] = useState<Note[]>([]);
  const [followedTags, setFollowedTags] = useState<PopularTagItem[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [hasTodayNote, setHasTodayNote] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFeedError(null);
    if (feedTab !== 'forYou' && (authLoading || !currentUser)) {
      setIsFeedLoading(authLoading);
      return;
    }
    setIsFeedLoading(true);
    const load = async () => {
      try {
        if (feedTab === 'forYou') {
          const notes = await notesApi.getAll(undefined, true);
          if (!Array.isArray(notes)) throw new Error('Invalid public feed response');
          if (!cancelled) setPublicNotes(notes);
        } else if (feedTab === 'following') {
          const notes = await notesApi.getAll(undefined, undefined, undefined, undefined, 'following');
          if (!Array.isArray(notes)) throw new Error('Invalid following feed response');
          if (!cancelled) setFollowingNotes(notes);
        } else {
          const [notes, tags] = await Promise.all([
            notesApi.getAll(undefined, undefined, undefined, undefined, 'tags'),
            tagsApi.getFollowedTags(),
          ]);
          if (!Array.isArray(notes) || !Array.isArray(tags)) throw new Error('Invalid tag feed response');
          if (!cancelled) {
            setTagNotes(notes);
            setFollowedTags(tags);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch feed:', error);
        if (!cancelled) setFeedError('차록을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setIsFeedLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [feedTab, currentUser?.id, authLoading, retry]);

  const requestState = isFeedLoading ? (
    <p role="status" className="py-10 text-center text-muted-foreground">차록을 불러오는 중…</p>
  ) : feedError ? (
    <div role="alert" className="space-y-3 py-10 text-center">
      <p>{feedError}</p>
      <Button onClick={() => setRetry((value) => value + 1)}>다시 시도</Button>
    </div>
  ) : null;

  return (
    <div className="min-h-screen pb-20">
      <Header showProfile showLogo />
      <div className="px-4 py-5 pb-20 sm:px-6 space-y-5 md:space-y-6">
        <PersonalizedHero hasTodayNote={hasTodayNote} streak={streak} />
        <ModeCarousel />
        {currentUser && (
          <WeeklyStreak
            onTodayNoteStatus={setHasTodayNote}
            onStreakLoaded={setStreak}
          />
        )}

        {/* 차록 피드 (통합: 수평 하이라이트 + 탭) */}
        <section aria-label="차록 피드" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-title text-base text-foreground">차록 흐름</span>
            <button
              onClick={() => navigate('/sasaek?tab=explore')}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              탐색에서 전체 보기
            </button>
          </div>

          {/* Feed tabs */}
          <Tabs value={feedTab} onValueChange={(v) => setFeedTab(v as FeedTab)}>
            <TabsList className="w-full">
              <TabsTrigger value="forYou" className="flex-1 text-sm font-medium">최신</TabsTrigger>
              <TabsTrigger value="following" className="flex-1 text-sm font-medium">구독</TabsTrigger>
              <TabsTrigger value="tags" className="flex-1 text-sm font-medium">향미</TabsTrigger>
            </TabsList>
            <TabsContent value="forYou">
              {requestState ?? <ForYouFeed notes={publicNotes} />}
            </TabsContent>
            <TabsContent value="following">
              {requestState ?? <FollowingFeed
                notes={followingNotes}
                isLoading={false}
                isLoggedIn={!!currentUser}
                authLoading={authLoading}
              />}
            </TabsContent>
            <TabsContent value="tags">
              {requestState ?? <TagsFeed
                notes={tagNotes}
                followedTags={followedTags}
                isLoading={false}
                isLoggedIn={!!currentUser}
                authLoading={authLoading}
              />}
            </TabsContent>
          </Tabs>
        </section>

        <HomeFooter recentContributors={[]} />
      </div>
      <BottomNav />
    </div>
  );
}
