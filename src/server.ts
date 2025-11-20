import 'dotenv/config';          
import http from 'http';
import app from './app.js';
import { prisma } from './core/db/prisma.js';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(' Database connected successfully');
    console.log(` Server running at http://localhost:${PORT}`);
  } catch (error) {
    console.error(' Failed to connect to database:', error);
    process.exit(1);
  }
});