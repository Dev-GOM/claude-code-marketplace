/**
 * 사이트 설정 상수 정의
 */

export const SITE_CONFIG = {
  TITLE: 'Dev GOM Plugins',
  TITLE_KO: 'Dev GOM 플러그인',
  DESCRIPTION: 'Productivity plugins for Claude Code to automate development workflows',
  DESCRIPTION_KO:
    '개발 워크플로우를 자동화하는 Claude Code 생산성 플러그인 모음',
  GITHUB_URL: 'https://github.com/Dev-GOM/claude-code-marketplace',
  BASE_PATH: '/claude-code-marketplace',
  AUTHOR: 'Dev GOM',
  VERSION: '2.22.0',
} as const;

export const SOCIAL_LINKS = {
  GITHUB: 'https://github.com/Dev-GOM/claude-code-marketplace',
  ISSUES:
    'https://github.com/Dev-GOM/claude-code-marketplace/issues',
} as const;

export const LANG_CONFIG = {
  DEFAULT_LANG: 'en',
  SUPPORTED_LANGS: ['en', 'ko'],
} as const;
