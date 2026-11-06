import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, applyTheme, readStoredTheme } from '../ThemeProvider';
import { useTheme } from '@/hooks/useTheme';

function ThemeLabel() {
  const { theme } = useTheme();
  return createElement('span', null, theme);
}

describe('ThemeProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to dark before browser effects run', () => {
    const markup = renderToStaticMarkup(
      createElement(ThemeProvider, null, createElement(ThemeLabel))
    );
    expect(markup).toContain('>dark</span>');
  });

  it('reads a stored theme choice', () => {
    vi.stubGlobal('window', {
      localStorage: { getItem: vi.fn(() => 'light') },
    });
    expect(readStoredTheme()).toBe('light');
  });

  it('falls back to dark when storage throws', () => {
    const unavailableWindow = Object.defineProperty({}, 'localStorage', {
      get() {
        throw new Error('Storage unavailable');
      },
    });
    vi.stubGlobal('window', unavailableWindow);
    expect(readStoredTheme()).toBe('dark');
  });

  it('sets the document theme and color scheme', () => {
    const root = {
      classList: { add: vi.fn(), remove: vi.fn() },
      dataset: {},
      style: {},
    };
    vi.stubGlobal('document', {
      documentElement: root,
      querySelector: () => ({ content: '' }),
    });
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: () => '',
    }));
    vi.stubGlobal('window', {
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      },
    });

    applyTheme('light');

    expect(root.dataset).toEqual({ theme: 'light' });
    expect(root.style).toEqual({ colorScheme: 'light' });
  });
});
