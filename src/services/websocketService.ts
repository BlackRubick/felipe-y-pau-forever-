// ============================================================================
// WEBSOCKET SERVICE - Conexión en tiempo real con dispositivo
// ============================================================================

import { VitalReading, WebSocketMessage, VitalReadingMessage } from '../types';

export type WebSocketEventHandler = (data: any) => void;
export type WebSocketErrorHandler = (error: Error) => void;
export type WebSocketStatusHandler = (status: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private statusHandlers: Set<WebSocketStatusHandler> = new Set();
  private errorHandlers: Set<WebSocketErrorHandler> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private latency = 0;
  private lastMessageTime = 0;

  /**
   * Conectar a WebSocket
   */
  connect(ip: string, port: number = 8080): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.url = `ws://${ip}:${port}`;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket conectado a:', this.url);
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.notifyStatusChange(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.notifyError(new Error('Error de conexión WebSocket'));
          reject(new Error('No se pudo conectar al dispositivo'));
        };

        this.ws.onclose = () => {
          console.log('WebSocket desconectado');
          this.stopHeartbeat();
          this.notifyStatusChange(false);
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Desconectar WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.notifyStatusChange(false);
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Obtener latencia actual
   */
  getLatency(): number {
    return this.latency;
  }

  /**
   * Obtener tiempo desde último mensaje
   */
  getTimeSinceLastMessage(): number {
    return Date.now() - this.lastMessageTime;
  }

  /**
   * Escuchar eventos
   */
  on(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, new Set());
    }
    this.messageHandlers.get(eventType)!.add(handler);
  }

  /**
   * Dejar de escuchar eventos
   */
  off(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Escuchar cambios de estado
   */
  onStatusChange(handler: WebSocketStatusHandler): void {
    this.statusHandlers.add(handler);
  }

  /**
   * Dejar de escuchar cambios de estado
   */
  offStatusChange(handler: WebSocketStatusHandler): void {
    this.statusHandlers.delete(handler);
  }

  /**
   * Escuchar errores
   */
  onError(handler: WebSocketErrorHandler): void {
    this.errorHandlers.add(handler);
  }

  /**
   * Enviar mensaje
   */
  send(message: WebSocketMessage): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket no conectado');
    }
    this.ws!.send(JSON.stringify(message));
  }

  /**
   * Métodos privados
   */

  private handleMessage(data: string): void {
    try {
      this.lastMessageTime = Date.now();
      const message: WebSocketMessage = JSON.parse(data);

      // Calcular latencia si es respuesta a ping
      if (message.type === 'pong') {
        const timestamp = parseInt(message.payload.timestamp || '0');
        this.latency = Date.now() - timestamp;
      }

      // Emitir evento específico
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach((handler) => handler(message.payload));
      }

      // Emitir evento genérico
      const allHandlers = this.messageHandlers.get('*');
      if (allHandlers) {
        allHandlers.forEach((handler) => handler(message));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.notifyError(new Error('Error procesando mensaje del dispositivo'));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        const message: WebSocketMessage = {
          type: 'ping',
          payload: { timestamp: Date.now().toString() },
          timestamp: new Date().toISOString(),
        };
        this.send(message);
      }
    }, 30000); // Cada 30 segundos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        this.connect(this.url.replace('ws://', '').split(':')[0]).catch(() => {
          // Error ya manejado en connect()
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private notifyStatusChange(isConnected: boolean): void {
    this.statusHandlers.forEach((handler) => handler(isConnected));
  }

  private notifyError(error: Error): void {
    this.errorHandlers.forEach((handler) => handler(error));
  }
}

export default new WebSocketService();
