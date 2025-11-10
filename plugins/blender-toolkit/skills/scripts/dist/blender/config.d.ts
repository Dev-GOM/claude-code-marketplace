/**
 * Configuration management for Blender WebSocket port and state
 * Browser-Pilot의 config 시스템을 참고한 프로젝트별 설정 관리
 */
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
 * 프로젝트 루트 찾기
 * Browser Pilot 패턴: 환경 변수 검증 후 fallback
 */
export declare function findProjectRoot(): string;
/**
 * 프로젝트 출력 디렉토리 가져오기
 */
export declare function getOutputDir(): string;
/**
 * 공유 설정 로드
 */
export declare function loadSharedConfig(): SharedBlenderConfig;
/**
 * 공유 설정 저장 (원자적 쓰기)
 * Browser Pilot 패턴: 임시 파일에 쓴 후 rename으로 원자적 교체
 */
export declare function saveSharedConfig(config: SharedBlenderConfig): void;
/**
 * 현재 프로젝트의 설정 가져오기
 * 없으면 사용 가능한 포트로 자동 생성
 */
export declare function getProjectConfig(): Promise<ProjectConfig>;
/**
 * 마지막 사용 시간 업데이트
 */
export declare function updateProjectLastUsed(): void;
/**
 * 프로젝트 포트 가져오기
 */
export declare function getProjectPort(): Promise<number>;
/**
 * 모든 프로젝트 목록
 */
export declare function listProjects(): void;
/**
 * 프로젝트 설정 초기화
 */
export declare function resetProjectConfig(): void;
/**
 * 포트 사용 가능 여부 확인
 */
export declare function isPortAvailable(port: number): Promise<boolean>;
/**
 * 사용 가능한 포트 찾기
 */
export declare function findAvailablePort(startPort?: 9400, maxAttempts?: 100): Promise<number>;
//# sourceMappingURL=config.d.ts.map