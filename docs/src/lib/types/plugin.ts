/**
 * 플러그인 타입 정의
 * marketplace.json의 플러그인 구조를 정의
 */

export interface Plugin {
  readonly name: string;
  readonly nameKo?: string;
  readonly source: string;
  readonly description: string;
  readonly descriptionKo?: string;
  readonly version: string;
  readonly author: Author;
  readonly category: PluginCategory;
  readonly homepage: string;
  readonly keywords: readonly string[];
  readonly slug: string;
}

export interface Author {
  readonly name: string;
}

export type PluginCategory =
  | 'hooks'
  | 'productivity'
  | 'game-development'
  | '3d-development';

export interface PluginWithReadme extends Plugin {
  readonly readme: string;
  readonly readmeKo?: string;
}

export interface MarketplaceData {
  readonly name: string;
  readonly owner: {
    readonly name: string;
  };
  readonly metadata: {
    readonly description: string;
    readonly version: string;
    readonly homepage: string;
  };
  readonly plugins: readonly Plugin[];
  readonly version: string;
}
