/**
 * 타입 정의 중앙 집중화
 * 모든 타입은 이 파일을 통해 export
 */

export type {
  Plugin,
  Author,
  PluginCategory,
  PluginWithReadme,
  MarketplaceData,
} from './plugin';

export type {
  ChangeType,
  ChangelogEntry,
  ChangelogSection,
  ParsedChangelog,
} from './changelog';

/**
 * 검색 관련 타입
 */
export interface SearchResult {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly keywords: readonly string[];
}

/**
 * 필터 관련 타입
 */
export interface FilterOptions {
  readonly categories: readonly string[];
  readonly searchQuery: string;
}
