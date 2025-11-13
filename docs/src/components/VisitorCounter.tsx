'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VisitorStats {
  daily: number;
  monthly: number;
  total: number;
}

export function VisitorCounter(): React.ReactElement | null {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window === 'undefined') return;

    const today = new Date().toISOString().split('T')[0] || ''; // YYYY-MM-DD
    const thisMonth = today.substring(0, 7) || ''; // YYYY-MM

    const STORAGE_KEYS = {
      DAILY: `visitor_daily_${today}`,
      MONTHLY: `visitor_monthly_${thisMonth}`,
      TOTAL: 'visitor_total',
      LAST_VISIT: 'visitor_last_visit',
    };

    // 마지막 방문 시간 확인
    const lastVisit = localStorage.getItem(STORAGE_KEYS.LAST_VISIT);
    const now = Date.now();
    const isNewVisit = !lastVisit || now - parseInt(lastVisit) > 30 * 60 * 1000; // 30분

    if (isNewVisit) {
      // 일일 방문자 증가
      const dailyCount = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY) || '0');
      localStorage.setItem(STORAGE_KEYS.DAILY, (dailyCount + 1).toString());

      // 월간 방문자 증가
      const monthlyCount = parseInt(localStorage.getItem(STORAGE_KEYS.MONTHLY) || '0');
      localStorage.setItem(STORAGE_KEYS.MONTHLY, (monthlyCount + 1).toString());

      // 총 방문자 증가
      const totalCount = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL) || '0');
      localStorage.setItem(STORAGE_KEYS.TOTAL, (totalCount + 1).toString());

      // 마지막 방문 시간 업데이트
      localStorage.setItem(STORAGE_KEYS.LAST_VISIT, now.toString());
    }

    // 통계 읽기
    const daily = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY) || '0');
    const monthly = parseInt(localStorage.getItem(STORAGE_KEYS.MONTHLY) || '0');
    const total = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL) || '0');

    setStats({ daily, monthly, total });
  }, []);

  // 클라이언트에서 로드될 때까지 null 반환
  if (!stats) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">👥</span>
        {t('Visitors', '방문자')}
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <div className="text-white font-bold">
              {stats.daily.toLocaleString()}
            </div>
            <div className="text-white/60 text-sm">{t('Today', '오늘')}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <div className="text-white font-bold">
              {stats.monthly.toLocaleString()}
            </div>
            <div className="text-white/60 text-sm">{t('This Month', '이번 달')}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <div>
            <div className="text-white font-bold">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-white/60 text-sm">{t('Total', '전체')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
