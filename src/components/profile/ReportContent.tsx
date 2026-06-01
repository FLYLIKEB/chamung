import { useNavigate } from 'react-router-dom';
import { BarChart2, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserRecapData } from '@/hooks/useUserRecapData';

interface ReportContentProps {
  userId?: number;
  profileName?: string;
  isOwnProfile?: boolean;
}

export function ReportContent({ userId, profileName = '차 애호가', isOwnProfile = true }: ReportContentProps) {
  const navigate = useNavigate();
  const { isLoading, notes, summary } = useUserRecapData(userId ?? null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-2xl">🍵</div>
        <p className="mt-4 text-base font-semibold text-foreground">아직 리캡을 만들 차록이 없어요</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isOwnProfile ? '차록을 작성하면 카드형 리캡을 볼 수 있어요.' : '공개 차록이 생기면 리캡을 볼 수 있어요.'}
        </p>
        {isOwnProfile && (
          <Button onClick={() => navigate('/note/new')} className="mt-4">
            첫 차록 쓰기
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(`/user/${userId}/recap`)}
        className="group w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#121a13] via-[#2f472b] to-[#d7e2b6] p-1 text-left shadow-lg shadow-primary/10"
        aria-label={`${profileName}님의 차록 리캡 열기`}
      >
        <div className="rounded-[1.3rem] border border-white/15 bg-black/10 p-5 text-white backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/14 px-3 py-1 text-xs font-semibold text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              YouTube Recap 스타일
            </div>
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </div>

          <div className="mt-14 space-y-3">
            <p className="text-sm font-medium text-white/70">{summary.periodLabel}</p>
            <h2 className="text-3xl font-black leading-tight tracking-tight">
              {profileName}님의<br />차록 리캡
            </h2>
            <p className="max-w-xs text-sm leading-6 text-white/78">프로필 안의 차트 대신, 한 장씩 넘기는 별도 리캡 페이지로 감상해요.</p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-2">
            <MiniStat label="차록" value={`${summary.totalCount}`} />
            <MiniStat label="차종" value={summary.topTeaType ?? '—'} />
            <MiniStat label="향미" value={summary.topTag ? `#${summary.topTag}` : '—'} />
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-white">
            <BarChart2 className="h-4 w-4" />
            리캡 보러가기
          </div>
        </div>
      </button>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/14 px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] font-medium text-white/60">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}
