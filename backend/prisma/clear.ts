import 'dotenv/config'

import { prisma } from '../src/db'
await prisma.puzzleHint.deleteMany()
await prisma.puzzleAttempt.deleteMany()
await prisma.passwordPuzzle.deleteMany()
console.log('All puzzle data cleared.')
await prisma.$disconnect()
