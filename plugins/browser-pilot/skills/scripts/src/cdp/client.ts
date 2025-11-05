/**
 * CDP WebSocket Client for Chrome DevTools Protocol communication.
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface CDPMessage {
  id: number;
  method: string;
  params?: unknown;
}

export interface CDPResponse {
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

export interface CDPEvent {
  method: string;
  params?: unknown;
}

export class CDPClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private messageId = 0;
  private readonly wsUrl: string;

  constructor(wsUrl: string) {
    super();
    this.wsUrl = wsUrl;
  }

  /**
   * Connect to Chrome via WebSocket.
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', () => {
        // Set up global message handler for CDP events
        if (this.ws) {
          this.ws.on('message', (data: WebSocket.Data) => {
            try {
              const message = JSON.parse(data.toString());

              // CDP events don't have 'id' field, only 'method' and 'params'
              if (!message.id && message.method) {
                this.emit('event', message as CDPEvent);
                this.emit(message.method, message.params);
              }
            } catch (_error) {
              // Ignore parse errors
            }
          });
        }

        resolve();
      });

      this.ws.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Send CDP command and wait for response.
   */
  async sendCommand<T = Record<string, unknown>>(
    method: string,
    params?: unknown
  ): Promise<T> {
    if (!this.ws) {
      throw new Error('Not connected to Chrome');
    }

    this.messageId++;
    const message: CDPMessage = {
      id: this.messageId,
      method,
      params: params || {}
    };

    return new Promise((resolve, reject) => {
      const currentMessageId = this.messageId;

      const cleanup = () => {
        this.ws?.removeListener('message', messageHandler);
      };

      const messageHandler = (data: WebSocket.Data) => {
        try {
          const response: CDPResponse = JSON.parse(data.toString());

          if (response.id === currentMessageId) {
            cleanup();

            if (response.error) {
              reject(new Error(`CDP Error: ${JSON.stringify(response.error)}`));
            } else {
              resolve((response.result || {}) as T);
            }
          }
        } catch (_error) {
          // Ignore parse errors for other messages
        }
      };

      if (!this.ws) {
        reject(new Error('WebSocket connection lost'));
        return;
      }

      this.ws.on('message', messageHandler);

      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }

  /**
   * Close WebSocket connection.
   */
  close(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_error) {
        // Ignore close errors
      }
      this.ws = null;
    }
  }
}
