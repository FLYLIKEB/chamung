import { useEffect, useRef, useState } from 'react';
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
  /** 스크롤 다운 시 헤더를 완전히 숨김 (캡슐 축소 대신) */
  hideWhenCollapsed?: boolean;
}

const HEADER_SHELL_CLASS = cn(
  'fixed top-[calc(0.35rem+env(safe-area-inset-top,0px))]',
  'left-1/2 -translate-x-1/2 md:left-[calc(50%+86px)]',
  'z-100 py-1 transition-[width,border-radius,box-shadow,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width,border-radius,box-shadow,opacity]',
  LIQUID_GLASS.surface,
);

const HEADER_CONTENT_CLASS = 'max-w-2xl md:max-w-5xl lg:max-w-6xl mx-auto relative flex items-center px-3 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-5';
const HEADER_ICON_CLASS = 'w-4.5 h-4.5';
const HEADER_SIDE_CLASS = 'absolute inset-y-0 flex items-center';

function headerIconButtonClass(isGlassDark: boolean, className?: string) {
  return cn(
    'h-10 w-10 p-2 rounded-full transition-colors flex items-center justify-center',
    isGlassDark ? 'text-white/75 hover:text-white' : 'text-foreground hover:text-foreground/70',
    className,
  );
}

export function Header({ title, showBack, onBack, showProfile, showLogo, tone = 'default', hideWhenCollapsed = false }: HeaderProps) {
  const headerRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const unreadCount = useNotificationCount();
  const [scrollState, setScrollState] = useState({ isScrolled: false, isScrollingDown: false });

  const headerHeight = 'var(--header-spacer)';
  const isGlassDark = tone === 'glassDark';
  const isCollapsed = scrollState.isScrollingDown;

  useEffect(() => {
    const scrollRoot = headerRef.current?.closest('main') ?? window;
    let previousTop = scrollRoot instanceof Window ? scrollRoot.scrollY : scrollRoot.scrollTop;
    let downDistance = 0;
    let upDistance = 0;
    let isCollapsed = false;
    let frame = 0;

    const updateScrollState = () => {
      const currentTop = scrollRoot instanceof Window ? scrollRoot.scrollY : scrollRoot.scrollTop;
      const delta = currentTop - previousTop;
      const isScrolled = currentTop > 12;

      if (currentTop < 24) {
        downDistance = 0;
        upDistance = 0;
        isCollapsed = false;
      } else if (delta > 2) {
        downDistance += delta;
        upDistance = 0;
        if (currentTop > 96 && downDistance > 36) {
          isCollapsed = true;
          downDistance = 0;
        }
      } else if (delta < -2) {
        upDistance += Math.abs(delta);
        downDistance = 0;
        if (upDistance > 56) {
          isCollapsed = false;
          upDistance = 0;
        }
      }

      const nextState = {
        isScrolled,
        isScrollingDown: isCollapsed,
      };

      previousTop = currentTop;
      setScrollState((prev) =>
        prev.isScrolled === nextState.isScrolled && prev.isScrollingDown === nextState.isScrollingDown
          ? prev
          : nextState,
      );
    };

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateScrollState();
      });
    };

    updateScrollState();
    scrollRoot.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      scrollRoot.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          HEADER_SHELL_CLASS,
          isGlassDark ? 'text-white' : 'text-foreground',
          isCollapsed && hideWhenCollapsed
            ? 'w-[calc(100%-2rem)] rounded-[1.5rem] opacity-0 pointer-events-none md:w-[calc(100%-12rem)]'
            : isCollapsed
            ? 'w-[4.25rem] rounded-full opacity-100 shadow-[0_18px_52px_rgba(0,0,0,0.18)]'
            : cn(
                'w-[calc(100%-2rem)] rounded-[1.5rem] opacity-100 md:w-[calc(100%-12rem)]',
                scrollState.isScrolled && 'rounded-[1.25rem] shadow-[0_16px_46px_rgba(0,0,0,0.16)]',
              ),
        )}
      >
        <div className={cn(HEADER_CONTENT_CLASS, isCollapsed ? 'h-10' : scrollState.isScrolled ? 'h-12' : 'h-12', isCollapsed && 'px-0 sm:px-0')}>
          <div
            className={cn(
              HEADER_SIDE_CLASS,
              'left-3 justify-start transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] sm:left-5',
              isCollapsed && 'pointer-events-none -translate-x-2 opacity-0',
            )}
          >
            {showBack && (
              <button
                onClick={() => (onBack ? onBack() : navigate(-1))}
                className={headerIconButtonClass(isGlassDark, '-ml-2')}
                aria-label="뒤로"
              >
                <ChevronLeft className={HEADER_ICON_CLASS} />
              </button>
            )}
          </div>

          <div className={cn(
            'absolute inset-y-0 left-1/2 flex min-w-0 -translate-x-1/2 items-center justify-center text-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            isCollapsed ? 'px-0' : 'px-12',
          )}>
            {isCollapsed ? (
              <ChaLogLogo
                iconOnly
                asButton
                onClick={() => navigate('/')}
                size="compact"
                className="ml-0 px-0"
              />
            ) : showLogo || (!title && !showBack) ? (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex flex-col items-center justify-center rounded-full px-0 transition-opacity hover:opacity-80"
                aria-label="차멍 홈으로"
              >
                <ChaLogLogo iconOnly size="compact" className="ml-0 min-h-0 px-0" />
                <span className="-mt-1 font-['Nanum_Myeongjo'] text-[10px] font-bold leading-none tracking-[-0.04em]">차멍</span>
              </button>
            ) : title ? (
              <h1
                className={cn(
                  "min-w-0 truncate pt-0.5 font-['Nanum_Myeongjo'] text-xl font-bold tracking-[-0.04em]",
                  isGlassDark ? 'text-white/90' : 'text-foreground',
                )}
              >
                {title}
              </h1>
            ) : null}
          </div>

          <div
            className={cn(
              HEADER_SIDE_CLASS,
              'right-3 justify-end gap-0.5 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] sm:right-5',
              isCollapsed && 'pointer-events-none translate-x-2 opacity-0',
            )}
          >
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
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
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
