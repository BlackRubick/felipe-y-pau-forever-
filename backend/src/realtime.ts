import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface RealtimeMessage {
  type: 'subscribed' | 'reading' | 'alert' | 'error';
  testId?: string;
  payload?: any;
  timestamp: string;
}

const subscriptions = new Map<string, Set<WebSocket>>();
let wsServer: WebSocketServer | null = null;

const sendMessage = (socket: WebSocket, message: RealtimeMessage) => {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(message));
};

const cleanupSocket = (socket: WebSocket) => {
  subscriptions.forEach((clients, testId) => {
    clients.delete(socket);
    if (clients.size === 0) {
      subscriptions.delete(testId);
    }
  });
};

export const initializeRealtimeServer = (server: HttpServer) => {
  wsServer = new WebSocketServer({ server, path: '/ws/tests' });

  wsServer.on('connection', (socket, req) => {
    const url = new URL(req.url || '/ws/tests', 'http://localhost');
    const testId = url.searchParams.get('testId');

    if (!testId) {
      sendMessage(socket, {
        type: 'error',
        payload: { message: 'Missing testId' },
        timestamp: new Date().toISOString(),
      });
      socket.close();
      return;
    }

    const clients = subscriptions.get(testId) || new Set<WebSocket>();
    clients.add(socket);
    subscriptions.set(testId, clients);

    sendMessage(socket, {
      type: 'subscribed',
      testId,
      payload: { message: 'Subscribed' },
      timestamp: new Date().toISOString(),
    });

    socket.on('close', () => cleanupSocket(socket));
    socket.on('error', () => cleanupSocket(socket));
  });

  console.log('🔌 WebSocket server activo en /ws/tests');
};

const broadcast = (testId: string, type: 'reading' | 'alert', payload: any) => {
  const clients = subscriptions.get(testId);
  if (!clients || clients.size === 0) return;

  const message: RealtimeMessage = {
    type,
    testId,
    payload,
    timestamp: new Date().toISOString(),
  };

  clients.forEach((client) => sendMessage(client, message));
};

export const broadcastReading = (testId: string, reading: any) => {
  broadcast(testId, 'reading', reading);
};

export const broadcastAlert = (testId: string, alert: any) => {
  broadcast(testId, 'alert', alert);
};

export const closeRealtimeServer = () => {
  if (wsServer) {
    wsServer.close();
    wsServer = null;
  }
  subscriptions.clear();
};
