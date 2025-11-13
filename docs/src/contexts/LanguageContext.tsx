'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

type Language = 'en' | 'ko';

interface LanguageContextType {
  readonly language: Language;
  readonly setLanguage: (lang: Language) => void;
  readonly t: (en: string, ko: string) => string;
  readonly mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
}: {
  readonly children: ReactNode;
}): React.ReactElement {
  // 항상 'en'으로 시작 (서버/클라이언트 초기 렌더링 일치, hydration error 방지)
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState<boolean>(false);

  // Hydration 완료 후에만 저장된 언어 설정 적용
  useEffect(() => {
    setMounted(true);

    // localStorage에서 저장된 언어 읽기
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang) {
      setLanguageState(savedLang);
      return;
    }

    // 브라우저 언어 감지
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ko')) {
      setLanguageState('ko');
    }
  }, []);

  const setLanguage = useCallback((lang: Language): void => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  }, []);

  const t = useCallback(
    (en: string, ko: string): string => {
      return language === 'ko' ? ko : en;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, mounted }),
    [language, setLanguage, t, mounted]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
