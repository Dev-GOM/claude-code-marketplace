/**
 * Browser Pilot Constants
 * 모든 매직 넘버, URL, 타이밍 등을 중앙에서 관리
 */

/**
 * Chrome DevTools Protocol 관련 상수
 * @property DEFAULT_PORT - 기본 디버깅 포트 (9222)
 * @property PORT_RANGE_MAX - 포트 검색 범위 (100)
 * @property LOCALHOST - 로컬 호스트 주소
 * @property WS_TIMEOUT - WebSocket 연결 타임아웃 (30초)
 * @property NAVIGATION_TIMEOUT - 페이지 네비게이션 타임아웃 (30초)
 * @property EVALUATION_TIMEOUT - 스크립트 실행 타임아웃 (10초)
 */
export const CDP = {
  DEFAULT_PORT: 9222,
  PORT_RANGE_MAX: 100,
  LOCALHOST: '127.0.0.1',
  WS_TIMEOUT: 30000, // 30 seconds
  NAVIGATION_TIMEOUT: 30000, // 30 seconds
  EVALUATION_TIMEOUT: 10000, // 10 seconds
} as const;

/**
 * 파일 시스템 관련 상수
 * @property OUTPUT_DIR - 출력 디렉토리 (.browser-pilot)
 * @property SCREENSHOTS_DIR - 스크린샷 디렉토리 (screenshots)
 * @property PDFS_DIR - PDF 디렉토리 (pdfs)
 * @property INTERACTION_MAP_FILE - Interaction Map 파일명
 * @property MAP_CACHE_FILE - Map 캐시 파일명
 * @property DAEMON_PID_FILE - 데몬 PID 파일명
 * @property DAEMON_SOCKET - 데몬 소켓 파일명
 * @property GITIGNORE_CONTENT - .gitignore 기본 내용
 */
export const FS = {
  OUTPUT_DIR: '.browser-pilot',
  SCREENSHOTS_DIR: 'screenshots',
  PDFS_DIR: 'pdfs',
  INTERACTION_MAP_FILE: 'interaction-map.json',
  MAP_CACHE_FILE: 'map-cache.json',
  DAEMON_PID_FILE: 'daemon.pid',
  DAEMON_SOCKET: 'daemon.sock',
  GITIGNORE_CONTENT: `# Browser Pilot generated files
*
`,
} as const;

/**
 * 타이밍 관련 상수 (모든 시간 단위는 밀리초)
 * @property DEFAULT_WAIT_TIMEOUT - 기본 대기 타임아웃 (30초)
 * @property NETWORK_IDLE_TIMEOUT - 네트워크 idle 체크 간격 (500ms)
 * @property MAP_CACHE_TTL - Map 캐시 유효 기간 (10분)
 * @property DAEMON_IDLE_TIMEOUT - 데몬 idle 타임아웃 (30분)
 * @property DAEMON_PING_INTERVAL - 데몬 ping 간격 (5초)
 * @property SCREENSHOT_DELAY - 스크린샷 딜레이 (100ms)
 * @property HOOK_INPUT_TIMEOUT - Hook stdin 읽기 타임아웃 (100ms)
 * @property ACTION_DELAY_SHORT - 짧은 액션 딜레이 (50ms)
 * @property ACTION_DELAY_MEDIUM - 표준 액션 딜레이 (100ms)
 * @property ACTION_DELAY_LONG - 긴 액션 딜레이 (500ms)
 * @property ACTION_DELAY_NAVIGATION - 네비게이션/페이지 로드 딜레이 (1초)
 * @property POLLING_INTERVAL_FAST - 빠른 폴링 간격 (100ms)
 * @property POLLING_INTERVAL_STANDARD - 표준 폴링 간격 (500ms)
 * @property POLLING_INTERVAL_SLOW - 느린 폴링 간격 (1초)
 * @property WAIT_FOR_ELEMENT - 엘리먼트 대기 타임아웃 (5초)
 * @property WAIT_FOR_NAVIGATION - 네비게이션 대기 타임아웃 (30초)
 * @property WAIT_FOR_LOAD_STATE - 로드 상태 대기 타임아웃 (30초)
 * @property RECENT_MESSAGE_WINDOW - 최근 에러/경고 감지 윈도우 (5초)
 */
export const TIMING = {
  DEFAULT_WAIT_TIMEOUT: 30000, // 30 seconds
  NETWORK_IDLE_TIMEOUT: 500, // 500ms
  MAP_CACHE_TTL: 600000, // 10 minutes
  DAEMON_IDLE_TIMEOUT: 1800000, // 30 minutes
  DAEMON_PING_INTERVAL: 5000, // 5 seconds
  SCREENSHOT_DELAY: 100, // 100ms
  HOOK_INPUT_TIMEOUT: 100, // 100ms for reading stdin

  // Action delays
  ACTION_DELAY_SHORT: 50, // 50ms - very short delay
  ACTION_DELAY_MEDIUM: 100, // 100ms - standard action delay
  ACTION_DELAY_LONG: 500, // 500ms - longer action delay
  ACTION_DELAY_NAVIGATION: 1000, // 1s - navigation/page load delay

  // Polling intervals
  POLLING_INTERVAL_FAST: 100, // 100ms - fast polling
  POLLING_INTERVAL_STANDARD: 500, // 500ms - standard polling
  POLLING_INTERVAL_SLOW: 1000, // 1s - slow polling

  // Wait timeouts
  WAIT_FOR_ELEMENT: 5000, // 5s - wait for element
  WAIT_FOR_NAVIGATION: 30000, // 30s - wait for navigation
  WAIT_FOR_LOAD_STATE: 30000, // 30s - wait for load state

  // Message/Error detection windows
  RECENT_MESSAGE_WINDOW: 5000, // 5s - recent error/warning detection window
} as const;

/**
 * 시간 단위 변환 상수
 * @property MS_PER_SECOND - 1초당 밀리초 (1000)
 * @property MS_PER_MINUTE - 1분당 밀리초 (60000)
 * @property MS_PER_HOUR - 1시간당 밀리초 (3600000)
 */
export const TIME_CONVERSION = {
  MS_PER_SECOND: 1000,
  MS_PER_MINUTE: 60000,
  MS_PER_HOUR: 3600000,
} as const;

// HTTP Status
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

// Screenshot
export const SCREENSHOT = {
  DEFAULT_FORMAT: 'png' as const,
  DEFAULT_QUALITY: 80,
  FULL_PAGE: true,
} as const;

// PDF
export const PDF = {
  DEFAULT_FORMAT: 'A4' as const,
  DEFAULT_MARGIN: {
    top: '1cm',
    right: '1cm',
    bottom: '1cm',
    left: '1cm',
  },
  PRINT_BACKGROUND: true,
} as const;

// Interaction Map
export const INTERACTION_MAP = {
  CACHE_TTL: 600000, // 10 minutes
  MAX_ELEMENTS: 10000,
  SELECTOR_PRIORITY: ['byId', 'byText', 'byCSS', 'byRole', 'byAriaLabel'] as const,
} as const;

// Daemon
export const DAEMON = {
  IPC_TIMEOUT: 5000, // 5 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  IDLE_CHECK_INTERVAL: 60000, // 1 minute
} as const;

// Browser
export const BROWSER = {
  USER_AGENT_OVERRIDE: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  DEFAULT_VIEWPORT: {
    width: 1920,
    height: 1080,
  },
  HEADLESS: false,
} as const;

/**
 * 환경 변수 이름 상수
 * @property CDP_DEBUG_PORT - Chrome 디버깅 포트 환경 변수명
 * @property CLAUDE_PROJECT_DIR - Claude 프로젝트 디렉토리 환경 변수명
 * @property CLAUDE_PLUGIN_ROOT - Claude 플러그인 루트 환경 변수명
 */
export const ENV = {
  CDP_DEBUG_PORT: 'CDP_DEBUG_PORT',
  CLAUDE_PROJECT_DIR: 'CLAUDE_PROJECT_DIR',
  CLAUDE_PLUGIN_ROOT: 'CLAUDE_PLUGIN_ROOT',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  PROJECT_ROOT_NOT_FOUND: '[browser-pilot] Could not determine project root',
  ELEMENT_NOT_FOUND: 'Element not found',
  TIMEOUT: 'Operation timed out',
  NAVIGATION_FAILED: 'Navigation failed',
  DAEMON_NOT_RUNNING: 'Daemon is not running',
  DAEMON_START_FAILED: 'Failed to start daemon',
  PORT_NOT_AVAILABLE: 'No available port found',
  CONFIG_LOAD_FAILED: 'Failed to load configuration',
  INVALID_SELECTOR: 'Invalid selector',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  NAVIGATION_COMPLETE: 'Navigation complete',
  ELEMENT_CLICKED: 'Element clicked',
  FORM_FILLED: 'Form filled',
  SCREENSHOT_SAVED: 'Screenshot saved',
  PDF_GENERATED: 'PDF generated',
  DAEMON_STARTED: 'Daemon started',
  DAEMON_STOPPED: 'Daemon stopped',
} as const;

// Regex Patterns
export const PATTERNS = {
  XPATH: /^\/\//,
  CSS_ID: /^#[a-zA-Z0-9_-]+$/,
  CSS_CLASS: /^\.[a-zA-Z0-9_-]+$/,
  URL: /^https?:\/\//,
} as const;
