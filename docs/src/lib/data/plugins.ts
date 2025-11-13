/**
 * 플러그인 데이터 로더
 */

import type { PluginWithReadme } from '../types';
import pluginsData from '../../../data/plugins.json';

export interface PluginsData {
  readonly marketplace: {
    readonly name: string;
    readonly version: string;
    readonly owner: {
      readonly name: string;
    };
    readonly metadata: {
      readonly description: string;
      readonly version: string;
      readonly homepage: string;
    };
  };
  readonly plugins: readonly PluginWithReadme[];
  readonly changelog: {
    readonly en: string;
    readonly ko: string;
  };
  readonly generatedAt: string;
}

// 캐싱된 플러그인 데이터
let cachedPluginsData: PluginsData | null = null;
let cachedPlugins: readonly PluginWithReadme[] | null = null;

/**
 * 모든 플러그인 데이터 가져오기
 */
export function getPluginsData(): PluginsData {
  if (!cachedPluginsData) {
    cachedPluginsData = pluginsData as PluginsData;
  }
  return cachedPluginsData;
}

/**
 * 모든 플러그인 목록 가져오기 (캐싱 적용)
 */
export function getAllPlugins(): readonly PluginWithReadme[] {
  if (!cachedPlugins) {
    cachedPlugins = getPluginsData().plugins;
  }
  return cachedPlugins;
}

/**
 * 슬러그로 플러그인 찾기
 */
export function getPluginBySlug(slug: string): PluginWithReadme | undefined {
  return getAllPlugins().find((plugin) => plugin.slug === slug);
}

/**
 * 카테고리별 플러그인 필터링
 */
export function getPluginsByCategory(category: string): readonly PluginWithReadme[] {
  return getAllPlugins().filter((plugin) => plugin.category === category);
}

/**
 * 모든 플러그인 슬러그 가져오기 (정적 경로 생성용)
 */
export function getAllPluginSlugs(): readonly string[] {
  return getAllPlugins().map((plugin) => plugin.slug);
}
