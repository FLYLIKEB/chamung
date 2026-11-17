// Standalone visual QA; component samples are local, mobile iframe uses the ordinary app. No data writes.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { HeroSection } from './components/HeroSection';
import { RatingVisualization } from './components/RatingVisualization';
import { Button } from './components/ui/button';
import { BrandMark } from './components/BrandMark';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import './index.css';
function Preview() {
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  const axes = ['두터움', '밀도', '섬세함', '매끄러움', '순정함', '맑음', '향의 길이', '다채로움', '향탕일체', '개인점수'];
  return <div className={dark ? 'dark min-h-screen bg-background' : 'min-h-screen bg-background'}>
    <main className="mx-auto max-w-3xl space-y-6 p-5 sm:p-10">
      <header className="flex items-center justify-between"><div className="flex items-center gap-2"><BrandMark className="h-10 w-10" /><span>차멍 · 茶 기록</span></div><Button onClick={() => setDark(!dark)}>밝기 전환</Button></header>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setMobile(!mobile)}>{mobile ? '컴포넌트 보기' : '390px 앱 보기'}</Button>
        <Dialog><DialogTrigger asChild><Button variant="secondary">대화상자 확인</Button></DialogTrigger><DialogContent><DialogTitle>제목 글꼴 확인</DialogTitle><DialogDescription>본문은 Galmuri11, 제목은 둥근모로 표시합니다.</DialogDescription><Input aria-label="대화상자 입력" placeholder="입력 확인" /></DialogContent></Dialog>
      </div>
      {mobile ? <iframe title="390px 모바일 앱" src="/" className="mx-auto block h-[760px] w-[390px] max-w-full border border-border" /> : <HeroSection />}
      <section className="card-appearance bg-card p-6 sm:p-9"><div className="flex items-center justify-between"><h2 className="text-2xl">차 도감</h2><span className="text-muted-foreground">미리보기</span></div><p className="my-5 text-muted-foreground">차 한 잔에 담긴 향과 감각을 기록합니다.</p><hr className="my-6"/><h3 className="mb-3 text-xl underline underline-offset-8">오동단총 신 행인향</h3><p className="mb-6 text-sm text-muted-foreground">청차 / 우롱차 · 일운차당 · 2024</p><RatingVisualization axisValues={axes.map((nameKo,i) => ({axisId:i,valueNumeric:[3.5,3.5,4,4,5,4.5,4,3.5,5,5][i],axis:{id:i,nameKo,nameEn:'',maxValue:5,displayOrder:i}}))}/><div className="mt-6 flex flex-wrap gap-2">{['과일향','단맛','부드러움','감칠맛'].map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}</div></section>
      <section className="card-appearance bg-card p-6"><label htmlFor="preview-search" className="mb-3 block">차 찾아보기</label><Input id="preview-search" placeholder="차 이름, 향미로 검색"/><p className="mt-4 text-xs text-muted-foreground">실제 공통 컴포넌트로 구성한 디자인 미리보기입니다.</p></section>
    </main></div>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
