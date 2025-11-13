/**
 * 플러그인 카테고리 상수 정의
 */

import type { PluginCategory } from '../types';

export const PLUGIN_CATEGORIES = {
  HOOKS: 'hooks',
  PRODUCTIVITY: 'productivity',
  GAME_DEVELOPMENT: 'game-development',
  THREE_D_DEVELOPMENT: '3d-development',
} as const;

export const CATEGORY_LABELS: Record<
  PluginCategory,
  { readonly en: string; readonly ko: string }
> = {
  [PLUGIN_CATEGORIES.HOOKS]: { en: 'Hooks', ko: '훅' },
  [PLUGIN_CATEGORIES.PRODUCTIVITY]: { en: 'Productivity', ko: '생산성' },
  [PLUGIN_CATEGORIES.GAME_DEVELOPMENT]: { en: 'Game Development', ko: '게임 개발' },
  [PLUGIN_CATEGORIES.THREE_D_DEVELOPMENT]: { en: '3D Development', ko: '3D 개발' },
} as const;

export const CATEGORY_COLORS: Record<PluginCategory, string> = {
  [PLUGIN_CATEGORIES.HOOKS]: 'bg-blue-500',
  [PLUGIN_CATEGORIES.PRODUCTIVITY]: 'bg-green-500',
  [PLUGIN_CATEGORIES.GAME_DEVELOPMENT]: 'bg-purple-500',
  [PLUGIN_CATEGORIES.THREE_D_DEVELOPMENT]: 'bg-red-500',
} as const;

export const CATEGORY_ICONS: Record<PluginCategory, string> = {
  [PLUGIN_CATEGORIES.HOOKS]: '🔗',
  [PLUGIN_CATEGORIES.PRODUCTIVITY]: '⚡',
  [PLUGIN_CATEGORIES.GAME_DEVELOPMENT]: '🎮',
  [PLUGIN_CATEGORIES.THREE_D_DEVELOPMENT]: '🎨',
} as const;
