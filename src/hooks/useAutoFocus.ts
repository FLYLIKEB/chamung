import { useEffect, useRef, type RefObject } from 'react';

/**
 * Mobile-compatible autofocus hook.
 *
 * On mobile browsers, programmatic `focus()` only opens the virtual keyboard
 * when called during a user-gesture or within the first animation frame after
 * navigation.  A short `requestAnimationFrame` + `setTimeout` combo gives the
 * browser enough time to finish layout while staying inside the "user
 * activation" window that iOS/Android require.
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

    // requestAnimationFrame ensures the DOM is painted, then a minimal
    // setTimeout pushes us past iOS's keyboard-suppression heuristic while
    // keeping the delay imperceptible (~16-50 ms total).
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
