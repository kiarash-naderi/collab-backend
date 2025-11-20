import * as dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_URL || 'postgres://user:pass@localhost:5432/db',
};