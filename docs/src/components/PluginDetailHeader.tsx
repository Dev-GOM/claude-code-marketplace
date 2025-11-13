'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { CopyInstallButton } from '@/components/CopyInstallButton';
import { categoryEmojis, categoryColors, defaultCategoryColor } from '@/lib/constants/ui';
import type { PluginWithReadme } from '@/lib/types';

interface PluginDetailHeaderProps {
  readonly plugin: PluginWithReadme;
}

export function PluginDetailHeader({ plugin }: PluginDetailHeaderProps): React.ReactElement {
  const { language, t } = useLanguage();

  const categoryColor = categoryColors[plugin.category] ?? defaultCategoryColor;
  const emoji = categoryEmojis[plugin.category] ?? '📦';

  // 언어별 이름, 설명 선택
  const name = language === 'ko' && plugin.nameKo ? plugin.nameKo : plugin.name;
  const description = language === 'ko' && plugin.descriptionKo ? plugin.descriptionKo : plugin.description;

  return (
    <div className="mb-8 md:mb-12">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full mb-4 md:mb-6 transition-all duration-300 hover:scale-105 text-sm md:text-base"
      >
        <span>←</span>
        <span>{t('Back to Plugins', '플러그인 목록으로')}</span>
      </Link>

      {/* Plugin header */}
      <div className="relative">
        <div className={`absolute -inset-1 bg-gradient-to-r ${categoryColor.bg} rounded-2xl md:rounded-3xl opacity-30 blur`} />
        <div className="relative bg-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8 border border-white/20">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-6 mb-4 md:mb-6">
            <div className="flex-1 w-full">
              <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
                <span className="text-3xl md:text-5xl animate-float flex-shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 md:mb-2 break-words">
                    {name}
                  </h1>
                  <p className="text-white/70 text-sm md:text-base lg:text-lg break-words">{description}</p>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                <div
                  className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r ${categoryColor.bg} rounded-full text-white font-medium shadow-lg text-xs md:text-sm`}
                >
                  <span>{emoji}</span>
                  <span>{plugin.category}</span>
                </div>
                <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white/10 text-white rounded-full font-mono text-xs md:text-sm">
                  v{plugin.version}
                </div>
                <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white/10 text-white/70 rounded-full text-xs md:text-sm">
                  {t('by', '작성자:')} {plugin.author.name}
                </div>
              </div>

              {/* Keywords */}
              {plugin.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 md:gap-2 mt-3 md:mt-4">
                  {plugin.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-2 md:px-3 py-1 bg-white/5 text-white/60 text-xs md:text-sm rounded-full border border-white/10"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3">
            <CopyInstallButton pluginName={plugin.name} categoryBg={categoryColor.bg} />
            <a
              href={plugin.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 md:px-6 py-2.5 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all duration-300 hover:scale-105 border border-white/20 text-sm md:text-base text-center"
            >
              {t('View on GitHub', 'GitHub에서 보기')} →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
