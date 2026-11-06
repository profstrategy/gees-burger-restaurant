'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-label="Dark mode"
      aria-checked={isDark}
      onClick={toggleTheme}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-surface text-accent-text transition-colors hover:border-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    >
      <Moon aria-hidden="true" className="theme-icon-dark h-5 w-5" />
      <Sun aria-hidden="true" className="theme-icon-light h-5 w-5" />
    </button>
  );
}
