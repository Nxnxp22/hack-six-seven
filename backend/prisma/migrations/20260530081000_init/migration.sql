-- CreateTable
CREATE TABLE "decoding_rules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "difficulty" TEXT NOT NULL,
    "rule_number" INTEGER NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "critical_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "difficulty" TEXT NOT NULL,
    "template" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "critical_templates_difficulty_key" ON "critical_templates"("difficulty");
