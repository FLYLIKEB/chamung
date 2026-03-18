import { Camera, Globe, Instagram, Loader2, Pencil } from 'lucide-react';
import { User } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  isFollowLoading: boolean;
  noteCount: number;
  onFollowToggle: () => void;
  onEditImage: () => void;
  onEditProfile: () => void;
}

export function ProfileHeader({
  user,
  isOwnProfile,
  isFollowLoading,
  noteCount,
  onFollowToggle,
  onEditImage,
  onEditProfile,
}: ProfileHeaderProps) {
  return (
    <div>
      {/* Gradient banner strip */}
      <div className="h-20 bg-gradient-to-br from-primary/8 via-amber-50/30 to-transparent dark:from-primary/10 dark:via-stone-900/20 dark:to-transparent" />

      <div className="px-4 md:px-8 -mt-10">
        {/* Avatar + Stats row */}
        <div className="flex items-end gap-4">
          <div className="relative shrink-0">
            <div className="ring-2 ring-background rounded-full shadow-sm">
              <UserAvatar
                name={user.name}
                profileImageUrl={user.profileImageUrl}
                size="xl"
                className="md:w-28 md:h-28"
              />
            </div>
            {isOwnProfile && (
              <button
                onClick={onEditImage}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background shadow-sm hover:bg-primary/90 transition-colors"
                aria-label="프로필 사진 수정"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1 flex items-center justify-around pb-2">
            <StatItem value={noteCount} label="차록" />
            <div className="w-px h-7 bg-border/50" />
            <StatItem value={(user.followerCount ?? 0).toLocaleString('ko-KR')} label="구독자" />
            <div className="w-px h-7 bg-border/50" />
            <StatItem value={(user.followingCount ?? 0).toLocaleString('ko-KR')} label="구독" />
          </div>
        </div>

        {/* Name + bio + actions */}
        <div className="mt-3 pb-3 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base text-foreground leading-tight">{user.name}</span>
            {isOwnProfile && (
              <button
                onClick={onEditProfile}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="프로필 편집"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {(user.instagramUrl || user.blogUrl) && (
              <div className="flex items-center gap-1.5">
                {user.instagramUrl && (
                  <a
                    href={user.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="인스타그램"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                )}
                {user.blogUrl && (
                  <a
                    href={user.blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="블로그"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
          {user.bio && (
            <p className="text-sm text-muted-foreground leading-snug">{user.bio}</p>
          )}
          {!isOwnProfile && (
            <div className="pt-1">
              <Button
                onClick={onFollowToggle}
                disabled={isFollowLoading}
                variant={user.isFollowing ? 'secondary' : 'default'}
                size="sm"
                className="w-full h-8 text-sm font-semibold rounded-xl"
              >
                {isFollowLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : user.isFollowing ? (
                  '구독 중'
                ) : (
                  '구독'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg font-bold text-foreground leading-none">{value}</span>
      <span className="text-[11px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}
