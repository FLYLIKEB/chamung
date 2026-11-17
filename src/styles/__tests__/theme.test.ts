import { describe, expect, it } from 'vitest';
import postcss from 'postcss';
import globals from '../globals.css?raw';
import theme from '../pixel-theme.css?raw';

const styles = postcss.parse(`${globals}\n${theme}`);

describe('pixel theme behavior contracts', () => {
  it('keeps entrance content visible when reduced motion disables animation', () => {
    let visibleEntrance = false;
    styles.walkAtRules('media', (rule) => {
      if (!rule.params.includes('prefers-reduced-motion: reduce')) return;
      rule.walkRules((selector) => {
        if (!selector.selector.includes('.animate-fade-in-up')) return;
        selector.walkDecls('opacity', (decl) => { if (decl.value === '1') visibleEntrance = true; });
      });
    });
    expect(visibleEntrance).toBe(true);
  });

  it('does not wrap complete color tokens in hsl()', () => {
    expect(`${globals}\n${theme}`).not.toMatch(/hsl\(var\(--/);
  });

  it('keeps long note content scrollable and its photo source available', () => {
    const declarations = new Map<string, Map<string, string>>();
    styles.walkRules((rule) => {
      const values = declarations.get(rule.selector) ?? new Map<string, string>();
      rule.walkDecls((decl) => { values.set(decl.prop, decl.value); });
      declarations.set(rule.selector, values);
    });
    expect(declarations.get('.note-detail-card-deck')?.get('overflow-x')).toBe('auto');
    expect(declarations.get('.note-detail-card-deck > *')?.get('overflow-y')).toBe('auto');
    expect(`${globals}\n${theme}`).toContain('var(--note-card-photo)');
    expect(declarations.get('.note-detail-session-table-wrap')?.get('overflow-x')).toBe('auto');
  });
});
