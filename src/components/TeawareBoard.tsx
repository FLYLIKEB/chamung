import { useState } from 'react';
import type { TeawareItem } from '../types';
import { getTeawareImage, teawareKey } from '../constants/teaware';

export function TeawareBoard({ items }: { items?: TeawareItem[] | null }) {
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());
  if (!items?.length) return null;

  return (
    <section className="mt-5" aria-label="사용한 다구">
      <h3 className="mb-3 text-sm font-medium text-foreground">사용한 다구</h3>
      <div className="teaware-board" data-note-image="teaware">
        {items.map((item) => (
          <figure key={teawareKey(item)} className="teaware-board-item" data-teaware-kind={item.kind} data-teaware-image-url={item.imageUrl}>
            <img
              src={getTeawareImage(item)}
              alt=""
              className={item.imageUrl ? 'teaware-photo' : 'teaware-pixel'}
              width={128}
              height={128}
              onError={(event) => {
                const fallback = `/teaware/${item.kind}.svg`;
                if (event.currentTarget.getAttribute('src') !== fallback) {
                  event.currentTarget.src = fallback;
                  if (item.imageUrl) setFailedPhotos(current => new Set(current).add(item.imageUrl!));
                  event.currentTarget.className = 'teaware-pixel';
                }
              }}
            />
            <figcaption>{item.name}</figcaption>
            {item.imageUrl && failedPhotos.has(item.imageUrl) && <span className="mt-1 text-center text-[10px] text-muted-foreground">사진을 불러오지 못했어요</span>}
          </figure>
        ))}
      </div>
    </section>
  );
}
