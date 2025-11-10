"use strict";
/**
 * Winston Logger Configuration
 * TypeScript 애플리케이션용 로깅 시스템
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.log = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = require("path");
const fs_1 = require("fs");
// 로그 디렉토리 경로
const LOG_DIR = (0, path_1.join)(process.cwd(), '.blender-toolkit', 'logs');
// 로그 디렉토리 생성
if (!(0, fs_1.existsSync)(LOG_DIR)) {
    (0, fs_1.mkdirSync)(LOG_DIR, { recursive: true });
}
// 로그 포맷 정의
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
    const logMessage = `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ${message}`;
    return stack ? `${logMessage}\n${stack}` : logMessage;
}));
// 콘솔용 컬러 포맷
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
}));
// Winston 로거 생성
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // 파일 트랜스포트: 모든 로그
        new winston_1.default.transports.File({
            filename: (0, path_1.join)(LOG_DIR, 'typescript.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // 파일 트랜스포트: 에러만
        new winston_1.default.transports.File({
            filename: (0, path_1.join)(LOG_DIR, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});
exports.logger = logger;
// 개발 모드에서는 콘솔에도 출력
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
    }));
}
// 디버그 모드 활성화
if (process.env.DEBUG) {
    logger.level = 'debug';
}
// 로거 래퍼 함수들 (사용 편의성)
exports.log = {
    debug: (message, ...meta) => logger.debug(message, ...meta),
    info: (message, ...meta) => logger.info(message, ...meta),
    warn: (message, ...meta) => logger.warn(message, ...meta),
    error: (message, ...meta) => logger.error(message, ...meta),
};
// 기본 export
exports.default = logger;
// 로거 초기화 메시지
logger.info('Logger initialized', {
    logDir: LOG_DIR,
    level: logger.level,
    nodeEnv: process.env.NODE_ENV || 'development',
});
//# sourceMappingURL=logger.js.map