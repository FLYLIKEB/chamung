import { User, ChevronLeft, Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChaLogLogo } from './ChaLogLogo';
import { useNotificationCount } from '../hooks/useNotificationCount';
import { LIQUID_GLASS } from '../constants/liquidGlass';
import { cn } from './ui/utils';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  /** 커스텀 뒤로가기 동작 (미제공 시 navigate(-1)) */
  onBack?: () => void;
  showProfile?: boolean;
  /** 차멍 로고 표시 (메인 탭 등에서 브랜딩용, 클릭 시 홈으로) */
  showLogo?: boolean;
  /** 상세/브랜드 화면에서 쓰는 어두운 유리 헤더 */
  tone?: 'default' | 'glassDark';
}

const HEADER_SHELL_CLASS = cn(
  'fixed top-[calc(0.35rem+env(safe-area-inset-top,0px))] left-4 right-4 md:left-[176px] md:right-4',
  'z-100 rounded-[1.5rem] py-1.5',
  LIQUID_GLASS.surface,
);

const HEADER_CONTENT_CLASS = 'max-w-2xl md:max-w-5xl lg:max-w-6xl mx-auto flex items-center justify-between px-3 sm:px-5';
const HEADER_ICON_CLASS = 'w-4.5 h-4.5';

function headerIconButtonClass(isGlassDark: boolean, className?: string) {
  return cn(
    'min-h-9 min-w-9 p-2 rounded-full transition-colors flex items-center justify-center',
    isGlassDark ? 'text-white/75 hover:text-white' : 'text-foreground hover:text-foreground/70',
    className,
  );
}

export function Header({ title, showBack, onBack, showProfile, showLogo, tone = 'default' }: HeaderProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const unreadCount = useNotificationCount();

  const headerHeight = 'var(--header-spacer)';
  const isGlassDark = tone === 'glassDark';

  return (
    <>
      <header
        className={cn(HEADER_SHELL_CLASS, isGlassDark ? 'text-white' : 'text-foreground')}
      >
        <div className={HEADER_CONTENT_CLASS}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={() => (onBack ? onBack() : navigate(-1))}
                className={headerIconButtonClass(isGlassDark, 'shrink-0 -ml-1')}
                aria-label="뒤로"
              >
                <ChevronLeft className={HEADER_ICON_CLASS} />
              </button>
            )}
            {(showLogo || (!title && !showBack) || showBack) && (
              <ChaLogLogo
                iconOnly={!!title}
                asButton
                onClick={() => navigate('/')}
                size="compact"
              />
            )}
            {title && (
              <h1
                className={cn(
                  "font-['Nanum_Myeongjo'] font-bold text-xl tracking-[-0.04em] truncate min-w-0 pt-0.5",
                  isGlassDark ? 'text-white/90' : 'text-foreground',
                )}
              >
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => navigate('/sasaek')}
              className={headerIconButtonClass(isGlassDark)}
              aria-label="탐색"
            >
              <Search className={HEADER_ICON_CLASS} />
            </button>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/notifications')}
                className={headerIconButtonClass(isGlassDark, 'relative')}
                aria-label="알림"
              >
                <Bell className={HEADER_ICON_CLASS} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            {showProfile && (
              <button
                onClick={() => navigate(isAuthenticated ? '/settings' : '/login')}
                className={headerIconButtonClass(isGlassDark)}
              >
                <User className={HEADER_ICON_CLASS} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 고정 헤더 높이만큼 스페이서 */}
      <div
        className="shrink-0 w-full"
        style={{ height: headerHeight, minHeight: headerHeight }}
        aria-hidden
      />
    </>
  );
}
