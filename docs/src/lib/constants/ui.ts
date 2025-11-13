/**
 * UI 관련 상수
 */

export const categoryEmojis: Record<string, string> = {
  hooks: '🎣',
  productivity: '⚡',
  'game-development': '🎮',
  '3d-development': '🎨',
} as const;

export const categoryColors: Record<
  string,
  { readonly bg: string; readonly text: string; readonly glow?: string }
> = {
  hooks: {
    bg: 'from-cyan-400 to-blue-500',
    text: 'text-cyan-400',
    glow: 'hover:shadow-cyan-400/50',
  },
  productivity: {
    bg: 'from-yellow-400 to-orange-500',
    text: 'text-yellow-400',
    glow: 'hover:shadow-yellow-400/50',
  },
  'game-development': {
    bg: 'from-pink-400 to-purple-500',
    text: 'text-pink-400',
    glow: 'hover:shadow-pink-400/50',
  },
  '3d-development': {
    bg: 'from-green-400 to-emerald-500',
    text: 'text-green-400',
    glow: 'hover:shadow-green-400/50',
  },
} as const;

export const defaultCategoryColor = {
  bg: 'from-yellow-400 to-orange-500',
  text: 'text-yellow-400',
  glow: 'hover:shadow-yellow-400/50',
} as const;
