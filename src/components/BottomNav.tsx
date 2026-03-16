import { HTMLAttributes } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, Package } from 'lucide-react';
import { cn } from './ui/utils';
import { useAuth } from '../contexts/AuthContext';

type BottomNavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeStyle?: 'fill' | 'bold';
  isActive?: (pathname: string) => boolean;
};

const NAV_ITEMS: BottomNavItem[] = [
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

type BottomNavProps = HTMLAttributes<HTMLElement>;

export function BottomNav({ className, ...rest }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const isProfileActive = location.pathname === '/my-notes' || location.pathname.startsWith('/user/');

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-60 bg-card/95 backdrop-blur-md border-t border-black/5 rounded-t-2xl card-shadow-top px-2 py-3',
        'pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
        'flex items-center justify-around',
        'md:hidden',
        className,
      )}
      {...rest}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.isActive
          ? item.isActive(location.pathname)
          : location.pathname === item.path;
        const Icon = item.icon;
        const isBoldActive = isActive && item.activeStyle === 'bold';
        const isFillActive = isActive && item.activeStyle === 'fill';
        const strokeWidth = isBoldActive ? 2.75 : 2;
        const fill = isFillActive ? 'currentColor' : 'none';
        return (
          <button
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className={cn(
              'min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}
            aria-label={item.label}
          >
            <div
              className={cn(
                'w-6 h-6 flex items-center justify-center',
                isActive && 'rounded-full',
              )}
            >
              <Icon
                className={cn('w-5 h-5 transition-all duration-200', isActive && 'text-primary')}
                fill={fill}
                stroke="currentColor"
                strokeWidth={strokeWidth}
              />
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}

      {/* Profile tab (rightmost) */}
      <button
        onClick={() => handleNavigate('/my-notes')}
        className={cn(
          'min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95',
          isProfileActive ? 'text-primary' : 'text-muted-foreground',
        )}
        aria-label="내 차록"
      >
        <div className={cn(
          'w-6 h-6 rounded-full overflow-hidden',
          isProfileActive && 'ring-2 ring-primary',
        )}>
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={user.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-primary">
                {(user?.name?.charAt(0) || '?').toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <span className="text-xs font-medium">내 차록</span>
      </button>
    </nav>
  );
}
