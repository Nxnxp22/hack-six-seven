import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.morseChallenge.deleteMany();

  await prisma.morseChallenge.createMany({
    data: [
      { word: "SOS",     category: "emergency", difficulty: "easy" },
      { word: "HELP",    category: "emergency", difficulty: "easy" },
      { word: "FIRE",    category: "emergency", difficulty: "easy" },
      { word: "SAFE",    category: "status",    difficulty: "easy" },
      { word: "MOVE",    category: "command",   difficulty: "easy" },
      { word: "CAVE",    category: "location",  difficulty: "easy" },
      { word: "BASE",    category: "location",  difficulty: "easy" },
      { word: "FOOD",    category: "supply",    difficulty: "easy" },
      { word: "FUEL",    category: "supply",    difficulty: "easy" },
      { word: "CODE",    category: "general",   difficulty: "easy" },
      { word: "NORTH",   category: "direction", difficulty: "medium" },
      { word: "SOUTH",   category: "direction", difficulty: "medium" },
      { word: "ALERT",   category: "emergency", difficulty: "medium" },
      { word: "MEDIC",   category: "emergency", difficulty: "medium" },
      { word: "WATER",   category: "supply",    difficulty: "medium" },
      { word: "RADIO",   category: "equipment", difficulty: "medium" },
      { word: "POWER",   category: "system",    difficulty: "medium" },
      { word: "CLEAR",   category: "status",    difficulty: "medium" },
      { word: "STORM",   category: "hazard",    difficulty: "medium" },
      { word: "FLARE",   category: "equipment", difficulty: "medium" },
      { word: "BUNKER",  category: "location",  difficulty: "hard" },
      { word: "SIGNAL",  category: "general",   difficulty: "hard" },
      { word: "RESCUE",  category: "emergency", difficulty: "hard" },
      { word: "SECTOR",  category: "location",  difficulty: "hard" },
      { word: "BREACH",  category: "hazard",    difficulty: "hard" },
      { word: "ENGAGE",  category: "command",   difficulty: "hard" },
      { word: "EXTRACT", category: "command",   difficulty: "hard" },
      { word: "NUCLEAR", category: "hazard",    difficulty: "hard" },
    ],
  });

  console.log("✅ Seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });