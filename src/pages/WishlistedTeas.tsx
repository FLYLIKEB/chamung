import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { TeaCard } from '../components/TeaCard';
import { EmptyState } from '../components/EmptyState';
import { teasApi } from '../lib/api';
import { Tea } from '../types';
import { logger } from '../lib/logger';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export function WishlistedTeas() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [teas, setTeas] = useState<Tea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }
    const fetch = async () => {
      try {
        setIsLoading(true);
        const data = await teasApi.getWishlisted();
        setTeas(Array.isArray(data) ? data : []);
      } catch (error) {
        logger.error('Failed to fetch wishlisted teas:', error);
        toast.error('찜한 차 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [isAuthenticated, user, authLoading, navigate]);

  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" role="status" aria-label="로딩 중" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header showBack title="찜한 차" />

      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" role="status" aria-label="로딩 중" />
          </div>
        ) : teas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teas.map((tea) => (
              <TeaCard key={tea.id} tea={tea} />
            ))}
          </div>
        ) : (
          <EmptyState
            type="search"
            message="아직 찜한 차가 없어요."
            action={{ label: '차 탐색하기', onClick: () => navigate('/sasaek') }}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
