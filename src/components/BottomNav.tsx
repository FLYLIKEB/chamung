import type { ComponentType, HTMLAttributes, SVGProps } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, Package } from 'lucide-react';
import { cn } from './ui/utils';
import { useAuth } from '../contexts/AuthContext';
import { ChaLogLogo } from './ChaLogLogo';

type NavItemDef = {
  label: string;
  path: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  activeStyle?: 'fill' | 'bold';
  isActive?: (pathname: string) => boolean;
};

type NavDirection = 'horizontal' | 'vertical';

const NAV_ITEMS: NavItemDef[] = [
  { label: '홈', path: '/', icon: Home, activeStyle: 'fill' },
  {
    label: '차담',
    path: '/chadam',
    icon: MessageSquare,
    activeStyle: 'bold',
    isActive: (pathname) => pathname === '/chadam' || pathname.startsWith('/chadam/'),
  },
  {
    label: '찻장',
    path: '/cellar',
    icon: Package,
    activeStyle: 'bold',
    isActive: (pathname) => pathname === '/cellar' || pathname.startsWith('/cellar/'),
  },
];

const MOBILE_BOTTOM_NAV_CLASS = cn(
  'app-bottom-nav app-bottom-nav-mobile fixed left-6 right-6 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-60 px-1.5 py-1',
  'flex items-center justify-around md:hidden',
);

function navItemClass(direction: NavDirection, isActive: boolean) {
  return cn(
    'flex items-center justify-center gap-1 transition-colors duration-200',
    direction === 'horizontal'
      ? 'min-h-11 min-w-11 flex-1 flex-col px-2'
      : 'min-h-11 w-full px-3 py-2 flex-row gap-3',
    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
  );
}

function NavButton({
  item,
  pathname,
  onClick,
  direction,
}: {
  item: NavItemDef;
  pathname: string;
  onClick: () => void;
  direction: NavDirection;
}) {
  const isActive = item.isActive ? item.isActive(pathname) : pathname === item.path;
  const Icon = item.icon;
  const isBoldActive = isActive && item.activeStyle === 'bold';
  const isFillActive = isActive && item.activeStyle === 'fill';
  const strokeWidth = isBoldActive ? 2.75 : 2;
  const fill = isFillActive ? 'currentColor' : 'none';

  return (
    <button
      onClick={onClick}
      className={navItemClass(direction, isActive)}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        <Icon
          className={cn('w-5 h-5 transition-all duration-200', isActive && 'text-primary')}
          fill={fill}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      </div>
      <span className={cn(
        'font-medium',
        direction === 'horizontal' ? 'text-xs' : 'text-sm',
      )}>
        {item.label}
      </span>
    </button>
  );
}

function ProfileButton({
  pathname,
  onClick,
  direction,
}: {
  pathname: string;
  onClick: () => void;
  direction: NavDirection;
}) {
  const { user } = useAuth();
  const isActive = pathname === '/my-notes' || pathname.startsWith('/user/');

  return (
    <button
      onClick={onClick}
      className={navItemClass(direction, isActive)}
      aria-label="내 차록"
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="w-6 h-6 rounded-full overflow-hidden">
        {user?.profileImageUrl ? (
          <img src={user.profileImageUrl} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-primary">
              {(user?.name?.charAt(0) || '?').toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <span className={cn(
        'font-medium',
        direction === 'horizontal' ? 'text-xs' : 'text-sm',
      )}>
        내 차록
      </span>
    </button>
  );
}

type BottomNavProps = HTMLAttributes<HTMLElement>;

export function BottomNav({ className, ...rest }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  return (
    <>
      {/* Mobile: horizontal bottom bar */}
      <nav
        className={cn(MOBILE_BOTTOM_NAV_CLASS, className)}
        {...rest}
      >
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            pathname={location.pathname}
            onClick={() => handleNavigate(item.path)}
            direction="horizontal"
          />
        ))}
        <ProfileButton
          pathname={location.pathname}
          onClick={() => handleNavigate('/my-notes')}
          direction="horizontal"
        />
      </nav>

      {/* Desktop: vertical floating bar */}
      <nav
        className={cn(
          'app-bottom-nav app-side-nav hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-50',
          'flex-col items-center gap-1 p-2',
          'bg-background border-0 rounded-none shadow-none',
          'w-[140px]',
        )}
      >
        {/* Logo */}
        <ChaLogLogo
          asButton
          onClick={() => handleNavigate('/')}
          className="scale-[0.6] origin-left -my-2 w-full"
        />

        <div className="w-full h-px bg-transparent mb-1" />

        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            pathname={location.pathname}
            onClick={() => handleNavigate(item.path)}
            direction="vertical"
          />
        ))}
        <ProfileButton
          pathname={location.pathname}
          onClick={() => handleNavigate('/my-notes')}
          direction="vertical"
        />
      </nav>
    </>
  );
}
