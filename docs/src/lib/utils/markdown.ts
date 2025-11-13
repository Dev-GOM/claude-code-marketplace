/**
 * 마크다운 처리 유틸리티
 */

/**
 * 마크다운에서 첫 번째 헤딩 제거
 * (페이지에 이미 제목이 있으므로)
 */
export function removeFirstHeading(markdown: string): string {
  return markdown.replace(/^#\s+.+\n\n?/m, '');
}

/**
 * 마크다운에서 언어 선택 배지 제거
 */
export function removeLanguageBadge(markdown: string): string {
  return markdown.replace(/^>\s*\*\*Language\*\*:.+\n\n?/m, '');
}

/**
 * 마크다운 전처리
 */
export function preprocessMarkdown(markdown: string): string {
  let processed = markdown;
  processed = removeLanguageBadge(processed);
  processed = removeFirstHeading(processed);
  return processed;
}
