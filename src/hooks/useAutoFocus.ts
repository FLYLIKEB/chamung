import { useEffect, useRef, type RefObject } from 'react';
import { hasKeyboardProxy, transferFocus } from './useMobileKeyboard';

/**
 * Mobile-compatible autofocus hook.
 *
 * If a keyboard proxy is active (created by `navigateWithKeyboard`),
 * transfers focus from the proxy to the real input — keeping the iOS
 * keyboard open.  Otherwise falls back to `requestAnimationFrame` +
 * `setTimeout` which works on Desktop and Android.
 *
 * @param enabled - Whether to auto-focus (e.g. `!preselectedTeaId`)
 * @param deps   - Extra deps that should re-trigger the focus (default `[]`)
 */
export function useAutoFocus<T extends HTMLElement = HTMLInputElement>(
  enabled: boolean = true,
  deps: unknown[] = [],
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    if (!enabled) return;

    // Path A: proxy input exists → transfer focus immediately (iOS keyboard stays open)
    if (hasKeyboardProxy() && ref.current) {
      transferFocus(ref.current);
      return;
    }

    // Path B: no proxy → Desktop/Android fallback
    let raf: number;
    let timer: ReturnType<typeof setTimeout>;

    raf = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        ref.current?.focus({ preventScroll: false });
      }, 50);
    });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [enabled, depsKey]);

  return ref;
}
