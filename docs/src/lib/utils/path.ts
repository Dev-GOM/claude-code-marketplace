/**
 * 크로스 플랫폼 경로 처리 유틸리티
 * Windows, macOS, Linux에서 동작하는 경로 처리
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 현재 파일의 __dirname 가져오기 (ESM)
 */
export function getDirname(importMetaUrl: string): string {
  const __filename = fileURLToPath(importMetaUrl);
  return path.dirname(__filename);
}

/**
 * 프로젝트 루트 경로 가져오기
 * docs/ 폴더 기준으로 두 단계 위
 */
export function getProjectRoot(): string {
  // 빌드 시 사용하기 위해 상대 경로 사용
  return path.resolve(process.cwd(), '..');
}

/**
 * 플러그인 폴더 경로 가져오기
 */
export function getPluginPath(pluginName: string): string {
  return path.join(getProjectRoot(), 'plugins', pluginName);
}

/**
 * 플러그인 README 경로 가져오기
 */
export function getPluginReadmePath(
  pluginName: string,
  locale: 'en' | 'ko' = 'en'
): string {
  const filename = locale === 'ko' ? 'README.ko.md' : 'README.md';
  return path.join(getPluginPath(pluginName), filename);
}

/**
 * 이미지 경로 가져오기
 */
export function getImagePath(imageName: string): string {
  return path.join(getProjectRoot(), 'images', imageName);
}

/**
 * marketplace.json 경로 가져오기
 */
export function getMarketplacePath(): string {
  return path.join(getProjectRoot(), '.claude-plugin', 'marketplace.json');
}

/**
 * CHANGELOG 경로 가져오기
 */
export function getChangelogPath(locale: 'en' | 'ko' = 'en'): string {
  const filename = locale === 'ko' ? 'CHANGELOG.ko.md' : 'CHANGELOG.md';
  return path.join(getProjectRoot(), filename);
}

/**
 * 플러그인 소스 경로에서 플러그인 이름 추출
 * @example "./plugins/hook-git-auto-backup" -> "hook-git-auto-backup"
 */
export function extractPluginName(sourcePath: string): string {
  return path.basename(sourcePath);
}
