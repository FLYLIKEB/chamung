import React from 'react';
import { User, ChevronLeft, Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChaLogLogo } from './ChaLogLogo';
import { useNotificationCount } from '../hooks/useNotificationCount';

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

export function Header({ title, showBack, onBack, showProfile, showLogo, tone = 'default' }: HeaderProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const unreadCount = useNotificationCount();

  const headerHeight = 'var(--header-spacer)';
  const isGlassDark = tone === 'glassDark';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 md:left-[160px] z-100 py-2 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] ${
          isGlassDark
            ? 'bg-neutral-950 text-white'
            : 'bg-background text-foreground'
        }`}
      >
        <div className="max-w-2xl md:max-w-5xl lg:max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={() => (onBack ? onBack() : navigate(-1))}
                className={`shrink-0 min-h-9 min-w-9 p-2 -ml-1 rounded-none transition-colors flex items-center justify-center ${
                  isGlassDark ? 'text-white/80 hover:text-white' : 'text-foreground hover:text-foreground/70'
                }`}
                aria-label="뒤로"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
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
                className={`font-['Nanum_Myeongjo'] font-bold text-xl tracking-[-0.04em] truncate min-w-0 pt-0.5 ${
                  isGlassDark ? 'text-white/90' : 'text-foreground'
                }`}
              >
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => navigate('/sasaek')}
              className={`min-h-9 min-w-9 p-2 rounded-none transition-colors flex items-center justify-center ${
                isGlassDark ? 'text-white/75 hover:text-white' : 'hover:text-foreground/70'
              }`}
              aria-label="탐색"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/notifications')}
                className={`relative min-h-9 min-w-9 p-2 rounded-none transition-colors flex items-center justify-center ${
                  isGlassDark ? 'text-white/75 hover:text-white' : 'hover:text-foreground/70'
                }`}
                aria-label="알림"
              >
                <Bell className="w-4.5 h-4.5" />
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
                className={`min-h-9 min-w-9 p-2 rounded-none transition-colors flex items-center justify-center ${
                  isGlassDark ? 'text-white/75 hover:text-white' : 'hover:text-foreground/70'
                }`}
              >
                <User className="w-4.5 h-4.5" />
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
