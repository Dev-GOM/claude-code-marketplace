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
export declare const BLENDER: {
    readonly DEFAULT_PORT: 9400;
    readonly PORT_RANGE_MAX: 100;
    readonly LOCALHOST: "127.0.0.1";
    readonly WS_TIMEOUT: 30000;
};
/**
 * 파일 시스템 관련 상수
 * @property OUTPUT_DIR - 출력 디렉토리 (.blender-toolkit)
 * @property ANIMATIONS_DIR - 애니메이션 다운로드 디렉토리
 * @property CONFIG_FILE - 설정 파일명
 * @property DAEMON_PID_FILE - 데몬 PID 파일명
 * @property GITIGNORE_CONTENT - .gitignore 기본 내용
 */
export declare const FS: {
    readonly OUTPUT_DIR: ".blender-toolkit";
    readonly ANIMATIONS_DIR: "animations";
    readonly MODELS_DIR: "models";
    readonly CONFIG_FILE: "blender-config.json";
    readonly DAEMON_PID_FILE: "daemon.pid";
    readonly GITIGNORE_CONTENT: "# Blender Toolkit generated files\n*\n";
};
/**
 * Mixamo 관련 상수
 * Note: Mixamo does not provide an official API. Users must manually download files from Mixamo.com
 * @property WEBSITE_URL - Mixamo 웹사이트 URL
 * @property SUPPORTED_FORMATS - 지원 파일 포맷
 * @property RECOMMENDED_FORMAT - 권장 다운로드 포맷
 * @property RECOMMENDED_SKIN - 권장 스킨 설정 (리타게팅용)
 * @property RECOMMENDED_FPS - 권장 FPS
 */
export declare const MIXAMO: {
    readonly WEBSITE_URL: "https://www.mixamo.com";
    readonly SUPPORTED_FORMATS: readonly ["fbx", "dae"];
    readonly RECOMMENDED_FORMAT: "fbx";
    readonly RECOMMENDED_SKIN: "Without Skin";
    readonly RECOMMENDED_FPS: 30;
};
/**
 * 리타게팅 관련 상수
 */
export declare const RETARGETING: {
    readonly BONE_MAPPING_PRESETS: {
        readonly MIXAMO_TO_RIGIFY: "mixamo_to_rigify";
        readonly MIXAMO_TO_CUSTOM: "mixamo_to_custom";
        readonly AUTO_DETECT: "auto_detect";
    };
    readonly CONSTRAINT_TYPES: readonly ["COPY_ROTATION", "COPY_LOCATION"];
};
/**
 * 타이밍 관련 상수 (모든 시간 단위는 밀리초)
 */
export declare const TIMING: {
    readonly DEFAULT_TIMEOUT: 30000;
    readonly IMPORT_TIMEOUT: 60000;
    readonly RETARGET_TIMEOUT: 120000;
    readonly RENDER_TIMEOUT: 300000;
    readonly POLLING_INTERVAL: 1000;
    readonly DAEMON_IDLE_TIMEOUT: 1800000;
    readonly DAEMON_PING_INTERVAL: 5000;
    readonly HOOK_INPUT_TIMEOUT: 100;
    readonly ACTION_DELAY_SHORT: 50;
    readonly ACTION_DELAY_MEDIUM: 100;
    readonly ACTION_DELAY_LONG: 500;
    readonly POLLING_INTERVAL_FAST: 100;
    readonly POLLING_INTERVAL_STANDARD: 500;
    readonly POLLING_INTERVAL_SLOW: 1000;
    readonly WAIT_FOR_BLENDER: 5000;
};
/**
 * Daemon 관련 상수
 */
export declare const DAEMON: {
    readonly IPC_TIMEOUT: 5000;
    readonly MAX_RETRIES: 3;
    readonly RETRY_DELAY: 1000;
    readonly IDLE_CHECK_INTERVAL: 60000;
    readonly MAX_MESSAGE_SIZE: number;
    readonly CONNECT_TIMEOUT: 5000;
    readonly SHUTDOWN_TIMEOUT: 5000;
};
/**
 * 환경 변수 이름 상수
 */
export declare const ENV: {
    readonly BLENDER_WS_PORT: "BLENDER_WS_PORT";
    readonly BLENDER_EXECUTABLE: "BLENDER_EXECUTABLE";
    readonly CLAUDE_PROJECT_DIR: "CLAUDE_PROJECT_DIR";
};
/**
 * 에러 메시지
 */
export declare const ERROR_MESSAGES: {
    readonly BLENDER_NOT_RUNNING: "Blender is not running or WebSocket server is not started";
    readonly CONNECTION_FAILED: "Failed to connect to Blender";
    readonly TIMEOUT: "Operation timed out";
    readonly IMPORT_FAILED: "Failed to import animation";
    readonly RETARGET_FAILED: "Failed to retarget animation";
    readonly NO_CHARACTER_SELECTED: "No character selected";
    readonly ANIMATION_FILE_NOT_FOUND: "Animation file not found. Please download from Mixamo.com first";
    readonly INVALID_BONE_MAPPING: "Invalid bone mapping";
    readonly BONE_MAPPING_CONFIRMATION_FAILED: "Bone mapping confirmation failed";
};
/**
 * 성공 메시지
 */
export declare const SUCCESS_MESSAGES: {
    readonly CONNECTED: "Connected to Blender";
    readonly ANIMATION_IMPORTED: "Animation imported successfully";
    readonly BONE_MAPPING_GENERATED: "Bone mapping generated successfully";
    readonly BONE_MAPPING_SENT_TO_UI: "Bone mapping sent to Blender UI for review";
    readonly RETARGETING_COMPLETE: "Animation retargeted successfully";
};
//# sourceMappingURL=index.d.ts.map