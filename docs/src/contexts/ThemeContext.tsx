'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { THEMES, DEFAULT_THEME, type ThemeId, type Theme } from '@/lib/constants/themes';

interface ThemeContextType {
  readonly theme: Theme;
  readonly themeId: ThemeId;
  readonly setTheme: (themeId: ThemeId) => void;
  readonly mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
}: {
  readonly children: ReactNode;
}): React.ReactElement {
  // 항상 DEFAULT_THEME으로 시작 (서버/클라이언트 초기 렌더링 일치, hydration error 방지)
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME);
  const [mounted, setMounted] = useState<boolean>(false);

  // Hydration 완료 후에만 저장된 테마 설정 적용
  useEffect(() => {
    setMounted(true);

    // localStorage에서 저장된 테마 읽기
    const savedTheme = localStorage.getItem('theme') as ThemeId | null;
    if (savedTheme && THEMES[savedTheme]) {
      setThemeIdState(savedTheme);
    }
  }, []);

  // 테마 변경 시 CSS 변수 업데이트
  useEffect(() => {
    const theme = THEMES[themeId];
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [themeId]);

  const setTheme = useCallback((newThemeId: ThemeId): void => {
    setThemeIdState(newThemeId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newThemeId);
    }
  }, []);

  const value = useMemo(
    () => ({ theme: THEMES[themeId], themeId, setTheme, mounted }),
    [themeId, setTheme, mounted]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
