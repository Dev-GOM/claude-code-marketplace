'use client';

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
    <div className="mb-12">
      {/* Back button */}
      <a
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full mb-6 transition-all duration-300 hover:scale-105"
      >
        <span>←</span>
        <span>{t('Back to Plugins', '플러그인 목록으로')}</span>
      </a>

      {/* Plugin header */}
      <div className="relative">
        <div className={`absolute -inset-1 bg-gradient-to-r ${categoryColor.bg} rounded-3xl opacity-30 blur`} />
        <div className="relative bg-white/10 rounded-3xl p-8 border border-white/20">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl animate-float">{emoji}</span>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {name}
                  </h1>
                  <p className="text-white/70 text-lg">{description}</p>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${categoryColor.bg} rounded-full text-white font-medium shadow-lg`}
                >
                  <span>{emoji}</span>
                  <span>{plugin.category}</span>
                </div>
                <div className="px-4 py-2 bg-white/10 text-white rounded-full font-mono text-sm">
                  v{plugin.version}
                </div>
                <div className="px-4 py-2 bg-white/10 text-white/70 rounded-full text-sm">
                  {t('by', '작성자:')} {plugin.author.name}
                </div>
              </div>

              {/* Keywords */}
              {plugin.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {plugin.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-3 py-1 bg-white/5 text-white/60 text-sm rounded-full border border-white/10"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <CopyInstallButton pluginName={plugin.name} categoryBg={categoryColor.bg} />
            <a
              href={plugin.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all duration-300 hover:scale-105 border border-white/20"
            >
              {t('View on GitHub', 'GitHub에서 보기')} →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
