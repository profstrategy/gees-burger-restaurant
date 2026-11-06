'use client';

import { useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { ThemeContext, type Theme } from '@/hooks/useTheme';

const STORAGE_KEY = 'gees.theme';
const themeListeners = new Set<() => void>();

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

export function readStoredTheme(): Theme {
  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(storedTheme) ? storedTheme : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.add('theme-changing');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const themeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  if (themeColor) {
    themeColor.content = getComputedStyle(root).getPropertyValue('--bg').trim();
  }

  window.requestAnimationFrame(() => {
    root.classList.remove('theme-changing');
  });
}

function getThemeSnapshot(): Theme {
  const theme = document.documentElement.dataset.theme;
  return isTheme(theme) ? theme : readStoredTheme();
}

function getServerThemeSnapshot(): Theme {
  return 'dark';
}

function subscribeToTheme(listener: () => void): () => void {
  themeListeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    applyTheme(isTheme(event.newValue) ? event.newValue : 'dark');
    themeListeners.forEach((notify) => notify());
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    themeListeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  const setTheme = (nextTheme: Theme) => {
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // The document-backed theme remains usable when storage is unavailable.
    }
    themeListeners.forEach((listener) => listener());
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
