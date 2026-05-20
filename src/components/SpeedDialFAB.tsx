import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Eye, EyeOff, Leaf, Package, PenLine, RefreshCw, Store, Tag } from 'lucide-react';
import { cn } from './ui/utils';
import { useAppMode } from '../contexts/AppModeContext';
import { prepareKeyboard } from '../hooks/useMobileKeyboard';
import { AddLogoIcon } from './AddLogoIcon';
import { LIQUID_GLASS } from '../constants/liquidGlass';
import { LOGO_FAB_ABOVE_NAV_BOTTOM, LOGO_FAB_BUTTON_CLASS, LOGO_FAB_ICON_CLASS, LOGO_FAB_RIGHT_CLASS } from '../constants/logoFab';

type MenuItem = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  isToggle?: boolean;
  isActive?: boolean;
  isPrimary?: boolean;
  isNew?: boolean;
};

const HIDDEN_PATH_PATTERNS = [
  /^\/note\/new$/,
  /^\/note\/.*\/edit$/,
  /^\/session\//,
  /^\/sessions$/,
  /^\/blind\//,
  /^\/tea\/new$/,
  /^\/teahouse\/new$/,
  /^\/teahouse\/[^/]+\/edit$/,
  /^\/cellar$/,
  /^\/cellar\/new$/,
  /^\/cellar\/\d+\/edit$/,
  /^\/chadam(?:\/.*)?$/,
  /^\/onboarding$/,
  /^\/forgot-password$/,
  /^\/reset-password$/,
  /^\/find-email$/,
  /^\/admin/,
];

const FOCUS_PAGES = ['/note/new', '/cellar/new', '/teahouse/new', '/tags', '/tea/new'];

const PANEL_CLASS = 'flex flex-col items-end gap-3 mb-3 text-white transition-all duration-200';
const HIDDEN_PANEL_CLASS = 'pointer-events-none';
const ROW_REVEAL_BASE = 'flex items-center transition-all duration-200';
const ROUND_ACTION_CLASS = cn(
  LIQUID_GLASS.control,
  'w-11 h-11 rounded-full flex items-center justify-center text-current transition-colors focus-visible:outline-none',
);
const TILE_ACTION_CLASS = cn(
  LIQUID_GLASS.control,
  'relative flex flex-col items-center gap-1 px-2 py-2 rounded-2xl text-current underline underline-offset-[0.32em] decoration-current transition-colors',
);
const PRIMARY_ACTION_CLASS = cn(
  LIQUID_GLASS.control,
  'flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-current underline underline-offset-[0.32em] decoration-current transition-colors font-semibold text-sm',
);
const FAB_CLASS = cn(
  'minimal-fab-exception pointer-events-auto relative isolate rounded-full flex items-center justify-center',
  LOGO_FAB_BUTTON_CLASS,
  'transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 hover:scale-[1.03]',
  LIQUID_GLASS.surface,
  LIQUID_GLASS.fab,
);

function useSpeedDialHide() {
  const { pathname } = useLocation();
  return HIDDEN_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

function revealClass(isOpen: boolean, gapClass = 'gap-2') {
  return cn(
    ROW_REVEAL_BASE,
    gapClass,
    isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none',
  );
}

function NewBadge() {
  return <span className="absolute -top-2 right-0 text-[9px] font-medium text-muted-foreground no-underline">new</span>;
}

function ActionTile({ item, className }: { item: MenuItem; className?: string }) {
  return (
    <button
      type="button"
      aria-label={item.label}
      onClick={item.onClick}
      className={cn(className ?? TILE_ACTION_CLASS, item.isToggle && item.isActive && 'font-semibold')}
    >
      {item.isNew && <NewBadge />}
      {item.icon}
      <span className="text-[10px] font-medium whitespace-nowrap">
        {item.label}
        {item.isToggle && item.isActive && <span className="ml-0.5 font-bold">ON</span>}
      </span>
    </button>
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
    { label: '찻집 추가', icon: <Store className="w-4 h-4" />, onClick: () => navigateTo('/teahouse/new') },
    { label: '템플릿 추가', icon: <ClipboardList className="w-4 h-4" />, onClick: () => navigateTo('/templates'), isNew: true },
    { label: '태그 추가', icon: <Tag className="w-4 h-4" />, onClick: () => navigateTo('/tags') },
    { label: '차 추가', icon: <Leaf className="w-5 h-5" />, onClick: () => navigateTo('/tea/new'), isPrimary: true },
  ];

  const writeGroup: MenuItem[] = [
    { label: '다회 작성', icon: <RefreshCw className="w-4 h-4" />, onClick: toggleSessionMode, isToggle: true, isActive: sessionMode.active, isNew: true },
    {
      label: '블라인드 작성',
      icon: blindMode.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />,
      onClick: toggleBlindMode,
      isToggle: true,
      isActive: blindMode.active,
      isNew: true,
    },
    { label: '차록 작성', icon: <PenLine className="w-5 h-5" />, onClick: () => navigateTo('/note/new'), isPrimary: true },
  ];

  const secondaryAddItems = addGroup.filter((item) => !item.isPrimary);
  const primaryAddItems = addGroup.filter((item) => item.isPrimary);
  const secondaryWriteItems = writeGroup.filter((item) => !item.isPrimary);
  const primaryWriteItems = writeGroup.filter((item) => item.isPrimary);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] transition-opacity duration-200 dark:bg-black/70"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn('fixed z-50 flex flex-col items-end md:bottom-6', LOGO_FAB_RIGHT_CLASS, !isOpen && 'pointer-events-none')}
        style={{ bottom: LOGO_FAB_ABOVE_NAV_BOTTOM }}
      >
        <div className={cn(isOpen ? PANEL_CLASS : HIDDEN_PANEL_CLASS)}>
          {menuItems.map((item, index) => {
            const delayMs = (menuItems.length + writeGroup.length - 1 - index) * 50;
            return (
              <div key={item.label} className={revealClass(isOpen, 'gap-3')} style={{ transitionDelay: isOpen ? `${delayMs}ms` : '0ms' }}>
                <span className="text-xs font-medium px-0 py-1 text-current/75 whitespace-nowrap">{item.label}</span>
                <button type="button" aria-label={item.label} onClick={item.onClick} className={ROUND_ACTION_CLASS}>
                  {item.icon}
                </button>
              </div>
            );
          })}

          <div className={revealClass(isOpen)} style={{ transitionDelay: isOpen ? '100ms' : '0ms' }}>
            {secondaryAddItems.map((item) => <ActionTile key={item.label} item={item} />)}
            {primaryAddItems.map((item) => <ActionTile key={item.label} item={item} className={PRIMARY_ACTION_CLASS} />)}
          </div>

          <div className={revealClass(isOpen)} style={{ transitionDelay: isOpen ? '50ms' : '0ms' }}>
            {secondaryWriteItems.map((item) => <ActionTile key={item.label} item={item} />)}
            {primaryWriteItems.map((item) => <ActionTile key={item.label} item={item} className={PRIMARY_ACTION_CLASS} />)}
          </div>
        </div>

        <button
          type="button"
          aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(FAB_CLASS, isOpen && 'scale-95')}
        >
          <span className="absolute inset-[5px] -z-10 rounded-full border border-transparent bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] dark:hidden" />
          <AddLogoIcon
            className={cn(
              LOGO_FAB_ICON_CLASS,
              'transition-transform duration-300 drop-shadow-[0_1px_6px_rgba(0,0,0,0.16)]',
              isOpen ? 'rotate-45' : 'rotate-0',
            )}
          />
        </button>
      </div>
    </>
  );
}
