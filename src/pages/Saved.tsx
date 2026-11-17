import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { SavedContent } from '../components/profile/SavedContent';

export function Saved() {
  useScrollRestoration();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" role="status" aria-label="로딩 중" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header showBack showProfile title="저장함" />
      <SavedContent key={user.id} showHeading />
      <BottomNav />
    </div>
  );
}
