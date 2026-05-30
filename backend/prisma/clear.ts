import 'dotenv/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' }),
})

await prisma.puzzleHint.deleteMany()
await prisma.puzzleAttempt.deleteMany()
await prisma.passwordPuzzle.deleteMany()
console.log('All puzzle data cleared.')
await prisma.$disconnect()
