import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, MessageSquare, FileText, Package, Bell, Settings } from 'lucide-react';
import { cn } from './ui/utils';
import { useAuth } from '../contexts/AuthContext';

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { path: '/', label: '홈', icon: Home },
  { path: '/sasaek', label: '탐색', icon: Search },
  { path: '/chadam', label: '차담', icon: MessageSquare },
  { path: '/cellar', label: '찻장', icon: Package },
];

const bottomItems: NavItem[] = [
  { path: '/notifications', label: '알림', icon: Bell },
  { path: '/settings', label: '설정', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const isProfileActive = location.pathname === '/my-notes' || location.pathname.startsWith('/user/');

  return (
    <aside className="hidden md:flex flex-col items-center shrink-0 w-16 bg-background border-r border-border/30 py-4">
      {/* Logo */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-6 hover:bg-primary/20 transition-colors"
        aria-label="홈으로"
      >
        <img src="/logo.png" alt="차멍" className="w-6 h-6 object-contain" />
      </button>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            title={label}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150',
              isActive(path)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            <Icon className="w-5 h-5" />
          </Link>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col items-center gap-1 pt-2 border-t border-border/20">
        {bottomItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            title={label}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150',
              isActive(path)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            <Icon className="w-5 h-5" />
          </Link>
        ))}

        {/* Profile */}
        <button
          type="button"
          onClick={() => navigate('/my-notes')}
          title="내 차록"
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 mt-1',
            isProfileActive
              ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
              : 'hover:bg-muted/50',
          )}
        >
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {(user?.name?.charAt(0) || '?').toUpperCase()}
              </span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
