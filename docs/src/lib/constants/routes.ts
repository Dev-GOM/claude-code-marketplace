/**
 * 라우트 경로 상수 정의
 */

export const ROUTES = {
  HOME: '/',
  PLUGINS: '/plugins',
  SHOWCASE: '/showcase',
} as const;

export const BASE_PATH = '/claude-code-marketplace';

export function getPluginRoute(pluginSlug: string): string {
  return `${ROUTES.PLUGINS}/${pluginSlug}`;
}
