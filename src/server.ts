import app from './app';
import config from './config/config';
import http from 'http';
import { WebSocketServer } from 'ws';
import { handleWebSocket } from './socket';

const server = http.createServer(app);
export const wss = new WebSocketServer({server});

handleWebSocket(wss);

server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});