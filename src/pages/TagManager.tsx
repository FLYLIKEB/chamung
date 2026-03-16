import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { tagsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, TrendingUp, Clock, Heart } from 'lucide-react';
import { cn } from '../components/ui/utils';

interface TagItem {
  name: string;
  noteCount: number;
  isFollowing?: boolean;
}

type TabType = 'popular' | 'recent' | 'following';

export function TagManager() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('popular');
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTags = useCallback(async (tab: TabType) => {
    setIsLoading(true);
    try {
      let data: TagItem[];
      if (tab === 'popular') {
        data = await tagsApi.getPopularTags(50, 'flavor');
      } else if (tab === 'recent') {
        data = await tagsApi.getRecentTags(50);
      } else {
        data = await tagsApi.getFollowedTags();
      }
      setTags(Array.isArray(data) ? data : []);
    } catch {
      toast.error('태그를 불러오는데 실패했습니다.');
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    fetchTags(activeTab);
  }, [activeTab, authLoading, fetchTags]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleToggleFollow = async (tagName: string, isFollowing: boolean) => {
    if (!isAuthenticated) { toast.error('로그인이 필요합니다.'); return; }
    try {
      if (isFollowing) {
        await tagsApi.unfollowTag(tagName);
      } else {
        await tagsApi.followTag(tagName);
      }
      setTags((prev) =>
        prev.map((t) =>
          t.name === tagName ? { ...t, isFollowing: !isFollowing } : t,
        ),
      );
      toast.success(isFollowing ? '팔로우 해제했습니다.' : '팔로우했습니다.');
    } catch {
      toast.error('처리에 실패했습니다.');
    }
  };

  const tabs = [
    { key: 'popular' as const, label: '인기', icon: TrendingUp },
    { key: 'recent' as const, label: '최신', icon: Clock },
    ...(isAuthenticated ? [{ key: 'following' as const, label: '팔로잉', icon: Heart }] : []),
  ];

  return (
    <div className="min-h-screen pb-20">
      <Header title="향미 태그" showBack />

      <div className="px-4 py-4 md:px-8 space-y-4">
        <p className="text-sm text-muted-foreground">향미 태그를 탐색하고 팔로우하세요.</p>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md transition-colors',
                activeTab === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tag list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.name}
                className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card pr-1"
              >
                <button
                  onClick={() => navigate(`/tag/${tag.name}`)}
                  className="flex items-center gap-1.5 pl-3 py-1.5 text-left hover:text-primary transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">#{tag.name}</span>
                  <span className="text-[10px] text-muted-foreground">{tag.noteCount}</span>
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => handleToggleFollow(tag.name, !!tag.isFollowing)}
                    className={cn(
                      'px-2 py-1 rounded-full text-[10px] font-semibold transition-colors',
                      tag.isFollowing
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {tag.isFollowing ? '팔로잉' : '팔로우'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {activeTab === 'following' ? '아직 팔로우한 태그가 없습니다.' : '태그가 없습니다.'}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
