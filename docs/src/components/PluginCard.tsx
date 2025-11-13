'use client';

import { useState } from 'react';
import type { PluginWithReadme } from '@/lib/types';
import { categoryEmojis, categoryColors, defaultCategoryColor } from '@/lib/constants/ui';
import { useLanguage } from '@/contexts/LanguageContext';

interface PluginCardProps {
  readonly plugin: PluginWithReadme;
  readonly index: number;
}

export function PluginCard({ plugin, index }: PluginCardProps): React.ReactElement {
  const [copied, setCopied] = useState<boolean>(false);
  const { language } = useLanguage();
  const categoryColor = categoryColors[plugin.category] ?? defaultCategoryColor;
  const emoji = categoryEmojis[plugin.category] ?? '📦';

  // 언어별 이름 및 설명 선택
  const name = language === 'ko' && plugin.nameKo
    ? plugin.nameKo
    : plugin.name;
  const description = language === 'ko' && plugin.descriptionKo
    ? plugin.descriptionKo
    : plugin.description;

  const handleCopyInstall = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(
        `/plugin install ${plugin.name}@dev-gom-plugins`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      // Clipboard API 실패 - 모던 브라우저에서는 거의 발생하지 않음
      console.error('Failed to copy to clipboard');
    }
  };

  return (
    <div
      className="group relative animate-bounce-in"
      style={{
        animationDelay: `${index * 0.05}s`,
        animationFillMode: 'backwards',
      }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-75 blur transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${categoryColor.bg})`,
          boxShadow: `0 0 30px var(--color-glow)`,
        }}
      />

      {/* Card content */}
      <div
        className="relative backdrop-blur-md rounded-2xl p-6 border transition-all duration-300 hover:transform hover:scale-[1.02]"
        style={{
          background: 'var(--color-cardBg)',
          borderColor: 'var(--color-cardBorder)',
        }}
      >
        {/* Category badge with emoji */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${categoryColor.bg} rounded-full text-white text-sm font-medium shadow-lg`}
          >
            <span className="text-lg group-hover:animate-wiggle">{emoji}</span>
            <span>{plugin.category}</span>
          </div>
          <div className="text-white/60 text-sm font-mono">v{plugin.version}</div>
        </div>

        {/* Plugin name with gradient */}
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-2xl font-bold text-white group-hover:gradient-text transition-all">
            {name}
          </h3>
          {plugin.keywords.includes('skills') && (
            <span className="px-2 py-1 text-xs rounded-full border bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-400/50 font-semibold whitespace-nowrap">
              ⚡ skills
            </span>
          )}
        </div>

        {/* Description - 모든 텍스트 표시 */}
        <p
          className="leading-relaxed mb-4 text-sm"
          style={{ color: 'var(--color-textSecondary)' }}
        >
          {description}
        </p>

        {/* Keywords */}
        {plugin.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {plugin.keywords
              .filter((keyword) => keyword.toLowerCase() !== 'skills')
              .slice(0, 3)
              .map((keyword) => (
                <span
                  key={keyword}
                  className="px-2 py-1 bg-white/5 text-white/60 text-xs rounded-full border border-white/10"
                >
                  {keyword}
                </span>
              ))}
            {plugin.keywords.filter((k) => k.toLowerCase() !== 'skills').length > 3 && (
              <span className="px-2 py-1 bg-white/5 text-white/60 text-xs rounded-full border border-white/10">
                +{plugin.keywords.filter((k) => k.toLowerCase() !== 'skills').length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <a
            href={`/plugins/${plugin.slug}`}
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-center"
            style={{
              background: `linear-gradient(135deg, ${categoryColor.bg})`,
              color: '#ffffff',
            }}
            aria-label={`View ${name} plugin details`}
          >
            <span aria-hidden="true">View Plugin 🚀</span>
          </a>
          <button
            onClick={handleCopyInstall}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            style={{ color: 'var(--color-textPrimary)' }}
            aria-label={copied ? 'Copied!' : 'Copy install command'}
            title={copied ? 'Copied!' : 'Copy install command'}
          >
            <span aria-hidden="true">{copied ? '✅' : '📋'}</span>
          </button>
        </div>

        {/* Sparkle effect on hover */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
