import 'dotenv/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

const puzzles = [
  // ─── EASY — look for badge numbers, sector names, or override protocols in clear text ──────────

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
    title: 'SECTOR OVERRIDE DIRECTIVE',
    difficulty: 'EASY' as const,
    timeLimit: 120,
    answer: 'VIPER',
    clueText: `[CLASSIFIED — SECTOR DELTA COMMAND LOG]
DATE: 2157.04.15 — TIME: 07:22 UTC

EMERGENCY OVERRIDE DIRECTIVE — PRIORITY ONE

All terminals in Sector Delta have been locked pending
security review. The following override has been authorized
by Command Authority.

OVERRIDE PROTOCOL: VIPER
AUTHORIZATION LEVEL: ALPHA-1
EFFECTIVE UNTIL: 2157.04.16 00:00 UTC

Enter the override protocol to restore terminal access.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 10, hintText: "Search for 'OVERRIDE PROTOCOL' in the document." },
      { order: 2, coinCost: 15, hintText: 'The protocol name is a type of snake.' },
    ],
  },

  {
    title: 'BADGE SCAN LOG',
    difficulty: 'EASY' as const,
    timeLimit: 120,
    answer: 'ECHO',
    clueText: `[ACCESS CONTROL LOG — SUBLEVEL 4]
DATE: 2157.04.16 — TIME: 14:05 UTC

AUTHORIZED BADGE SCAN RECORDS:

BADGE #001 — Personnel: ALPHA — Access: GRANTED
BADGE #002 — Personnel: BRAVO — Access: GRANTED
BADGE #003 — Personnel: CHARLIE — Access: REVOKED
BADGE #004 — Personnel: ECHO — Access: GRANTED
BADGE #005 — Personnel: FOXTROT — Access: REVOKED

SECURITY NOTE: The override key is the personnel name
on BADGE #004.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 10, hintText: 'Find BADGE #004 in the access log.' },
      { order: 2, coinCost: 15, hintText: 'The name is a NATO phonetic alphabet word starting with E.' },
    ],
  },

  {
    title: 'SECTOR ALPHA COMMAND',
    difficulty: 'EASY' as const,
    timeLimit: 120,
    answer: 'TITAN',
    clueText: `[SECTOR ALPHA COMMAND — SECURITY LOG]
DATE: 2157.04.21 — TIME: 09:10 UTC

UNIT ASSIGNMENT ROSTER — ACTIVE PERSONNEL

UNIT A ......... ATLAS
UNIT B ......... TITAN
UNIT C ......... KRONOS
UNIT D ......... HELIOS

DIRECTIVE: The emergency override is the codename
of the unit assigned to UNIT B.

[END OF TRANSMISSION]`,
    hints: [
      { order: 1, coinCost: 10, hintText: 'Find the entry labelled UNIT B in the roster.' },
      { order: 2, coinCost: 15, hintText: 'The name belongs to a Titan from Greek mythology.' },
    ],
  },

  {
    title: 'EMERGENCY LOCKOUT ORDER',
    difficulty: 'EASY' as const,
    timeLimit: 120,
    answer: 'COBRA',
    clueText: `[OMEGA STATION — EMERGENCY LOCKOUT ORDER]
DATE: 2157.04.22 — TIME: 11:33 UTC

LOCKOUT PROTOCOL INITIATED — LEVEL 5 ALERT

All personnel must vacate sub-levels 2 through 5.
The following protocol has been issued by Security HQ.

LOCKOUT PROTOCOL: COBRA
ISSUED BY: COMMAND AUTHORITY DELTA
VALID FOR: 48 HOURS FROM ISSUE

Enter the lockout protocol to disengage the override.

[END OF ORDER]`,
    hints: [
      { order: 1, coinCost: 10, hintText: "Search for 'LOCKOUT PROTOCOL' in the document." },
      { order: 2, coinCost: 15, hintText: 'The protocol name is a type of snake.' },
    ],
  },

  {
    title: 'PERSONNEL BADGE LOG',
    difficulty: 'EASY' as const,
    timeLimit: 120,
    answer: 'SIERRA',
    clueText: `[PERSONNEL BADGE SCAN — SUBLEVEL 7]
DATE: 2157.04.23 — TIME: 15:47 UTC

AUTHORIZED BADGE SCAN RECORDS:

BADGE #011 — Personnel: TANGO — Access: REVOKED
BADGE #012 — Personnel: SIERRA — Access: GRANTED
BADGE #013 — Personnel: LIMA — Access: GRANTED
BADGE #014 — Personnel: ROMEO — Access: REVOKED

SECURITY NOTE: The override key is the personnel name
on BADGE #012.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 10, hintText: 'Find BADGE #012 in the access log.' },
      { order: 2, coinCost: 15, hintText: 'The name is a NATO phonetic alphabet word starting with S.' },
    ],
  },

  // ─── MEDIUM ──────────────────────────────────────────────────────────────────────────────────────
  // Technique 1: Strip hyphen characters from system codes (e.g. R-42 becomes R42)

  {
    title: 'HYPHEN PROTOCOL',
    difficulty: 'MEDIUM' as const,
    timeLimit: 90,
    answer: 'PHX09',
    clueText: `[SECURITY PROTOCOL LOG — SECTOR PHOENIX]
DATE: 2157.04.16

Authentication requires the stripped version of
the access code. Remove all hyphen characters
from the encoded code below to obtain the passphrase.

ENCODED ACCESS CODE: PHX-09

PROTOCOL NOTE: Hyphen characters are added during
transmission for readability and must be stripped
before terminal entry.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 15, hintText: 'Remove the hyphen (-) character from PHX-09.' },
      { order: 2, coinCost: 25, hintText: 'PHX-09 without the hyphen is PHX09.' },
    ],
  },

  {
    title: 'CLASSIFIED SECTOR CODE',
    difficulty: 'MEDIUM' as const,
    timeLimit: 90,
    answer: 'SEC7BRAVO',
    clueText: `[SECTOR AUTHENTICATION — SYSTEM LOG]
DATE: 2157.04.17

Sector access codes use hyphen separators during
transmission. Strip all hyphens to produce the
terminal entry passphrase.

TRANSMITTED CODE: SEC-7-BRAVO

REMINDER: Hyphens are separators only and must be
removed before entry.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 15, hintText: 'Remove all hyphen (-) characters from SEC-7-BRAVO.' },
      { order: 2, coinCost: 25, hintText: 'SEC-7-BRAVO with hyphens removed is SEC7BRAVO.' },
    ],
  },

  // Technique 2: Combine project names with dates sequentially (e.g. OMEGA + Day 15 = OMEGA15)

  {
    title: 'PROJECT DAY CIPHER',
    difficulty: 'MEDIUM' as const,
    timeLimit: 90,
    answer: 'NEXUS7',
    clueText: `[PROJECT NEXUS — ACCESS LOG]
DATE: 2157.04.18

The override passphrase is generated by combining
the project codename with the current operation day
number, with no separator.

PROJECT CODENAME: NEXUS
CURRENT OPERATION DAY: 7

Combine the project name directly with the day
number to form the passphrase.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 15, hintText: 'Combine NEXUS and the day number directly, no space or separator.' },
      { order: 2, coinCost: 20, hintText: 'NEXUS + 7 = NEXUS7' },
    ],
  },

  {
    title: 'OPERATION DAWNBREAK',
    difficulty: 'MEDIUM' as const,
    timeLimit: 90,
    answer: 'DAWNBREAK15',
    clueText: `[OPERATION DAWNBREAK — COMMAND LOG]
DATE: 2157.04.19

Daily override passphrases are formed by appending
the operation day number to the operation name.

OPERATION NAME: DAWNBREAK
OPERATION DAY: 15

No separators. Combine directly.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 15, hintText: 'Append the day number directly after the operation name.' },
      { order: 2, coinCost: 20, hintText: 'DAWNBREAK + 15 = DAWNBREAK15' },
    ],
  },

  // Technique 3: Reverse failed entry strings (e.g. 1234 reversed is 4321)

  {
    title: 'REVERSE LOG INTERCEPT',
    difficulty: 'MEDIUM' as const,
    timeLimit: 90,
    answer: 'AGENT',
    clueText: `[TERMINAL ACCESS LOG — FAILED ENTRIES]
DATE: 2157.04.16

The following failed entry was recorded at Terminal 7.
Analysis confirms the passphrase was entered in reverse.

FAILED ENTRY: TNEGA

Reverse the failed entry to recover the correct
override code.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 15, hintText: 'Read the failed entry string backwards.' },
      { order: 2, coinCost: 25, hintText: 'TNEGA reversed letter by letter is AGENT.' },
    ],
  },

  {
    title: 'CORRUPTED ENTRY LOG',
    difficulty: 'MEDIUM' as const,
    timeLimit: 90,
    answer: 'STORM',
    clueText: `[SECURITY TERMINAL — ERROR LOG]
DATE: 2157.04.20

Terminal detected a reversed passphrase input.
The entry was logged in its corrupted (reversed) form.

CORRUPTED ENTRY: MROTS

Correct the entry by reversing it to obtain the
valid override code.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 15, hintText: 'Read the corrupted entry string backwards.' },
      { order: 2, coinCost: 25, hintText: 'MROTS reversed is STORM.' },
    ],
  },

  // ─── HARD ────────────────────────────────────────────────────────────────────────────────────────
  // Technique 1: Combine all-caps author initials with years (e.g. Dr. Elena VOSS in 2084 = EV2084)

  {
    title: 'RESEARCHER CREDENTIALS',
    difficulty: 'HARD' as const,
    timeLimit: 60,
    answer: 'EV2084',
    clueText: `[RESEARCH ARCHIVE — CLASSIFIED]
DATE: 2157.04.17

Security access is tied to the lead researcher's
credentials. The override key combines the researcher's
initials with the publication year.

RESEARCH LEAD: Dr. Elena VOSS
PUBLICATION YEAR: 2084

Take the first letter of the first name and the
first letter of the last name (both uppercase),
then append the year.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 20, hintText: "Take the first letter of 'Elena' and the first letter of 'VOSS'." },
      { order: 2, coinCost: 40, hintText: 'E + V combined with year 2084 = EV2084' },
    ],
  },

  {
    title: 'SCIENCE ARCHIVE ACCESS',
    difficulty: 'HARD' as const,
    timeLimit: 60,
    answer: 'MK2119',
    clueText: `[SCIENCE DIVISION — CLASSIFIED ARCHIVE]
DATE: 2157.04.18

The archive passphrase is derived from the lead
scientist's initials and the year of their research.

LEAD SCIENTIST: Dr. Marcus KWAN
RESEARCH YEAR: 2119

Combine the initials of the first and last name
(uppercase) with the research year.

[END OF ARCHIVE LOG]`,
    hints: [
      { order: 1, coinCost: 20, hintText: "Take the first letter of 'Marcus' and the first letter of 'KWAN'." },
      { order: 2, coinCost: 40, hintText: 'M + K combined with year 2119 = MK2119' },
    ],
  },

  // Technique 2: Combine agent codename with coordinate values (e.g. RAVEN + 47N = RAVEN47)

  {
    title: 'FIELD EXTRACTION CODE',
    difficulty: 'HARD' as const,
    timeLimit: 60,
    answer: 'RAVEN47',
    clueText: `[FIELD OPERATIVE DISPATCH — CLASSIFIED OMEGA]
DATE: 2157.04.17

The extraction passphrase is formed by combining
the operative's codename with the numeric portion
of the extraction coordinates.

OPERATIVE CODENAME: RAVEN
EXTRACTION COORDINATES: 47N

Append only the number from the coordinates
to the codename.

[END OF DISPATCH]`,
    hints: [
      { order: 1, coinCost: 20, hintText: 'Take the codename and append only the number from the coordinates, not the letter.' },
      { order: 2, coinCost: 40, hintText: 'RAVEN + 47 (from 47N) = RAVEN47' },
    ],
  },

  {
    title: 'AGENT GRID PASSPHRASE',
    difficulty: 'HARD' as const,
    timeLimit: 60,
    answer: 'FALCON83',
    clueText: `[COVERT OPS — GRID PASSPHRASE PROTOCOL]
DATE: 2157.04.19

Agent grid passphrases are formed from the agent
codename followed by the numeric grid value only.

AGENT CODENAME: FALCON
GRID COORDINATE: 83S

Strip the directional letter and append the number
directly to the codename.

[END OF DISPATCH]`,
    hints: [
      { order: 1, coinCost: 20, hintText: 'Use only the number from 83S, not the S direction letter.' },
      { order: 2, coinCost: 40, hintText: 'FALCON + 83 (from 83S) = FALCON83' },
    ],
  },

  // Technique 3: Increment numbers inside expired passwords

  {
    title: 'CREDENTIAL INCREMENT',
    difficulty: 'HARD' as const,
    timeLimit: 60,
    answer: 'VECTOR17',
    clueText: `[SYSTEM CREDENTIAL AUDIT — CLASSIFIED]
DATE: 2157.04.17

The following credential has expired and must be
incremented to generate the new passphrase.

EXPIRED CREDENTIAL: VECTOR02
INCREMENT VALUE: 15

Replace the numeric suffix with the result of
adding the increment value to it.

[END OF AUDIT]`,
    hints: [
      { order: 1, coinCost: 20, hintText: 'Add 15 to the number 02 in the expired credential.' },
      { order: 2, coinCost: 40, hintText: '02 + 15 = 17, so the new credential is VECTOR17' },
    ],
  },

  {
    title: 'EXPIRED ACCESS KEY',
    difficulty: 'HARD' as const,
    timeLimit: 60,
    answer: 'NEXUS23',
    clueText: `[CREDENTIAL ROTATION LOG — PRIORITY ALPHA]
DATE: 2157.04.20

Expired credentials must be rotated by adding the
increment value to the numeric suffix.

EXPIRED CREDENTIAL: NEXUS01
INCREMENT VALUE: 22

Add the increment to the existing number to produce
the new active passphrase.

[END OF LOG]`,
    hints: [
      { order: 1, coinCost: 20, hintText: 'Add 22 to the number 01 in the expired credential.' },
      { order: 2, coinCost: 40, hintText: '01 + 22 = 23, so the updated credential is NEXUS23' },
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
