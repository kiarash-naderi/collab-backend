import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prisma: PrismaClient | undefined;
}

if (!global.prisma) {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in .env');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  global.prisma = new PrismaClient({
    adapter, 
    log: ['query', 'info', 'warn', 'error'],
  });
}

export const prisma = global.prisma;