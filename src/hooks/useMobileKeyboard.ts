const PROXY_ATTR = 'data-keyboard-proxy';
const PROXY_TTL = 3000;

/**
 * Create an invisible proxy input and focus it synchronously.
 * MUST be called inside a user-gesture (click/tap) handler so that
 * iOS Safari opens the virtual keyboard.
 *
 * Returns a cleanup function that removes the proxy from the DOM.
 */
export function prepareKeyboard(): () => void {
  // Remove any stale proxy
  document.querySelector(`[${PROXY_ATTR}]`)?.remove();

  const proxy = document.createElement('input');
  proxy.setAttribute('type', 'text');
  proxy.setAttribute('aria-hidden', 'true');
  proxy.setAttribute('readonly', 'true');
  proxy.setAttribute('tabindex', '-1');
  proxy.setAttribute(PROXY_ATTR, 'true');
  proxy.style.cssText =
    'position:fixed;top:0;left:0;opacity:0;height:0;width:0;border:none;padding:0;font-size:16px;pointer-events:none;';

  document.body.prepend(proxy);
  proxy.focus();

  // Safety net: auto-remove after TTL
  const timer = setTimeout(() => proxy.remove(), PROXY_TTL);

  return () => {
    clearTimeout(timer);
    proxy.remove();
  };
}

/**
 * Transfer focus from the proxy input to the real target.
 * Because focus moves input→input, iOS keeps the keyboard open.
 */
export function transferFocus(target: HTMLElement): void {
  const proxy = document.querySelector(`[${PROXY_ATTR}]`);
  target.focus();
  proxy?.remove();
}

/**
 * Check whether a keyboard proxy is currently active in the DOM.
 */
export function hasKeyboardProxy(): boolean {
  return document.querySelector(`[${PROXY_ATTR}]`) !== null;
}
