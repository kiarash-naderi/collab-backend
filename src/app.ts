import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/routes/auth.routes.js';
import documentRoutes from './modules/documents/routes/document.routes.js';
import metricsRouter from './observability/metrics.endpoint.js';
import healthcheckRouter from './observability/healthcheck.js';
import { notFoundHandler } from './core/middleware/notfound.middleware.js';
import { errorHandler } from './core/middleware/error.middleware.js';
import './observability/metrics.service.js';  

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

app.use('/healthz', healthcheckRouter);
app.use('/ready', healthcheckRouter);
app.use('/metrics', metricsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;