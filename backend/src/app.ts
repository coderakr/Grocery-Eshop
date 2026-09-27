import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  const allowedOrigins = env.CLIENT_URL.split(',').map((origin) =>
    origin.trim(),
  );

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/api', routes);

  app.get('/', (_req, res) => {
    res.json({ success: true, data: { name: 'Grocery eShop API', version: '1.0.0' } });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
