import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import v1Router from './api/router';
import publicRouter from './public-api/router';
import { loggingMiddleware } from './middleware/logging.middleware';
import { metricsMiddleware } from './middleware/metrics.middleware';
import { getMetricsRegistry, metricsContentType } from './observability/metrics';

// Load environment variables
dotenv.config();

const app: Application = express();

// Global Middleware with dynamic CORS supporting all origins & credentials
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim()) 
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length > 0 && !allowedOrigins.includes('*')) {
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Widget-Token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Observability Middlewares
app.use(metricsMiddleware);
app.use(loggingMiddleware);

// Prometheus Metrics Pull Exporter Endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', metricsContentType);
    res.send(await getMetricsRegistry());
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// Routes
app.use('/api/v1', v1Router);
app.use('/public/v1', publicRouter);

// Basic Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
