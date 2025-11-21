import express from 'express';
import cookieParser from 'cookie-parser';  
import authRoutes from './modules/auth/routes/auth.routes.js';
import { notFoundHandler } from './core/middleware/notfound.middleware.js';
import { errorHandler } from './core/middleware/error.middleware.js';
import documentRoutes from './modules/documents/routes/document.routes.js';


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(errorHandler);

app.use('/api/auth', authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/documents/:documentId", documentRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;