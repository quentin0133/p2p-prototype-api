import WebSocket from 'ws';

export interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  userId?: string;
  lobbyId?: string;
}