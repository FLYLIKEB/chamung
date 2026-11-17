import { User, ChevronLeft, Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChaLogLogo } from './ChaLogLogo';
import { useNotificationCount } from '../hooks/useNotificationCount';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onTitleClick?: () => void;
  showProfile?: boolean;
  showLogo?: boolean;
  /** Retained for callers; shared chrome now uses one opaque pixel surface. */
  tone?: 'default' | 'glassDark';
  /** Retained for callers; navigation remains visible while scrolling. */
  hideWhenCollapsed?: boolean;
}

const iconButton = 'flex h-11 w-11 shrink-0 items-center justify-center text-foreground hover:bg-accent';
const iconSize = 'h-4.5 w-4.5';

export function Header({ title, showBack, onBack, onTitleClick, showProfile, showLogo }: HeaderProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const unreadCount = useNotificationCount();

  return (
    <>
      <header className="pixel-surface fixed top-[calc(0.35rem+env(safe-area-inset-top,0px))] left-4 right-4 z-100 md:left-[176px]">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-2 sm:px-4">
          {showBack && <button type="button" onClick={() => onBack ? onBack() : navigate(-1)} className={iconButton} aria-label="뒤로"><ChevronLeft className={iconSize} /></button>}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {(showLogo || (!title && !showBack)) && (
              <button type="button" onClick={() => navigate('/')} className="flex shrink-0 items-center gap-1" aria-label="차멍 홈으로">
                <ChaLogLogo iconOnly size="compact" className="ml-0 min-h-0 px-0" />
                {!title && <span className="font-title text-lg">차멍</span>}
              </button>
            )}
            {title && <h1 className="min-w-0 truncate text-lg">{onTitleClick ? <button type="button" onClick={onTitleClick} className="font-title">{title}</button> : title}</h1>}
          </div>
          <div className="flex shrink-0 items-center">
            <button type="button" onClick={() => navigate('/sasaek')} className={iconButton} aria-label="탐색"><Search className={iconSize} /></button>
            {isAuthenticated && (
              <button type="button" onClick={() => navigate('/notifications')} className={`${iconButton} relative`} aria-label="알림">
                <Bell className={iconSize} />
                {unreadCount > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-xs text-primary-foreground">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>
            )}
            {showProfile && <button type="button" onClick={() => navigate(isAuthenticated ? '/settings' : '/login')} className={iconButton} aria-label={isAuthenticated ? '설정' : '로그인'}><User className={iconSize} /></button>}
          </div>
        </div>
      </header>
      <div className="shrink-0 w-full" style={{ height: 'var(--header-spacer)', minHeight: 'var(--header-spacer)' }} aria-hidden />
    </>
  );
}
