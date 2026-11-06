import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeContext } from '@/hooks/useTheme';

function renderToggle(theme: 'dark' | 'light') {
  return renderToStaticMarkup(
    createElement(
      ThemeContext.Provider,
      {
        value: {
          theme,
          setTheme: vi.fn(),
          toggleTheme: vi.fn(),
        },
      },
      createElement(ThemeToggle)
    )
  );
}

describe('ThemeToggle', () => {
  it('renders a named switch whose checked state follows the theme', () => {
    const darkMarkup = renderToggle('dark');
    const lightMarkup = renderToggle('light');

    expect(darkMarkup).toContain('role="switch"');
    expect(darkMarkup).toContain('aria-label="Dark mode"');
    expect(darkMarkup).toContain('aria-checked="true"');
    expect(lightMarkup).toContain('aria-checked="false"');
  });
});
