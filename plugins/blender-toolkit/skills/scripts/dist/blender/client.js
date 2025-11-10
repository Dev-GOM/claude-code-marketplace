"use strict";
/**
 * Blender WebSocket Client
 * Blender Python 애드온과 통신하기 위한 WebSocket 클라이언트
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlenderClient = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
const constants_1 = require("../constants");
const logger_1 = require("../utils/logger");
class BlenderClient extends events_1.EventEmitter {
    constructor(port = constants_1.BLENDER.DEFAULT_PORT) {
        super();
        this.ws = null;
        this.messageId = 0;
        this.port = port;
        this.wsUrl = `ws://${constants_1.BLENDER.LOCALHOST}:${port}`;
    }
    /**
     * Blender에 WebSocket으로 연결
     */
    async connect(port) {
        // port가 제공되면 업데이트
        if (port !== undefined) {
            this.port = port;
            this.wsUrl = `ws://${constants_1.BLENDER.LOCALHOST}:${port}`;
        }
        logger_1.log.info(`Connecting to Blender WebSocket: ${this.wsUrl}`);
        return new Promise((resolve, reject) => {
            this.ws = new ws_1.default(this.wsUrl);
            const timeout = setTimeout(() => {
                if (this.ws) {
                    this.ws.terminate();
                }
                const errorMsg = `Connection timeout (${constants_1.BLENDER.WS_TIMEOUT}ms)`;
                logger_1.log.error(errorMsg);
                reject(new Error(errorMsg));
            }, constants_1.BLENDER.WS_TIMEOUT);
            this.ws.on('open', () => {
                clearTimeout(timeout);
                logger_1.log.info('WebSocket connection established');
                // 전역 메시지 핸들러 설정 (이벤트 수신용)
                if (this.ws) {
                    this.ws.on('message', (data) => {
                        try {
                            const message = JSON.parse(data.toString());
                            // 이벤트는 id가 없고 method만 있음
                            if (!message.id && message.method) {
                                this.emit('event', message);
                                this.emit(message.method, message.params);
                            }
                        }
                        catch (error) {
                            // JSON 파싱 에러는 무시하되 디버그 모드에서는 로깅
                            if (process.env.DEBUG) {
                                console.debug('[BlenderClient] Event JSON parse error:', error);
                            }
                        }
                    });
                }
                resolve();
            });
            this.ws.on('error', (error) => {
                clearTimeout(timeout);
                logger_1.log.error(`WebSocket error: ${error.message}`);
                reject(error);
            });
            this.ws.on('close', () => {
                logger_1.log.info('WebSocket connection closed');
                this.emit('disconnected');
            });
        });
    }
    /**
     * Blender에 명령 전송 및 응답 대기
     */
    async sendCommand(method, params) {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
            const errorMsg = 'Not connected to Blender';
            logger_1.log.error(errorMsg);
            throw new Error(errorMsg);
        }
        // Capture ws reference for use in callbacks
        const ws = this.ws;
        const id = ++this.messageId;
        const message = { id, method, params };
        logger_1.log.debug(`Sending command: ${method}`, params);
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                ws.off('message', messageHandler);
                reject(new Error(`Command timeout: ${method}`));
            }, constants_1.BLENDER.WS_TIMEOUT);
            // 응답 대기
            const messageHandler = (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    if (response.id === id) {
                        clearTimeout(timeout);
                        ws.off('message', messageHandler);
                        if (response.error) {
                            logger_1.log.error(`Command ${method} failed: ${response.error.message}`);
                            reject(new Error(response.error.message));
                        }
                        else {
                            logger_1.log.debug(`Command ${method} completed successfully`);
                            resolve(response.result);
                        }
                    }
                }
                catch (error) {
                    // JSON 파싱 에러는 무시 (다른 메시지일 수 있음)
                    // 디버그 모드에서만 로깅
                    if (process.env.DEBUG) {
                        console.debug('[BlenderClient] JSON parse error:', error);
                    }
                }
            };
            ws.on('message', messageHandler);
            // 메시지 전송
            ws.send(JSON.stringify(message), (error) => {
                if (error) {
                    clearTimeout(timeout);
                    ws.off('message', messageHandler);
                    reject(error);
                }
            });
        });
    }
    /**
     * WebSocket 연결 종료
     */
    async disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    /**
     * 연결 종료 (disconnect의 alias)
     */
    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    /**
     * 연결 상태 확인
     */
    isConnected() {
        return this.ws !== null && this.ws.readyState === ws_1.default.OPEN;
    }
}
exports.BlenderClient = BlenderClient;
//# sourceMappingURL=client.js.map