/**
 * Blender WebSocket Client
 * Blender Python 애드온과 통신하기 위한 WebSocket 클라이언트
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { BLENDER } from '../constants';

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
  private readonly wsUrl: string;

  constructor(port: number = BLENDER.DEFAULT_PORT) {
    super();
    this.wsUrl = `ws://${BLENDER.LOCALHOST}:${port}`;
  }

  /**
   * Blender에 WebSocket으로 연결
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      const timeout = setTimeout(() => {
        if (this.ws) {
          this.ws.terminate();
        }
        reject(new Error(`Connection timeout (${BLENDER.WS_TIMEOUT}ms)`));
      }, BLENDER.WS_TIMEOUT);

      this.ws.on('open', () => {
        clearTimeout(timeout);

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
        reject(error);
      });

      this.ws.on('close', () => {
        this.emit('disconnected');
      });
    });
  }

  /**
   * Blender에 명령 전송 및 응답 대기
   */
  async sendCommand<T = Record<string, unknown>>(
    method: string,
    params?: unknown
  ): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to Blender');
    }

    const id = ++this.messageId;
    const message: BlenderMessage = { id, method, params };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.ws?.off('message', messageHandler);
        reject(new Error(`Command timeout: ${method}`));
      }, BLENDER.WS_TIMEOUT);

      // 응답 대기
      const messageHandler = (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString()) as BlenderResponse;

          if (response.id === id) {
            clearTimeout(timeout);
            this.ws?.off('message', messageHandler);

            if (response.error) {
              reject(new Error(response.error.message));
            } else {
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

      this.ws.on('message', messageHandler);

      // 메시지 전송
      this.ws.send(JSON.stringify(message), (error) => {
        if (error) {
          clearTimeout(timeout);
          this.ws?.off('message', messageHandler);
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
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
