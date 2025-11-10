/**
 * Winston Logger Configuration
 * TypeScript 애플리케이션용 로깅 시스템
 */
import winston from 'winston';
declare const logger: winston.Logger;
export declare const log: {
    debug: (message: string, ...meta: any[]) => winston.Logger;
    info: (message: string, ...meta: any[]) => winston.Logger;
    warn: (message: string, ...meta: any[]) => winston.Logger;
    error: (message: string, ...meta: any[]) => winston.Logger;
};
export { logger };
export default logger;
//# sourceMappingURL=logger.d.ts.map