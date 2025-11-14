'use client';

import { useMemo, useState, useEffect } from 'react';
import { SITE_CONFIG } from '@/lib/constants';
import { getAllPlugins } from '@/lib/data/plugins';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer(): React.ReactElement {
  const pluginCount = useMemo(() => getAllPlugins().length, []);
  const { t } = useLanguage();
  const [dailyVisitors, setDailyVisitors] = useState<number>(0);
  const [weeklyVisitors, setWeeklyVisitors] = useState<number>(0);
  const [monthlyVisitors, setMonthlyVisitors] = useState<number>(0);
  const [totalVisitors, setTotalVisitors] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const today = new Date().toISOString().split('T')[0] || '';
    const thisMonth = today.substring(0, 7) || '';

    const STORAGE_KEYS = {
      DAILY: `visitor_daily_${today}`,
      MONTHLY: `visitor_monthly_${thisMonth}`,
      TOTAL: 'visitor_total',
      LAST_VISIT: 'visitor_last_visit',
    };

    const lastVisit = localStorage.getItem(STORAGE_KEYS.LAST_VISIT);
    const now = Date.now();
    const isNewVisit = !lastVisit || now - parseInt(lastVisit) > 30 * 60 * 1000;

    if (isNewVisit) {
      const dailyCount = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY) || '0');
      localStorage.setItem(STORAGE_KEYS.DAILY, (dailyCount + 1).toString());

      const monthlyCount = parseInt(localStorage.getItem(STORAGE_KEYS.MONTHLY) || '0');
      localStorage.setItem(STORAGE_KEYS.MONTHLY, (monthlyCount + 1).toString());

      const totalCount = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL) || '0');
      localStorage.setItem(STORAGE_KEYS.TOTAL, (totalCount + 1).toString());

      localStorage.setItem(STORAGE_KEYS.LAST_VISIT, now.toString());
    }

    // Get all visitor counts
    const daily = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY) || '0');
    const monthly = parseInt(localStorage.getItem(STORAGE_KEYS.MONTHLY) || '0');
    const total = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL) || '0');

    // Calculate weekly visitors (last 7 days)
    let weekly = 0;
    const todayDate = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] || '';
      const count = parseInt(localStorage.getItem(`visitor_daily_${dateStr}`) || '0');
      weekly += count;
    }

    setDailyVisitors(daily);
    setWeeklyVisitors(weekly);
    setMonthlyVisitors(monthly);
    setTotalVisitors(total);
  }, []);

  return (
    <footer className="relative z-10 border-t border-white/10 backdrop-blur-md bg-white/5 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div className="md:text-left">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              {SITE_CONFIG.TITLE}
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              {SITE_CONFIG.DESCRIPTION}
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:text-center">
            <h3 className="text-lg font-bold text-white mb-4">{t('Quick Links', '빠른 링크')}</h3>
            <ul className="space-y-2 md:inline-block md:text-left">
              <li>
                <a
                  href="#plugins"
                  className="text-white/60 hover:text-white transition-colors duration-300 text-sm"
                >
                  {t('Browse Plugins', '플러그인 둘러보기')}
                </a>
              </li>
              <li>
                <a
                  href={SITE_CONFIG.GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors duration-300 text-sm"
                >
                  {t('GitHub Repository', 'GitHub 저장소')}
                </a>
              </li>
              <li>
                <a
                  href={`${SITE_CONFIG.GITHUB_URL}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors duration-300 text-sm"
                >
                  {t('Report Issues', '이슈 제보')}
                </a>
              </li>
            </ul>
          </div>

          {/* Stats */}
          <div className="md:text-right">
            <h3 className="text-lg font-bold text-white mb-4">{t('Stats', '통계')}</h3>
            <div className="space-y-3 md:inline-block md:text-left">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <div className="text-white font-bold">
                    {pluginCount} {t(pluginCount === 1 ? 'Plugin' : 'Plugins', '플러그인')}
                  </div>
                  <div className="text-white/60 text-sm">{t('Ready to use', '사용 가능')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="text-white font-bold">v{SITE_CONFIG.VERSION}</div>
                  <div className="text-white/60 text-sm">{t('Latest version', '최신 버전')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} {SITE_CONFIG.AUTHOR}. Built with 💜 for developers.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {totalVisitors > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-white/60 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>📅</span>
                    <span>{t('Today', '오늘')}</span>
                    <span className="font-semibold text-white">{dailyVisitors.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>📊</span>
                    <span>{t('Week', '주간')}</span>
                    <span className="font-semibold text-white">{weeklyVisitors.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>📈</span>
                    <span>{t('Month', '월간')}</span>
                    <span className="font-semibold text-white">{monthlyVisitors.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>👥</span>
                    <span>{t('Total', '총')}</span>
                    <span className="font-semibold text-white">{totalVisitors.toLocaleString()}</span>
                  </div>
                </div>
              )}
              <a
                href={SITE_CONFIG.GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors duration-300 hover:scale-110 transform"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
