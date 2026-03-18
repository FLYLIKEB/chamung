import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { User } from '@/types';
import { followsApi } from '@/lib/api';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { logger } from '@/lib/logger';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface FollowersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  followerCount: number;
}

export function FollowersDrawer({ open, onOpenChange, userId, followerCount }: FollowersDrawerProps) {
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    followsApi.getFollowers(userId)
      .then(setFollowers)
      .catch((err) => { logger.error('Failed to fetch followers:', err); })
      .finally(() => setIsLoading(false));
  }, [open, userId]);

  const handleUserClick = (id: number) => {
    onOpenChange(false);
    navigate(`/user/${id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl px-0 pb-safe">
        <SheetHeader className="px-4 pb-3 border-b border-border/40">
          <SheetTitle className="text-base font-semibold">
            구독자 {followerCount > 0 ? followerCount.toLocaleString('ko-KR') : ''}
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-full pb-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : followers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              아직 구독자가 없어요.
            </p>
          ) : (
            <ul>
              {followers.map((follower) => (
                <li key={follower.id}>
                  <button
                    type="button"
                    onClick={() => handleUserClick(follower.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                  >
                    <UserAvatar
                      name={follower.name}
                      profileImageUrl={follower.profileImageUrl}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{follower.name}</p>
                      {follower.bio && (
                        <p className="text-xs text-muted-foreground truncate">{follower.bio}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
