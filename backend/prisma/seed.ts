import 'dotenv/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

const puzzles = [
  // ─── EASY ───────────────────────────────────────────────────────────────────
  {
    title: 'STATION CLEARANCE PROTOCOL',
    difficulty: 'EASY' as const,
    timeLimit: 120,
    answer: 'NOMAD',
    clueText: `[CLASSIFIED — OMEGA STATION LOG]
DATE: 2157.04.12 — TIME: 03:41 UTC

SECURITY CLEARANCE ROSTER — SECTOR ALPHA

STATION 1 ......... PHANTOM
STATION 2 ......... WRAITH
STATION 3 ......... NOMAD
STATION 4 ......... SPECTER
STATION 5 ......... VECTOR

DIRECTIVE: The emergency override is the codename
assigned to STATION 3.

[END OF TRANSMISSION]`,
    hints: [
      { order: 1, coinCost: 10, hintText: 'Find the entry labelled STATION 3 in the roster.' },
      { order: 2, coinCost: 20, hintText: "The answer is a word meaning 'wanderer' or 'drifter'." },
    ],
  },
  {
    title: 'REVERSED SIGNAL',
    difficulty: 'EASY' as const,
    timeLimit: 120,
    answer: 'SIGNAL',
    clueText: `[INTERCEPTED TRANSMISSION — FREQUENCY 7.4 GHz]
DATE: 2157.04.12

WARNING: Signal received on inverted channel.
All data has been transmitted in reverse order.

CONTENT: LANGIS EDIRREVO :DETCETED

Decode the message to retrieve the override key.

[END OF TRANSMISSION]`,
    hints: [
      { order: 1, coinCost: 10, hintText: 'Read the intercepted content backwards, word by word.' },
      { order: 2, coinCost: 20, hintText: "The first word in the decoded message is the override key." },
    ],
  },

  // ─── MEDIUM ─────────────────────────────────────────────────────────────────
  {
    title: 'ACROSTIC DIRECTIVE',
    difficulty: 'MEDIUM' as const,
    timeLimit: 90,
    answer: 'SHADOW',
    clueText: `[CLASSIFIED DIRECTIVE — EYES ONLY]
DATE: 2157.04.13

Mission parameters have been encoded within this briefing.
The override code is hidden within the first letter of each
objective, read in order from top to bottom.

OBJECTIVE 1: Secure the perimeter at grid coordinates 7-N.
OBJECTIVE 2: Hold position until further orders are received.
OBJECTIVE 3: Assess all personnel for loyalty clearance.
OBJECTIVE 4: Destroy compromised terminals in sub-level 3.
OBJECTIVE 5: Observe all incoming transmissions on channel 9.
OBJECTIVE 6: Wait for extraction at designated rendezvous point.

[END OF DIRECTIVE]`,
    hints: [
      { order: 1, coinCost: 15, hintText: 'The code is spelled out by the first letter of each objective.' },
      { order: 2, coinCost: 25, hintText: 'Six objectives, six letters — S, H, A, D, O, W.' },
    ],
  },
  {
    title: 'CAESAR INTERCEPT',
    difficulty: 'MEDIUM' as const,
    timeLimit: 90,
    answer: 'CIPHER',
    clueText: `[INTERCEPTED ENCODED MESSAGE]
DATE: 2157.04.13 — SOURCE: UNKNOWN

Agent analysis indicates this message uses a simple
alphabetic rotation cipher.

ENCODED TEXT: FLSKHU

INTEL: Our cryptographers confirm this cipher shifts
each letter forward by exactly 3 positions in the
alphabet. Reverse the shift to decode.

EXAMPLE: D → A  (shifted back 3 positions)

[END OF INTERCEPT]`,
    hints: [
      { order: 1, coinCost: 15, hintText: 'Shift each letter of FLSKHU back by 3 in the alphabet.' },
      { order: 2, coinCost: 30, hintText: 'F→C, L→I, S→P, K→H, H→E, U→R' },
    ],
  },

  // ─── HARD ───────────────────────────────────────────────────────────────────
  {
    title: 'HEX EXTRACTION',
    difficulty: 'HARD' as const,
    timeLimit: 60,
    answer: 'APEX',
    clueText: `[DEEP SYSTEM LOG — CLASSIFICATION: OMEGA]
DATE: 2157.04.14 — PROCESS: CORE_SEC

Kernel-level override sequence detected in memory dump.
The passphrase is stored in hexadecimal encoding.

MEM[0x4F2A]: 41 50 45 58

REFERENCE — ASCII hex table:
  41=A  42=B  43=C  44=D  45=E  46=F  47=G
  48=H  49=I  4A=J  4B=K  4C=L  4D=M  4E=N
  4F=O  50=P  51=Q  52=R  53=S  54=T  55=U
  56=V  57=W  58=X  59=Y  5A=Z

Decode the memory address to retrieve the passphrase.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 20, hintText: 'Each hex pair maps to one letter via the ASCII table provided.' },
      { order: 2, coinCost: 40, hintText: '41=A, 50=P, 45=E, 58=X' },
    ],
  },
  {
    title: 'BINARY GHOST SIGNAL',
    difficulty: 'HARD' as const,
    timeLimit: 60,
    answer: 'DELTA',
    clueText: `[GHOST SIGNAL INTERCEPT — CLASSIFIED OMEGA]
DATE: 2157.04.14 — FREQ: 118.7 MHz

A binary transmission was intercepted from a rogue terminal.
Each 8-bit group encodes one ASCII character (uppercase).

TRANSMISSION:
01000100 01000101 01001100 01010100 01000001

REFERENCE — decimal to letter:
  A=65  B=66  C=67  D=68  E=69  F=70  G=71
  H=72  I=73  J=74  K=75  L=76  M=77  N=78
  O=79  P=80  Q=81  R=82  S=83  T=84  U=85
  V=86  W=87  X=88  Y=89  Z=90

Convert each binary group to decimal, then match to the table.

[END OF SIGNAL]`,
    hints: [
      { order: 1, coinCost: 20, hintText: 'Convert each 8-bit group to decimal: 68, 69, 76, 84, 65' },
      { order: 2, coinCost: 40, hintText: 'D=68, E=69, L=76, T=84, A=65' },
    ],
  },
]

async function main() {
  console.log('Seeding puzzles...')

  await prisma.puzzleHint.deleteMany()
  await prisma.puzzleAttempt.deleteMany()
  await prisma.passwordPuzzle.deleteMany()

  for (const { hints, ...puzzle } of puzzles) {
    await prisma.passwordPuzzle.create({
      data: {
        ...puzzle,
        hints: { create: hints },
      },
    })
    console.log(`  ✓ ${puzzle.difficulty} — ${puzzle.title}`)
  }

  console.log(`Done. ${puzzles.length} puzzles seeded.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
