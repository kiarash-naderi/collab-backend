import express from 'express';
import { notFoundHandler } from './core/middleware/notfound.middleware';
import { errorHandler } from './core/middleware/error.middleware';

const app = express();

app.use(express.json());



app.use(notFoundHandler);
app.use(errorHandler);
export default app;