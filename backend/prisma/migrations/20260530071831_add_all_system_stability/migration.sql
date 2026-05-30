-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coins" INTEGER NOT NULL DEFAULT 100,
    "securityStability" INTEGER NOT NULL DEFAULT 100,
    "powerStability" INTEGER NOT NULL DEFAULT 100,
    "reactorStability" INTEGER NOT NULL DEFAULT 100,
    "communicationStability" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GameState" ("coins", "createdAt", "id", "securityStability", "updatedAt") SELECT "coins", "createdAt", "id", "securityStability", "updatedAt" FROM "GameState";
DROP TABLE "GameState";
ALTER TABLE "new_GameState" RENAME TO "GameState";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
