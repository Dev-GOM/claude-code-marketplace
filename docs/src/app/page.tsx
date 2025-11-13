'use client';

import { useState, useMemo } from 'react';
import { getAllPlugins } from '@/lib/data/plugins';
import { SITE_CONFIG } from '@/lib/constants';
import { PluginCard } from '@/components/PluginCard';
import { SearchBar } from '@/components/SearchBar';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home(): React.ReactElement {
  const plugins = useMemo(() => getAllPlugins(), []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const filteredPlugins = useMemo(() => {
    return plugins.filter((plugin) => {
      const matchesSearch =
        searchQuery === '' ||
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.keywords.some((keyword) =>
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        categoryFilter === null || plugin.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [plugins, searchQuery, categoryFilter]);

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-bounce-in">
        <div className="mb-6 flex justify-center gap-4">
          <span className="text-6xl animate-float">🚀</span>
          <span className="text-6xl animate-float" style={{ animationDelay: '0.2s' }}>
            ⚡
          </span>
          <span className="text-6xl animate-float" style={{ animationDelay: '0.4s' }}>
            🎨
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
          {language === 'ko' ? (
            <>
              <span className="gradient-text">당신의 개발 워크플로우를</span>
              <br />
              강화하세요
            </>
          ) : (
            <>
              <span className="gradient-text">Supercharge</span> Your
              <br />
              Development Workflow
            </>
          )}
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-5xl mx-auto mb-8 leading-relaxed">
          {t(
            'Discover amazing Claude Code plugins that make development more fun and productive!',
            '개발을 더 재미있고 생산적으로 만드는 놀라운 Claude Code 플러그인을 발견하세요!'
          )}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
          <div className="group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl opacity-75 blur group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20">
                <div className="text-4xl font-bold text-white mb-1">{plugins.length}</div>
                <div className="text-sm text-white/70">{t('Amazing Plugins', '놀라운 플러그인')}</div>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl opacity-75 blur group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20">
                <div className="text-4xl font-bold text-white mb-1">
                  v{SITE_CONFIG.VERSION}
                </div>
                <div className="text-sm text-white/70">{t('Latest Version', '최신 버전')}</div>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl opacity-75 blur group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20">
                <div className="text-4xl font-bold text-white mb-1">{t('Free', '무료')}</div>
                <div className="text-sm text-white/70">{t('Open Source', '오픈 소스')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="#plugins"
            className="group relative px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-bold text-lg transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-pink-500/50"
          >
            <span className="relative z-10">{t('Browse Plugins', '플러그인 둘러보기')} 🎉</span>
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full opacity-50 blur group-hover:opacity-75 transition-opacity" />
          </a>
          <a
            href={SITE_CONFIG.GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full font-bold text-lg border border-white/20 transition-all duration-300 hover:scale-110 hover:border-white/40"
          >
            {t('View on GitHub', 'GitHub에서 보기')} ⭐
          </a>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div id="plugins" className="mb-12">
        <SearchBar onSearch={setSearchQuery} onCategoryFilter={setCategoryFilter} />
      </div>

      {/* Results count */}
      <div className="mb-6 text-center">
        <p className="text-white/70 text-lg">
          {language === 'ko' ? (
            <>
              <span className="text-white font-bold text-2xl">{filteredPlugins.length}</span>개의 플러그인을{' '}
              {searchQuery ? (
                <>
                  <span className="text-pink-400 font-bold">"{searchQuery}"</span> 검색어로 찾았습니다
                </>
              ) : (
                '찾았습니다'
              )}
            </>
          ) : (
            <>
              Found <span className="text-white font-bold text-2xl">{filteredPlugins.length}</span>{' '}
              {filteredPlugins.length === 1 ? 'plugin' : 'plugins'}
              {searchQuery && (
                <>
                  {' '}
                  matching <span className="text-pink-400 font-bold">"{searchQuery}"</span>
                </>
              )}
            </>
          )}
        </p>
      </div>

      {/* Plugins Masonry Grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {filteredPlugins.map((plugin, index) => (
          <div key={plugin.slug} className="break-inside-avoid mb-6">
            <PluginCard plugin={plugin} index={index} />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredPlugins.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-6">🔍</div>
          <h3 className="text-2xl font-bold text-white mb-4">
            {t('No plugins found', '플러그인을 찾을 수 없습니다')}
          </h3>
          <p className="text-white/70 mb-6">
            {t(
              'Try adjusting your search or filter criteria',
              '검색어나 필터 조건을 변경해보세요'
            )}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter(null);
            }}
            className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 shadow-lg"
          >
            {t('Clear filters', '필터 초기화')}
          </button>
        </div>
      )}
    </div>
  );
}
