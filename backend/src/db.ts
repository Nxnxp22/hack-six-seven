import 'dotenv/config'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { PrismaClient } from './generated/prisma'

const libsql = createClient({
  url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
})

const adapter = new PrismaLibSQL(libsql)

export const prisma = new PrismaClient({ adapter })
