/**
 * CHANGELOG 타입 정의
 */

export type ChangeType =
  | 'added'
  | 'changed'
  | 'fixed'
  | 'security'
  | 'deprecated'
  | 'removed'
  | 'documentation';

export interface ChangelogEntry {
  readonly version: string;
  readonly date: string;
  readonly changes: readonly ChangelogSection[];
}

export interface ChangelogSection {
  readonly type: ChangeType;
  readonly items: readonly string[];
}

export interface ParsedChangelog {
  readonly entries: readonly ChangelogEntry[];
  readonly raw: string;
}
