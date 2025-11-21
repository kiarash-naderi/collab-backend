import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { prisma } from './core/db/prisma.js';
import { initAssetService } from './modules/documents/services/asset.service.js';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

async function startServer() {
  try {
    await initAssetService();
    console.log('MinIO bucket ready');

    await prisma.$connect();
    console.log('Database connected successfully');

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`WebSocket ready at ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();