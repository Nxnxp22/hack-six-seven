import 'dotenv/config';
import { PrismaClient } from './generated/prisma';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});

const db = new PrismaClient({ adapter });

export default db;
