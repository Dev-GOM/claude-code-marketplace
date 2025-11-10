/**
 * Blender WebSocket Client
 * Blender Python 애드온과 통신하기 위한 WebSocket 클라이언트
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { BLENDER } from '../constants';
import { log } from '../utils/logger';

export interface BlenderMessage {
  id: number;
  method: string;
  params?: unknown;
}

export interface BlenderResponse {
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

export interface BlenderEvent {
  method: string;
  params?: unknown;
}

export class BlenderClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private messageId = 0;
  private wsUrl: string;
  private port: number;

  constructor(port: number = BLENDER.DEFAULT_PORT) {
    super();
    this.port = port;
    this.wsUrl = `ws://${BLENDER.LOCALHOST}:${port}`;
  }

  /**
   * Blender에 WebSocket으로 연결
   */
  async connect(port?: number): Promise<void> {
    // port가 제공되면 업데이트
    if (port !== undefined) {
      this.port = port;
      this.wsUrl = `ws://${BLENDER.LOCALHOST}:${port}`;
    }

    log.info(`Connecting to Blender WebSocket: ${this.wsUrl}`);

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      const timeout = setTimeout(() => {
        if (this.ws) {
          this.ws.terminate();
        }
        const errorMsg = `Connection timeout (${BLENDER.WS_TIMEOUT}ms)`;
        log.error(errorMsg);
        reject(new Error(errorMsg));
      }, BLENDER.WS_TIMEOUT);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        log.info('WebSocket connection established');

        // 전역 메시지 핸들러 설정 (이벤트 수신용)
        if (this.ws) {
          this.ws.on('message', (data: WebSocket.Data) => {
            try {
              const message = JSON.parse(data.toString());

              // 이벤트는 id가 없고 method만 있음
              if (!message.id && message.method) {
                this.emit('event', message as BlenderEvent);
                this.emit(message.method, message.params);
              }
            } catch (error) {
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
        log.error(`WebSocket error: ${error.message}`);
        reject(error);
      });

      this.ws.on('close', () => {
        log.info('WebSocket connection closed');
        this.emit('disconnected');
      });
    });
  }

  /**
   * Blender에 명령 전송 및 응답 대기
   */
  async sendCommand<T = any>(
    method: string,
    params?: unknown
  ): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      const errorMsg = 'Not connected to Blender';
      log.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Capture ws reference for use in callbacks
    const ws = this.ws;
    const id = ++this.messageId;
    const message: BlenderMessage = { id, method, params };

    log.debug(`Sending command: ${method}`, params);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.off('message', messageHandler);
        reject(new Error(`Command timeout: ${method}`));
      }, BLENDER.WS_TIMEOUT);

      // 응답 대기
      const messageHandler = (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString()) as BlenderResponse;

          if (response.id === id) {
            clearTimeout(timeout);
            ws.off('message', messageHandler);

            if (response.error) {
              log.error(`Command ${method} failed: ${response.error.message}`);
              reject(new Error(response.error.message));
            } else {
              log.debug(`Command ${method} completed successfully`);
              resolve(response.result as T);
            }
          }
        } catch (error) {
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
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 연결 종료 (disconnect의 alias)
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
