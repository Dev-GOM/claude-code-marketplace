'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { SITE_CONFIG } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { THEMES } from '@/lib/constants/themes';

export function Header(): React.ReactElement {
  const { language, setLanguage, t } = useLanguage();
  const { themeId, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    if (!showThemeMenu) return;

    function handleClickOutside(event: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    }

    // Escape 키 감지
    function handleEscapeKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setShowThemeMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showThemeMenu]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md bg-white/5">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 group">
            <div className="text-3xl animate-float">🎨</div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold text-white leading-tight mb-0.5">
                <span className="gradient-text">{SITE_CONFIG.TITLE}</span>
              </h1>
              <p className="text-sm text-white/70 leading-tight">
                {t(SITE_CONFIG.DESCRIPTION, 'Claude Code 플러그인 마켓플레이스')}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-3">
            {/* Theme Selector */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="group relative px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all duration-300 hover:scale-105 border border-white/20 flex items-center gap-2 h-10"
                style={{ color: 'var(--color-textPrimary)' }}
                aria-label={t('Select theme', '테마 선택')}
                aria-expanded={showThemeMenu}
                aria-haspopup="true"
                title={t('Select theme', '테마 선택')}
              >
                <span className="text-base" aria-hidden="true">
                  🎨
                </span>
                <span className="text-sm font-medium">
                  {t('Theme', '테마')}
                </span>
              </button>

              {/* Theme Dropdown */}
              {showThemeMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border overflow-hidden z-[100] shadow-2xl"
                  style={{
                    background: 'rgba(10, 10, 10, 0.98)',
                    borderColor: 'var(--color-cardBorder)',
                    backdropFilter: 'blur(40px)',
                  }}
                >
                  {Object.values(THEMES).map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setTheme(theme.id);
                        setShowThemeMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left transition-all duration-200 flex items-center justify-between"
                      style={{
                        background: themeId === theme.id ? 'var(--color-accent1)' : 'transparent',
                        color: themeId === theme.id ? 'var(--color-buttonText)' : 'var(--color-textPrimary)',
                      }}
                    >
                      <span>{language === 'ko' ? theme.nameKo : theme.name}</span>
                      {themeId === theme.id && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
              className="group relative px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all duration-300 hover:scale-105 border border-white/20 flex items-center gap-2 h-10"
              style={{ color: 'var(--color-textPrimary)' }}
              aria-label={language === 'en' ? 'Switch to Korean' : 'Switch to English'}
              title={t('Switch language', '언어 전환')}
            >
              <span className="text-base" aria-hidden="true">
                🌐
              </span>
              <span className="text-sm font-medium">
                {language === 'en' ? 'KR' : 'EN'}
              </span>
            </button>

            <Link
              href="/#plugins"
              className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg border border-white/20 h-10 flex items-center"
              style={{ color: 'var(--color-textPrimary)' }}
            >
              <span className="text-sm">{t('Plugins', '플러그인')}</span>
            </Link>
            <a
              href={SITE_CONFIG.GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl h-10 flex items-center gap-1"
              style={{
                background: 'var(--color-buttonBg)',
                color: 'var(--color-buttonText)',
              }}
            >
              <span className="text-sm">{t('View on GitHub', 'GitHub에서 보기')}</span>
              <span>⭐</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
