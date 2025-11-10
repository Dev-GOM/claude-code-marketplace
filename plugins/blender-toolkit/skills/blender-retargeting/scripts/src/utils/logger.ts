/**
 * Winston Logger Configuration
 * TypeScript 애플리케이션용 로깅 시스템
 */

import winston from 'winston';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 로그 디렉토리 경로
const LOG_DIR = join(process.cwd(), '.blender-toolkit', 'logs');

// 로그 디렉토리 생성
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// 로그 포맷 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const logMessage = `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ${message}`;
    return stack ? `${logMessage}\n${stack}` : logMessage;
  })
);

// 콘솔용 컬러 포맷
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// Winston 로거 생성
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 파일 트랜스포트: 모든 로그
    new winston.transports.File({
      filename: join(LOG_DIR, 'typescript.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // 파일 트랜스포트: 에러만
    new winston.transports.File({
      filename: join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 개발 모드에서는 콘솔에도 출력
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// 디버그 모드 활성화
if (process.env.DEBUG) {
  logger.level = 'debug';
}

// 로거 래퍼 함수들 (사용 편의성)
export const log = {
  debug: (message: string, ...meta: any[]) => logger.debug(message, ...meta),
  info: (message: string, ...meta: any[]) => logger.info(message, ...meta),
  warn: (message: string, ...meta: any[]) => logger.warn(message, ...meta),
  error: (message: string, ...meta: any[]) => logger.error(message, ...meta),
};

// Named export (코드베이스 호환성)
export { logger };

// 기본 export
export default logger;

// 로거 초기화 메시지
logger.info('Logger initialized', {
  logDir: LOG_DIR,
  level: logger.level,
  nodeEnv: process.env.NODE_ENV || 'development',
});
