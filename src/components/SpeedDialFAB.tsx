import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Leaf, PenLine, Package, RefreshCw, Eye, EyeOff, Store, ClipboardList, Tag } from 'lucide-react';
import { cn } from './ui/utils';
import { useAppMode } from '../contexts/AppModeContext';
import { prepareKeyboard } from '../hooks/useMobileKeyboard';
import { BrandMark } from './BrandMark';

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
        <div
          className={cn(
            'flex flex-col items-end gap-3 mb-3 rounded-[1.75rem] border transition-all duration-200',
            isOpen
              ? 'bg-white/95 text-stone-950 border-stone-200/80 shadow-[0_18px_48px_rgba(43,41,38,0.18)] px-4 py-3 backdrop-blur-xl dark:bg-stone-950/95 dark:text-stone-50 dark:border-white/10 dark:shadow-[0_18px_48px_rgba(0,0,0,0.42)]'
              : 'pointer-events-none bg-transparent border-transparent px-0 py-0 shadow-none',
          )}
        >
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
                <span className="text-xs font-medium px-0 py-1 text-current/75 whitespace-nowrap">
                  {item.label}
                </span>
                <button
                  type="button"
                  aria-label={item.label}
                  onClick={item.onClick}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-stone-100/80 border border-stone-200/70 text-current hover:bg-stone-200/80 transition-colors focus-visible:outline-none dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15"
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
                className="relative flex flex-col items-center gap-1 px-2 py-2 rounded-2xl bg-transparent border-0 text-current underline underline-offset-[0.32em] decoration-current hover:bg-stone-100/80 transition-colors dark:hover:bg-white/10"
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
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-stone-100/80 border border-stone-200/70 text-current underline underline-offset-[0.32em] decoration-current transition-colors hover:bg-stone-200/80 font-semibold text-sm dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15"
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
                  'relative flex flex-col items-center gap-1 px-2 py-2 rounded-2xl bg-transparent border-0 text-current underline underline-offset-[0.32em] decoration-current transition-colors hover:bg-stone-100/80 dark:hover:bg-white/10',
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
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-stone-100/80 border border-stone-200/70 text-current underline underline-offset-[0.32em] decoration-current transition-colors hover:bg-stone-200/80 font-semibold text-sm dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15"
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
          className={cn(
            'minimal-fab-exception pointer-events-auto relative isolate w-14 h-14 overflow-hidden rounded-full border shadow-[0_10px_28px_rgba(43,41,38,0.22)] flex items-center justify-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            isOpen
              ? 'bg-white text-primary border-stone-200 hover:bg-white dark:bg-stone-950 dark:text-primary dark:border-white/15 dark:hover:bg-stone-950'
              : 'bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.9),rgba(255,255,255,0.24)_28%,transparent_42%),linear-gradient(135deg,var(--primary),color-mix(in_srgb,var(--primary)_76%,#f6d9a8_24%),color-mix(in_srgb,var(--primary)_70%,#17130f_30%))] text-primary-foreground border-white/35 hover:scale-[1.03] hover:shadow-[0_12px_32px_rgba(43,41,38,0.26)] dark:border-white/15',
          )}
        >
          <span className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_68%_78%,rgba(255,255,255,0.34),transparent_42%)]" />
          <BrandMark
            className={cn(
              'w-8 h-8 transition-transform duration-300 drop-shadow-[0_1px_6px_rgba(0,0,0,0.16)]',
              isOpen ? 'scale-90 rotate-45' : 'scale-100 rotate-0',
            )}
          />
        </button>
      </div>
    </>
  );
}
