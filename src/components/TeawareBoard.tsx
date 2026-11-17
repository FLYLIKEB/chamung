import { useState, type CSSProperties } from 'react';
import type { TeawareItem } from '../types';
import { getTeawareImage, teawareKey } from '../constants/teaware';
import { arrangeTeaware } from '../lib/teawareLayout';

export function TeawareBoard({ items }: { items?: TeawareItem[] | null }) {
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());
  if (!items?.length) return null;

  return (
    <section className="mt-5" aria-label="사용한 다구">
      <h3 className="mb-3 text-sm font-medium text-foreground">사용한 다구</h3>
      <div className="teaware-board" data-note-image="teaware">
        {arrangeTeaware(items).map((row, rowIndex) => (
          <div className="teaware-board-row" key={rowIndex}>
            {row.items.map(placement => {
              const item = items[placement.index];
              const photoFailed = !!item.imageUrl && failedPhotos.has(item.imageUrl);
              const fallback = getTeawareImage({ kind: item.kind, name: item.name });
              return (
                <figure key={teawareKey(item)} className="teaware-board-item" data-teaware-kind={item.kind} data-teaware-variant={item.variantId} data-teaware-image-url={item.imageUrl}
                  style={{ '--tool-center': `${placement.center * 100}%`, '--tool-width': `${placement.width * 100}%`, '--tool-image-width': `${placement.imageWidth / placement.width * 100}%` } as CSSProperties}>
                  <img
                    src={photoFailed ? fallback : getTeawareImage(item)}
                    alt=""
                    className={item.imageUrl && !photoFailed ? 'teaware-photo' : 'teaware-pixel'}
                    width={128} height={128}
                    onError={event => {
                      if (event.currentTarget.getAttribute('src') !== fallback) {
                        event.currentTarget.src = fallback;
                        if (item.imageUrl) setFailedPhotos(current => new Set(current).add(item.imageUrl!));
                        event.currentTarget.className = 'teaware-pixel';
                      }
                    }}
                  />
                  <figcaption>{item.name}</figcaption>
                  {photoFailed && <span className="teaware-photo-error">사진을 불러오지 못했어요</span>}
                </figure>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
