import { useEffect, useState } from 'react';

/**
 * 스크롤 방향을 감지해 헤더/필터바 hide 여부를 반환합니다.
 * - 96px 이상 스크롤 후 36px 이상 아래로 → hidden
 * - 56px 이상 위로 스크롤 → visible
 * - 24px 미만 위치 → 항상 visible
 */
export function useScrollHide(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let prev = window.scrollY;
    let downDist = 0;
    let upDist = 0;
    let isHidden = false;
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const cur = window.scrollY;
        const delta = cur - prev;

        if (cur < 24) {
          isHidden = false; downDist = 0; upDist = 0;
        } else if (delta > 2) {
          downDist += delta; upDist = 0;
          if (cur > 96 && downDist > 36) { isHidden = true; downDist = 0; }
        } else if (delta < -2) {
          upDist += Math.abs(delta); downDist = 0;
          if (upDist > 56) { isHidden = false; upDist = 0; }
        }

        prev = cur;
        setHidden(isHidden);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return hidden;
}
