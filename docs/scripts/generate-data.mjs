#!/usr/bin/env node

/**
 * 데이터 생성 스크립트
 * marketplace.json과 각 플러그인의 README를 읽어서
 * 웹사이트에서 사용할 JSON 데이터를 생성
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const docsRoot = path.resolve(__dirname, '..');

/**
 * marketplace.json 읽기
 */
async function readMarketplace() {
  const marketplacePath = path.join(projectRoot, '.claude-plugin', 'marketplace.json');
  try {
    const content = await fs.readFile(marketplacePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ marketplace.json을 읽을 수 없습니다:', error);
    process.exit(1);
  }
}

/**
 * 플러그인 README 읽기
 */
async function readPluginReadme(pluginSource, locale = 'en') {
  const filename = locale === 'ko' ? 'README.ko.md' : 'README.md';
  const readmePath = path.join(projectRoot, pluginSource, filename);

  try {
    return await fs.readFile(readmePath, 'utf-8');
  } catch (error) {
    // 한글 README가 없을 수도 있음
    if (locale === 'ko') {
      console.warn(`⚠️  ${pluginSource}의 한글 README가 없습니다.`);
      return null;
    }
    console.error(`❌ ${pluginSource}의 README를 읽을 수 없습니다:`, error);
    return null;
  }
}

/**
 * CHANGELOG 읽기
 */
async function readChangelog(locale = 'en') {
  const filename = locale === 'ko' ? 'CHANGELOG.ko.md' : 'CHANGELOG.md';
  const changelogPath = path.join(projectRoot, filename);

  try {
    return await fs.readFile(changelogPath, 'utf-8');
  } catch (error) {
    console.error(`❌ ${filename}을 읽을 수 없습니다:`, error);
    return '';
  }
}

/**
 * 플러그인 이름에서 슬러그 생성
 */
function generateSlug(pluginName) {
  return pluginName;
}

/**
 * 플러그인 한국어 이름 매핑
 */
const PLUGIN_NAME_KO_MAP = {
  'hook-git-auto-backup': 'Git 자동 백업 훅',
  'hook-session-summary': '세션 요약 훅',
  'hook-auto-docs': '자동 문서화 훅',
  'spec-kit': 'Spec Kit',
  'browser-pilot': '브라우저 파일럿',
  'unity-dev-toolkit': 'Unity 개발 툴킷',
  'auto-release-manager': '자동 릴리즈 관리자',
  'hook-sound-notifications': '사운드 알림 훅',
  'blender-toolkit': 'Blender 툴킷',
  'unity-editor-toolkit': 'Unity 에디터 툴킷',
  'ai-pair-programming': 'AI 페어 프로그래밍',
};

/**
 * 플러그인 한국어 설명 매핑
 */
const PLUGIN_DESCRIPTION_KO_MAP = {
  'hook-git-auto-backup': 'Claude Code 세션 중 자동 Git 백업 및 변경 사항 추적',
  'hook-todo-collector': '프로젝트의 모든 TODO 및 FIXME 주석 수집',
  'hook-complexity-monitor': '코드 복잡도 모니터링 및 코드 품질 유지',
  'hook-structure-tracker': '프로젝트 구조 변경 자동 추적 및 문서 업데이트 (README, CHANGELOG)',
  'hook-session-summary': 'Claude Code 세션 종료 시 자동 요약 생성 및 저장',
  'hook-auto-docs': '코드 변경 사항 기반 프로젝트 문서 자동 업데이트',
  'claude-dev-helper': 'Claude Code 개발 도우미 - VSCode 자동 파일 열기, Git diff 리뷰, 향상된 워크플로우 통합',
  'spec-kit': '기술 명세 기반 체계적인 소프트웨어 개발 워크플로우',
  'browser-pilot': 'React 호환성을 갖춘 Chrome DevTools Protocol(CDP) 브라우저 자동화, 웹 스크래핑 및 크롤링',
  'unity-dev-toolkit': 'Unity 프로젝트를 위한 포괄적인 개발 도구 모음',
  'auto-release-manager': '다양한 프로젝트 유형을 위한 버전 관리 및 릴리즈 자동화',
  'hook-sound-notifications': 'Claude Code 이벤트에 대한 사운드 알림',
  'blender-toolkit': 'Blender 3D 프로젝트를 위한 개발 도구 모음',
  'unity-editor-toolkit': 'Unity Editor와의 통합을 위한 고급 도구',
  'ai-pair-programming': 'AI 기반 코드 리뷰 및 페어 프로그래밍 지원',
};

/**
 * 메인 함수
 */
async function main() {
  console.log('🚀 데이터 생성 시작...\n');

  // 1. marketplace.json 읽기
  console.log('📖 marketplace.json 읽는 중...');
  const marketplaceData = await readMarketplace();
  console.log(`✅ ${marketplaceData.plugins.length}개 플러그인 발견\n`);

  // 2. 각 플러그인 README 읽기
  console.log('📖 플러그인 README 읽는 중...');
  const pluginsWithReadme = await Promise.all(
    marketplaceData.plugins.map(async (plugin) => {
      const readme = await readPluginReadme(plugin.source, 'en');
      const readmeKo = await readPluginReadme(plugin.source, 'ko');
      const slug = generateSlug(plugin.name);

      console.log(`  ✓ ${plugin.name}`);

      return {
        ...plugin,
        nameKo: plugin.nameKo || PLUGIN_NAME_KO_MAP[plugin.name] || null,
        descriptionKo: plugin.descriptionKo || PLUGIN_DESCRIPTION_KO_MAP[plugin.name] || null,
        slug,
        readme: readme || '',
        readmeKo: readmeKo || null,
      };
    })
  );
  console.log('✅ 모든 README 읽기 완료\n');

  // 3. CHANGELOG 읽기
  console.log('📖 CHANGELOG 읽는 중...');
  const changelog = await readChangelog('en');
  const changelogKo = await readChangelog('ko');
  console.log('✅ CHANGELOG 읽기 완료\n');

  // 4. 데이터 구조화
  const data = {
    marketplace: {
      name: marketplaceData.name,
      version: marketplaceData.version,
      owner: marketplaceData.owner,
      metadata: marketplaceData.metadata,
    },
    plugins: pluginsWithReadme,
    changelog: {
      en: changelog,
      ko: changelogKo,
    },
    generatedAt: new Date().toISOString(),
  };

  // 5. JSON 파일 저장
  const outputPath = path.join(docsRoot, 'data', 'plugins.json');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

  console.log('✅ 데이터 생성 완료!');
  console.log(`📁 출력 경로: ${outputPath}`);
  console.log(`📊 총 플러그인 수: ${pluginsWithReadme.length}`);
  console.log(`📝 영문 README: ${pluginsWithReadme.filter(p => p.readme).length}`);
  console.log(`📝 한글 README: ${pluginsWithReadme.filter(p => p.readmeKo).length}`);
}

main().catch((error) => {
  console.error('❌ 오류 발생:', error);
  process.exit(1);
});
