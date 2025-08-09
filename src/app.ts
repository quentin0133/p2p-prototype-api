import express from 'express';
import LobbyRoute from './routes/lobby-route';
import { errorHandler } from './middlewares/errors/error-handle';

const app = express();

app.use(express.json());

app.use(errorHandler);

app.use('/lobbies', LobbyRoute);

app.set('trust proxy', true);

export default app;