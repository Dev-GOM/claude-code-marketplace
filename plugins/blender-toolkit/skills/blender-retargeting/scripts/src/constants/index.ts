/**
 * Blender Toolkit Constants
 * 모든 매직 넘버, 포트, 타이밍 등을 중앙에서 관리
 */

/**
 * Blender WebSocket 관련 상수
 * @property DEFAULT_PORT - 기본 WebSocket 포트 (9400, Browser-Pilot과 충돌 방지)
 * @property PORT_RANGE_MAX - 포트 검색 범위 (100)
 * @property LOCALHOST - 로컬 호스트 주소
 * @property WS_TIMEOUT - WebSocket 연결 타임아웃 (30초)
 */
export const BLENDER = {
  DEFAULT_PORT: 9400,
  PORT_RANGE_MAX: 100,
  LOCALHOST: '127.0.0.1',
  WS_TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * 파일 시스템 관련 상수
 * @property OUTPUT_DIR - 출력 디렉토리 (.blender-toolkit)
 * @property ANIMATIONS_DIR - 애니메이션 다운로드 디렉토리
 * @property CONFIG_FILE - 설정 파일명
 * @property DAEMON_PID_FILE - 데몬 PID 파일명
 * @property GITIGNORE_CONTENT - .gitignore 기본 내용
 */
export const FS = {
  OUTPUT_DIR: '.blender-toolkit',
  ANIMATIONS_DIR: 'animations',
  MODELS_DIR: 'models',
  CONFIG_FILE: 'blender-config.json',
  DAEMON_PID_FILE: 'daemon.pid',
  GITIGNORE_CONTENT: `# Blender Toolkit generated files
*
`,
} as const;

/**
 * Mixamo 관련 상수
 * @property API_BASE_URL - Mixamo API 베이스 URL
 * @property DOWNLOAD_TIMEOUT - 다운로드 타임아웃
 * @property SUPPORTED_FORMATS - 지원 파일 포맷
 */
export const MIXAMO = {
  API_BASE_URL: 'https://www.mixamo.com/api/v1',
  DOWNLOAD_TIMEOUT: 120000, // 2 minutes
  SUPPORTED_FORMATS: ['fbx', 'dae'] as const,
  DEFAULT_FORMAT: 'fbx' as const,
  DEFAULT_SKIN: 'With Skin',
  DEFAULT_FPS: 30,
} as const;

/**
 * 리타게팅 관련 상수
 */
export const RETARGETING = {
  BONE_MAPPING_PRESETS: {
    MIXAMO_TO_RIGIFY: 'mixamo_to_rigify',
    MIXAMO_TO_CUSTOM: 'mixamo_to_custom',
    AUTO_DETECT: 'auto_detect',
  },
  CONSTRAINT_TYPES: ['COPY_ROTATION', 'COPY_LOCATION'] as const,
} as const;

/**
 * 타이밍 관련 상수 (모든 시간 단위는 밀리초)
 */
export const TIMING = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  IMPORT_TIMEOUT: 60000, // 1 minute
  RETARGET_TIMEOUT: 120000, // 2 minutes
  RENDER_TIMEOUT: 300000, // 5 minutes
  POLLING_INTERVAL: 1000, // 1 second
} as const;

/**
 * 환경 변수 이름 상수
 */
export const ENV = {
  BLENDER_WS_PORT: 'BLENDER_WS_PORT',
  BLENDER_EXECUTABLE: 'BLENDER_EXECUTABLE',
  CLAUDE_PROJECT_DIR: 'CLAUDE_PROJECT_DIR',
} as const;

/**
 * 에러 메시지
 */
export const ERROR_MESSAGES = {
  BLENDER_NOT_RUNNING: 'Blender is not running or WebSocket server is not started',
  CONNECTION_FAILED: 'Failed to connect to Blender',
  TIMEOUT: 'Operation timed out',
  IMPORT_FAILED: 'Failed to import animation',
  RETARGET_FAILED: 'Failed to retarget animation',
  NO_CHARACTER_SELECTED: 'No character selected',
  MIXAMO_DOWNLOAD_FAILED: 'Failed to download animation from Mixamo',
  INVALID_BONE_MAPPING: 'Invalid bone mapping',
} as const;

/**
 * 성공 메시지
 */
export const SUCCESS_MESSAGES = {
  CONNECTED: 'Connected to Blender',
  ANIMATION_IMPORTED: 'Animation imported successfully',
  RETARGETING_COMPLETE: 'Animation retargeted successfully',
  MIXAMO_DOWNLOADED: 'Mixamo animation downloaded',
} as const;
