/**
 * 테마 색상 정의
 */

export type ThemeId = 'cyberpunk' | 'minimal' | 'modern' | 'glass' | 'purple' | 'matrix';

export interface Theme {
  readonly id: ThemeId;
  readonly name: string;
  readonly nameKo: string;
  readonly colors: {
    readonly bgPrimary: string;
    readonly bgSecondary: string;
    readonly cardBg: string;
    readonly cardBorder: string;
    readonly textPrimary: string;
    readonly textSecondary: string;
    readonly accent1: string;
    readonly accent2: string;
    readonly accent3: string;
    readonly buttonBg: string;
    readonly buttonText: string;
    readonly glow?: string;
  };
}

export const THEMES: Record<ThemeId, Theme> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    nameKo: '사이버펑크',
    colors: {
      bgPrimary: '#0a0a0a',
      bgSecondary: '#1a0033',
      cardBg: 'rgba(255, 0, 255, 0.1)',
      cardBorder: '#ff00ff',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      accent1: '#ff00ff',
      accent2: '#00ffff',
      accent3: '#00ff00',
      buttonBg: 'linear-gradient(135deg, #ff00ff, #00ffff)',
      buttonText: '#000000',
      glow: 'rgba(255, 0, 255, 0.3)',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Dark',
    nameKo: '미니멀 다크',
    colors: {
      bgPrimary: '#0d1117',
      bgSecondary: '#010409',
      cardBg: '#161b22',
      cardBorder: '#30363d',
      textPrimary: '#e6edf3',
      textSecondary: '#7d8590',
      accent1: '#58a6ff',
      accent2: '#238636',
      accent3: '#f85149',
      buttonBg: '#238636',
      buttonText: '#ffffff',
      glow: 'rgba(88, 166, 255, 0.3)',
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern Dark',
    nameKo: '모던 다크',
    colors: {
      bgPrimary: '#000000',
      bgSecondary: '#0a0a0a',
      cardBg: 'rgba(255, 255, 255, 0.05)',
      cardBorder: 'rgba(255, 255, 255, 0.1)',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.6)',
      accent1: '#0070f3',
      accent2: '#7928ca',
      accent3: '#ff0080',
      buttonBg: '#ffffff',
      buttonText: '#000000',
      glow: 'rgba(0, 112, 243, 0.3)',
    },
  },
  glass: {
    id: 'glass',
    name: 'Glassmorphism',
    nameKo: '글래스모피즘',
    colors: {
      bgPrimary: '#1a1a2e',
      bgSecondary: '#16213e',
      cardBg: 'rgba(255, 255, 255, 0.1)',
      cardBorder: 'rgba(255, 255, 255, 0.2)',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      accent1: '#5e81f4',
      accent2: '#e94560',
      accent3: '#0f3460',
      buttonBg: 'rgba(94, 129, 244, 0.8)',
      buttonText: '#ffffff',
      glow: 'rgba(94, 129, 244, 0.4)',
    },
  },
  purple: {
    id: 'purple',
    name: 'Deep Purple',
    nameKo: '딥 퍼플',
    colors: {
      bgPrimary: '#1e1e2e',
      bgSecondary: '#2b2d42',
      cardBg: 'rgba(88, 101, 242, 0.1)',
      cardBorder: '#5865f2',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      accent1: '#5865f2',
      accent2: '#eb459e',
      accent3: '#ed4245',
      buttonBg: '#5865f2',
      buttonText: '#ffffff',
      glow: 'rgba(88, 101, 242, 0.4)',
    },
  },
  matrix: {
    id: 'matrix',
    name: 'Green Matrix',
    nameKo: '그린 매트릭스',
    colors: {
      bgPrimary: '#0a0e0a',
      bgSecondary: '#0d1f0d',
      cardBg: 'rgba(0, 255, 0, 0.05)',
      cardBorder: '#00ff00',
      textPrimary: '#00ff00',
      textSecondary: 'rgba(0, 255, 0, 0.7)',
      accent1: '#00ff00',
      accent2: '#00cc00',
      accent3: '#33ff33',
      buttonBg: '#00ff00',
      buttonText: '#000000',
      glow: 'rgba(0, 255, 0, 0.4)',
    },
  },
} as const;

export const DEFAULT_THEME: ThemeId = 'matrix';
