import { nanoid } from 'nanoid';
import { MessageType } from './enums/message-type';
import { clearPlayerService, fetchLobbies, lobbiesVersion } from './services/lobby-service';
import WebSocket, { WebSocketServer } from 'ws';
import { ExtendedWebSocket } from './types/extended-websocket';

export function handleWebSocket(wss: WebSocketServer) {
  console.log("WS on")

  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      let wsExtended = ws as ExtendedWebSocket
      if (!wsExtended.isAlive) {
        console.log(`Client dead`);
        return ws.terminate();
      }
      wsExtended.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', (ws: WebSocket) => {
    let wsExtended = ws as ExtendedWebSocket

    wsExtended.isAlive = true;
    wsExtended.userId = nanoid(6);

    // Send the current list of lobbies
    const initMesage = {
      type: MessageType.INIT,
      payload: {
        user_id: wsExtended.userId,
        lobbies_version: lobbiesVersion,
        lobbies: fetchLobbies(),
      },
    };
    ws.send(JSON.stringify(initMesage));


    console.log(`Client ${wsExtended.userId} connected`);

    ws.on('pong', () => wsExtended.isAlive = true);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'disconnect') {
          console.log(`Client ${wsExtended.userId} says disconnect`);
          clearPlayerService(wsExtended.userId!!);
          ws.close(1000, 'Client disconnect');
        }
      } catch(e) {
        console.warn('Malformed message:', e);
      }
    });

    // When the websocket closes
    ws.on('close', () => {
      console.log(`Client ${wsExtended.userId} disconnected`);
      clearPlayerService(wsExtended.userId!!);
      ws.removeAllListeners();
    });

    // When there's an error
    ws.on('error', (err) => {
      console.warn(`Client ${wsExtended.userId} error:`, err);
    });
  });

  wss.on('close', () => {
    console.log("Server close");
    clearInterval(interval);
    for (let client of wss.clients)
      client.removeAllListeners();
  });
}