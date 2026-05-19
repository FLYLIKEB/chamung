import type { NavigateFunction } from 'react-router-dom';
import { prepareKeyboard } from '../hooks/useMobileKeyboard';

/**
 * Navigate to a path while keeping the mobile keyboard ready.
 *
 * Call this **synchronously inside a click/tap handler** so that
 * `prepareKeyboard()` runs within the user-gesture context and
 * iOS Safari opens the virtual keyboard.
 *
 * The destination page should use `useAutoFocus` which will detect
 * the proxy input and transfer focus (keeping the keyboard open).
 */
export function navigateWithKeyboard(
  navigate: NavigateFunction,
  path: string,
): void {
  prepareKeyboard();
  navigate(path);
}
