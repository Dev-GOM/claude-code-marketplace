/**
 * CDP WebSocket Client for Chrome DevTools Protocol communication.
 */

import WebSocket from 'ws';

export interface CDPMessage {
  id: number;
  method: string;
  params?: Record<string, any>;
}

export interface CDPResponse {
  id: number;
  result?: Record<string, any>;
  error?: {
    code: number;
    message: string;
  };
}

export class CDPClient {
  private ws: WebSocket | null = null;
  private messageId = 0;
  private readonly wsUrl: string;

  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
  }

  /**
   * Connect to Chrome via WebSocket.
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', () => {
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
  async sendCommand(
    method: string,
    params?: Record<string, any>
  ): Promise<Record<string, any>> {
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

      const messageHandler = (data: WebSocket.Data) => {
        try {
          const response: CDPResponse = JSON.parse(data.toString());

          if (response.id === currentMessageId) {
            this.ws?.removeListener('message', messageHandler);

            if (response.error) {
              reject(new Error(`CDP Error: ${JSON.stringify(response.error)}`));
            } else {
              resolve(response.result || {});
            }
          }
        } catch (error) {
          // Ignore parse errors for other messages
        }
      };

      this.ws!.on('message', messageHandler);
      this.ws!.send(JSON.stringify(message));
    });
  }

  /**
   * Close WebSocket connection.
   */
  close(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        // Ignore close errors
      }
      this.ws = null;
    }
  }
}
