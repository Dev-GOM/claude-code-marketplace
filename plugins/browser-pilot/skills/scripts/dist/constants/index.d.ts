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
export declare const CDP: {
    readonly DEFAULT_PORT: 9222;
    readonly PORT_RANGE_MAX: 100;
    readonly LOCALHOST: "127.0.0.1";
    readonly WS_TIMEOUT: 30000;
    readonly NAVIGATION_TIMEOUT: 30000;
    readonly EVALUATION_TIMEOUT: 10000;
};
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
export declare const FS: {
    readonly OUTPUT_DIR: ".browser-pilot";
    readonly SCREENSHOTS_DIR: "screenshots";
    readonly PDFS_DIR: "pdfs";
    readonly INTERACTION_MAP_FILE: "interaction-map.json";
    readonly MAP_CACHE_FILE: "map-cache.json";
    readonly DAEMON_PID_FILE: "daemon.pid";
    readonly DAEMON_SOCKET: "daemon.sock";
    readonly GITIGNORE_CONTENT: "# Browser Pilot generated files\n*\n";
};
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
export declare const TIMING: {
    readonly DEFAULT_WAIT_TIMEOUT: 30000;
    readonly NETWORK_IDLE_TIMEOUT: 500;
    readonly MAP_CACHE_TTL: 600000;
    readonly DAEMON_IDLE_TIMEOUT: 1800000;
    readonly DAEMON_PING_INTERVAL: 5000;
    readonly SCREENSHOT_DELAY: 100;
    readonly HOOK_INPUT_TIMEOUT: 100;
    readonly ACTION_DELAY_SHORT: 50;
    readonly ACTION_DELAY_MEDIUM: 100;
    readonly ACTION_DELAY_LONG: 500;
    readonly ACTION_DELAY_NAVIGATION: 1000;
    readonly POLLING_INTERVAL_FAST: 100;
    readonly POLLING_INTERVAL_STANDARD: 500;
    readonly POLLING_INTERVAL_SLOW: 1000;
    readonly WAIT_FOR_ELEMENT: 5000;
    readonly WAIT_FOR_NAVIGATION: 30000;
    readonly WAIT_FOR_LOAD_STATE: 30000;
    readonly RECENT_MESSAGE_WINDOW: 5000;
};
/**
 * 시간 단위 변환 상수
 * @property MS_PER_SECOND - 1초당 밀리초 (1000)
 * @property MS_PER_MINUTE - 1분당 밀리초 (60000)
 * @property MS_PER_HOUR - 1시간당 밀리초 (3600000)
 */
export declare const TIME_CONVERSION: {
    readonly MS_PER_SECOND: 1000;
    readonly MS_PER_MINUTE: 60000;
    readonly MS_PER_HOUR: 3600000;
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly INTERNAL_ERROR: 500;
};
export declare const SCREENSHOT: {
    readonly DEFAULT_FORMAT: "png";
    readonly DEFAULT_QUALITY: 80;
    readonly FULL_PAGE: true;
};
export declare const PDF: {
    readonly DEFAULT_FORMAT: "A4";
    readonly DEFAULT_MARGIN: {
        readonly top: "1cm";
        readonly right: "1cm";
        readonly bottom: "1cm";
        readonly left: "1cm";
    };
    readonly PRINT_BACKGROUND: true;
};
export declare const INTERACTION_MAP: {
    readonly CACHE_TTL: 600000;
    readonly MAX_ELEMENTS: 10000;
    readonly SELECTOR_PRIORITY: readonly ["byId", "byText", "byCSS", "byRole", "byAriaLabel"];
};
export declare const DAEMON: {
    readonly IPC_TIMEOUT: 5000;
    readonly MAX_RETRIES: 3;
    readonly RETRY_DELAY: 1000;
    readonly IDLE_CHECK_INTERVAL: 60000;
};
export declare const BROWSER: {
    readonly USER_AGENT_OVERRIDE: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    readonly DEFAULT_VIEWPORT: {
        readonly width: 1920;
        readonly height: 1080;
    };
    readonly HEADLESS: false;
};
/**
 * 환경 변수 이름 상수
 * @property CDP_DEBUG_PORT - Chrome 디버깅 포트 환경 변수명
 * @property CLAUDE_PROJECT_DIR - Claude 프로젝트 디렉토리 환경 변수명
 * @property CLAUDE_PLUGIN_ROOT - Claude 플러그인 루트 환경 변수명
 */
export declare const ENV: {
    readonly CDP_DEBUG_PORT: "CDP_DEBUG_PORT";
    readonly CLAUDE_PROJECT_DIR: "CLAUDE_PROJECT_DIR";
    readonly CLAUDE_PLUGIN_ROOT: "CLAUDE_PLUGIN_ROOT";
};
export declare const ERROR_MESSAGES: {
    readonly PROJECT_ROOT_NOT_FOUND: "[browser-pilot] Could not determine project root";
    readonly ELEMENT_NOT_FOUND: "Element not found";
    readonly TIMEOUT: "Operation timed out";
    readonly NAVIGATION_FAILED: "Navigation failed";
    readonly DAEMON_NOT_RUNNING: "Daemon is not running";
    readonly DAEMON_START_FAILED: "Failed to start daemon";
    readonly PORT_NOT_AVAILABLE: "No available port found";
    readonly CONFIG_LOAD_FAILED: "Failed to load configuration";
    readonly INVALID_SELECTOR: "Invalid selector";
};
export declare const SUCCESS_MESSAGES: {
    readonly NAVIGATION_COMPLETE: "Navigation complete";
    readonly ELEMENT_CLICKED: "Element clicked";
    readonly FORM_FILLED: "Form filled";
    readonly SCREENSHOT_SAVED: "Screenshot saved";
    readonly PDF_GENERATED: "PDF generated";
    readonly DAEMON_STARTED: "Daemon started";
    readonly DAEMON_STOPPED: "Daemon stopped";
};
export declare const PATTERNS: {
    readonly XPATH: RegExp;
    readonly CSS_ID: RegExp;
    readonly CSS_CLASS: RegExp;
    readonly URL: RegExp;
};
//# sourceMappingURL=index.d.ts.map