import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Leaf, PenLine, Package, RefreshCw, Eye, EyeOff, Store, ClipboardList, Tag } from 'lucide-react';
import { cn } from './ui/utils';
import { useAppMode } from '../contexts/AppModeContext';
import { prepareKeyboard } from '../hooks/useMobileKeyboard';

type MenuItem = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isToggle?: boolean;
  isActive?: boolean;
  isPrimary?: boolean;
  isNew?: boolean;
};

function useSpeedDialHide() {
  const { pathname } = useLocation();
  return (
    pathname === '/note/new' ||
    (pathname.startsWith('/note/') && pathname.endsWith('/edit')) ||
    pathname.startsWith('/session/') ||
    pathname === '/sessions' ||
    pathname.startsWith('/blind/') ||
    pathname === '/tea/new' ||
    pathname === '/teahouse/new' ||
    /^\/teahouse\/[^/]+\/edit$/.test(pathname) ||
    pathname === '/cellar' ||
    pathname === '/cellar/new' ||
    /^\/cellar\/\d+\/edit$/.test(pathname) ||
    pathname === '/chadam' ||
    pathname.startsWith('/chadam/') ||
    pathname === '/onboarding' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/find-email' ||
    pathname.startsWith('/admin')
  );
}

export function SpeedDialFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const shouldHide = useSpeedDialHide();
  const { sessionMode, blindMode, toggleSessionMode, toggleBlindMode } = useAppMode();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (shouldHide) return null;

  const FOCUS_PAGES = ['/note/new', '/cellar/new', '/teahouse/new', '/tags', '/tea/new'];

  const navigateTo = (path: string) => {
    setIsOpen(false);
    if (FOCUS_PAGES.some((p) => path.startsWith(p))) {
      prepareKeyboard();
    }
    navigate(path);
  };

  const menuItems: MenuItem[] = [
    {
      label: '찻장에 추가',
      icon: <Package className="w-5 h-5" />,
      onClick: () => navigateTo('/cellar/new'),
    },
  ];

  const addGroup: MenuItem[] = [
    {
      label: '찻집 추가',
      icon: <Store className="w-4 h-4" />,
      onClick: () => navigateTo('/teahouse/new'),
    },
    {
      label: '템플릿 추가',
      icon: <ClipboardList className="w-4 h-4" />,
      onClick: () => navigateTo('/templates'),
      isNew: true,
    },
    {
      label: '태그 추가',
      icon: <Tag className="w-4 h-4" />,
      onClick: () => navigateTo('/tags'),
    },
    {
      label: '차 추가',
      icon: <Leaf className="w-5 h-5" />,
      onClick: () => navigateTo('/tea/new'),
      isPrimary: true,
    },
  ];

  const writeGroup: MenuItem[] = [
    {
      label: '다회 작성',
      icon: <RefreshCw className="w-4 h-4" />,
      onClick: toggleSessionMode,
      isToggle: true,
      isActive: sessionMode.active,
      isNew: true,
    },
    {
      label: '블라인드 작성',
      icon: blindMode.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />,
      onClick: toggleBlindMode,
      isToggle: true,
      isActive: blindMode.active,
      isNew: true,
    },
    {
      label: '차록 작성',
      icon: <PenLine className="w-5 h-5" />,
      onClick: () => navigateTo('/note/new'),
      isPrimary: true,
    },
  ];

  return (
    <>
      {/* 배경 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Speed Dial 컨테이너 */}
      <div
        className={cn('fixed right-6 z-50 flex flex-col items-end md:bottom-6', !isOpen && 'pointer-events-none')}
        style={{ bottom: 'calc(var(--bottom-nav-spacer) + 0.75rem)' }}
      >
        {/* 일반 메뉴 아이템 (FAB 위쪽으로 펼침) */}
        <div className={cn('flex flex-col items-end gap-3 mb-3', !isOpen && 'pointer-events-none')}>
          {menuItems.map((item, index) => {
            const delayMs = (menuItems.length + writeGroup.length - 1 - index) * 50;
            return (
              <div
                key={item.label}
                className={cn(
                  'flex items-center gap-3 transition-all duration-200',
                  isOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-3 pointer-events-none',
                )}
                style={{ transitionDelay: isOpen ? `${delayMs}ms` : '0ms' }}
              >
                <span className="text-xs font-medium px-0 py-1 text-foreground/70 whitespace-nowrap">
                  {item.label}
                </span>
                <button
                  type="button"
                  aria-label={item.label}
                  onClick={item.onClick}
                  className="w-11 h-11 rounded-none flex items-center justify-center bg-transparent border-0 text-foreground hover:text-foreground/65 transition-colors focus-visible:outline-none"
                >
                  {item.icon}
                </button>
              </div>
            );
          })}

          {/* 추가 그룹 (가로 배치) */}
          <div
            className={cn(
              'flex items-center gap-2 transition-all duration-200',
              isOpen
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 translate-y-3 pointer-events-none',
            )}
            style={{ transitionDelay: isOpen ? '100ms' : '0ms' }}
          >
            {addGroup.filter((g) => !g.isPrimary).map((item) => (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                onClick={item.onClick}
                className="relative flex flex-col items-center gap-1 px-0 py-2 rounded-none bg-transparent border-0 text-foreground underline underline-offset-[0.32em] decoration-current hover:text-foreground/65 transition-colors"
              >
                {item.isNew && (
                  <span className="absolute -top-2 right-0 text-[9px] font-medium text-muted-foreground no-underline">new</span>
                )}
                {item.icon}
                <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
              </button>
            ))}
            {addGroup.filter((g) => g.isPrimary).map((item) => (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                onClick={item.onClick}
                className="flex items-center gap-1.5 px-0 py-2.5 rounded-none bg-transparent border-0 text-foreground underline underline-offset-[0.32em] decoration-current transition-colors hover:text-foreground/65 font-semibold text-sm"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* 차록 작성 그룹 (가로 배치) */}
          <div
            className={cn(
              'flex items-center gap-2 transition-all duration-200',
              isOpen
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 translate-y-3 pointer-events-none',
            )}
            style={{ transitionDelay: isOpen ? '50ms' : '0ms' }}
          >
            {writeGroup.filter((g) => !g.isPrimary).map((item) => (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                onClick={item.onClick}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-0 py-2 rounded-none bg-transparent border-0 text-foreground underline underline-offset-[0.32em] decoration-current transition-colors hover:text-foreground/65',
                  item.isToggle && item.isActive && 'font-semibold',
                )}
              >
                {item.isNew && (
                  <span className="absolute -top-2 right-0 text-[9px] font-medium text-muted-foreground no-underline">new</span>
                )}
                {item.icon}
                <span className="text-[10px] font-medium whitespace-nowrap">
                  {item.label}
                  {item.isToggle && item.isActive && <span className="ml-0.5 font-bold">ON</span>}
                </span>
              </button>
            ))}
            {/* 차록 작성 (primary) */}
            {writeGroup.filter((g) => g.isPrimary).map((item) => (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                onClick={item.onClick}
                className="flex items-center gap-1.5 px-0 py-2.5 rounded-none bg-transparent border-0 text-foreground underline underline-offset-[0.32em] decoration-current transition-colors hover:text-foreground/65 font-semibold text-sm"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 메인 FAB */}
        <button
          type="button"
          aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className="minimal-fab-exception pointer-events-auto w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-[0_2px_12px_rgba(43,41,38,0.22)] flex items-center justify-center transition-colors hover:bg-primary/90 focus-visible:outline-none"
        >
          <span
            className={cn(
              'transition-transform duration-300',
              isOpen ? 'rotate-45' : 'rotate-0',
            )}
          >
            <Plus className="w-6 h-6" />
          </span>
        </button>
      </div>
    </>
  );
}
