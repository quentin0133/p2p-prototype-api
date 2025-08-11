import express from 'express';
import cors from 'cors';
import LobbyRoute from './routes/lobby-route';
import { errorHandler } from './middlewares/errors/error-handle';

const app = express();

app.use(cors({
  origin: '*',
}))

app.use(express.json());

app.use(errorHandler);

app.use('/lobbies', LobbyRoute);

export default app;