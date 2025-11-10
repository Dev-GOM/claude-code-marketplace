/**
 * Configuration management for Blender WebSocket port and state
 * Browser-Pilot의 config 시스템을 참고한 프로젝트별 설정 관리
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync, statSync } from 'fs';
import { join, basename } from 'path';
import { tmpdir } from 'os';
import { createServer } from 'net';
import { BLENDER, FS } from '../constants';

export interface ProjectConfig {
  rootPath: string;
  port: number;
  outputDir: string;
  lastUsed: string | null;
  autoCleanup: boolean;
}

export interface SharedBlenderConfig {
  projects: {
    [projectName: string]: ProjectConfig;
  };
}

/**
 * 로컬 타임스탬프 문자열 생성
 * Format: YYYY-MM-DD HH:MM:SS.mmm
 */
function getLocalTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * 공유 설정 파일 경로 가져오기
 * Browser Pilot 패턴: CLAUDE_PLUGIN_ROOT 환경 변수 사용 (fallback 없음)
 * 위치: $CLAUDE_PLUGIN_ROOT/skills/blender-config.json
 */
function getSharedConfigPath(): string {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;

  if (!pluginRoot) {
    console.error('Error: CLAUDE_PLUGIN_ROOT environment variable not set');
    console.error('This tool must be run from Claude Code environment');
    process.exit(1);
  }

  return join(pluginRoot, 'skills', 'blender-config.json');
}

/**
 * 프로젝트 루트 찾기
 * Browser Pilot 패턴: 환경 변수 검증 후 fallback
 */
export function findProjectRoot(): string {
  const projectDir = process.env.CLAUDE_PROJECT_DIR;

  if (projectDir) {
    // 경로 존재 여부 확인
    if (!existsSync(projectDir)) {
      console.warn(`Warning: CLAUDE_PROJECT_DIR points to non-existent path: ${projectDir}`);
      console.warn('Falling back to current working directory');
      return process.cwd();
    }

    // 디렉토리인지 확인
    try {
      const stats = statSync(projectDir);
      if (!stats.isDirectory()) {
        console.error(`Error: CLAUDE_PROJECT_DIR is not a directory: ${projectDir}`);
        process.exit(1);
      }
      return projectDir;
    } catch (error) {
      console.warn(`Warning: Cannot access CLAUDE_PROJECT_DIR: ${projectDir}`);
      console.warn('Falling back to current working directory');
      return process.cwd();
    }
  }

  // 환경 변수 없으면 현재 작업 디렉토리 사용
  return process.cwd();
}

/**
 * 프로젝트 이름 가져오기 (폴더 이름)
 */
function getProjectName(projectRoot: string): string {
  return basename(projectRoot);
}

/**
 * 프로젝트 출력 디렉토리 가져오기
 */
export function getOutputDir(): string {
  const projectRoot = findProjectRoot();
  const outputDir = join(projectRoot, FS.OUTPUT_DIR);

  // .blender-toolkit 디렉토리 생성
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // .gitignore 생성
  const gitignorePath = join(outputDir, '.gitignore');
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, FS.GITIGNORE_CONTENT, 'utf-8');
  }

  return outputDir;
}

/**
 * 공유 설정 로드
 */
export function loadSharedConfig(): SharedBlenderConfig {
  const configPath = getSharedConfigPath();

  // 설정 파일 디렉토리 생성
  const configDir = join(configPath, '..');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  if (!existsSync(configPath)) {
    // 기본 설정 생성
    const defaultConfig: SharedBlenderConfig = {
      projects: {}
    };
    saveSharedConfig(defaultConfig);
    return defaultConfig;
  }

  try {
    const data = readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load shared config:', error);
    console.warn('Returning empty config - existing settings may be lost');
    console.warn(`Config path: ${configPath}`);
    return {
      projects: {}
    };
  }
}

/**
 * 공유 설정 저장 (원자적 쓰기)
 * Browser Pilot 패턴: 임시 파일에 쓴 후 rename으로 원자적 교체
 */
export function saveSharedConfig(config: SharedBlenderConfig): void {
  const configPath = getSharedConfigPath();
  const tempPath = join(tmpdir(), `blender-config-${Date.now()}-${process.pid}.tmp`);

  try {
    // 1. Write to temporary file first
    writeFileSync(tempPath, JSON.stringify(config, null, 2), 'utf-8');

    // 2. Atomic rename (replaces existing file)
    renameSync(tempPath, configPath);
  } catch (error) {
    // Clean up temporary file if it exists
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to save shared config:', errorMessage);
    console.warn(`Config path: ${configPath}`);
    throw new Error(`Configuration save failed: ${errorMessage}`);
  }
}

/**
 * 현재 프로젝트의 설정 가져오기
 * 없으면 사용 가능한 포트로 자동 생성
 */
export async function getProjectConfig(): Promise<ProjectConfig> {
  const projectRoot = findProjectRoot();
  const projectName = getProjectName(projectRoot);
  const sharedConfig = loadSharedConfig();

  // rootPath로 기존 설정 찾기 (이름이 바뀐 경우 대비)
  const existingEntry = Object.entries(sharedConfig.projects).find(
    ([_, config]) => config.rootPath === projectRoot
  );

  if (existingEntry) {
    const [existingName, config] = existingEntry;

    // 이름이 바뀐 경우 업데이트
    if (existingName !== projectName) {
      delete sharedConfig.projects[existingName];
      sharedConfig.projects[projectName] = config;
      saveSharedConfig(sharedConfig);
      console.log(`📝 Updated project name: ${existingName} → ${projectName}`);
    }

    return config;
  }

  // 같은 이름이 다른 경로에 있는지 확인
  if (sharedConfig.projects[projectName]) {
    console.warn(`⚠️  Project name "${projectName}" already exists with different path`);
    console.warn(`   Existing: ${sharedConfig.projects[projectName].rootPath}`);
    console.warn(`   Current:  ${projectRoot}`);
    throw new Error(`Project name conflict: "${projectName}"`);
  }

  // 새 프로젝트 설정 생성
  const basePort = parseInt(process.env.BLENDER_WS_PORT || String(BLENDER.DEFAULT_PORT));

  // 사용 중인 포트 목록
  const usedPorts = Object.values(sharedConfig.projects).map(p => p.port);
  let port = basePort;

  // 사용 가능한 포트 찾기
  while (usedPorts.includes(port) || !(await isPortAvailable(port))) {
    port++;
    if (port > basePort + BLENDER.PORT_RANGE_MAX) {
      throw new Error(
        `No available port found in range ${basePort}-${basePort + BLENDER.PORT_RANGE_MAX}`
      );
    }
  }

  const projectConfig: ProjectConfig = {
    rootPath: projectRoot,
    port,
    outputDir: FS.OUTPUT_DIR,
    lastUsed: getLocalTimestamp(),
    autoCleanup: false  // 안전을 위해 기본값 false
  };

  // 설정 저장
  sharedConfig.projects[projectName] = projectConfig;
  saveSharedConfig(sharedConfig);

  console.log(`📝 Created config for project: ${projectName}`);
  console.log(`   Path: ${projectRoot}`);
  console.log(`   Port: ${port}`);

  return projectConfig;
}

/**
 * 마지막 사용 시간 업데이트
 */
export function updateProjectLastUsed(): void {
  const projectRoot = findProjectRoot();
  const projectName = getProjectName(projectRoot);
  const sharedConfig = loadSharedConfig();

  if (sharedConfig.projects[projectName]) {
    sharedConfig.projects[projectName].lastUsed = getLocalTimestamp();
    saveSharedConfig(sharedConfig);
  }
}

/**
 * 프로젝트 포트 가져오기
 */
export async function getProjectPort(): Promise<number> {
  const config = await getProjectConfig();
  return config.port;
}

/**
 * 모든 프로젝트 목록
 */
export function listProjects(): void {
  const sharedConfig = loadSharedConfig();
  const projects = Object.entries(sharedConfig.projects);

  if (projects.length === 0) {
    console.log('No projects configured yet.');
    return;
  }

  console.log(`\n📋 Configured Projects (${projects.length}):\n`);
  projects.forEach(([name, config]) => {
    console.log(`   ${name}`);
    console.log(`   ├─ Path: ${config.rootPath}`);
    console.log(`   ├─ Port: ${config.port}`);
    console.log(`   ├─ Output: ${config.outputDir}`);
    console.log(`   └─ Last Used: ${config.lastUsed || 'Never'}\n`);
  });
}

/**
 * 프로젝트 설정 초기화
 */
export function resetProjectConfig(): void {
  const projectRoot = findProjectRoot();
  const projectName = getProjectName(projectRoot);
  const sharedConfig = loadSharedConfig();

  delete sharedConfig.projects[projectName];
  saveSharedConfig(sharedConfig);

  console.log(`🗑️  Removed config for project: ${projectName}`);
}

/**
 * 포트 사용 가능 여부 확인
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, BLENDER.LOCALHOST);
  });
}

/**
 * 사용 가능한 포트 찾기
 */
export async function findAvailablePort(
  startPort = BLENDER.DEFAULT_PORT,
  maxAttempts = BLENDER.PORT_RANGE_MAX
): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(
    `No available port found in range ${startPort}-${startPort + maxAttempts - 1}`
  );
}
