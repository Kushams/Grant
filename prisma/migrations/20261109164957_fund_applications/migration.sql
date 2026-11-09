-- CreateTable
CREATE TABLE "FundApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT NOT NULL,
    "applicantType" TEXT NOT NULL,
    "story" TEXT,
    "purpose" TEXT NOT NULL,
    "useOfFunds" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "budgetSummary" TEXT NOT NULL,
    "hasConflict" BOOLEAN NOT NULL DEFAULT false,
    "conflictDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "consentAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FundApplicationNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fundApplicationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FundApplicationNote_fundApplicationId_fkey" FOREIGN KEY ("fundApplicationId") REFERENCES "FundApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ConsentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "subject" TEXT NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "applicationId" TEXT,
    "supportRequestId" TEXT,
    "fundApplicationId" TEXT,
    "acceptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ConsentRecord_fundApplicationId_fkey" FOREIGN KEY ("fundApplicationId") REFERENCES "FundApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ConsentRecord" ("acceptedAt", "applicationId", "documentVersion", "id", "subject", "supportRequestId", "userId") SELECT "acceptedAt", "applicationId", "documentVersion", "id", "subject", "supportRequestId", "userId" FROM "ConsentRecord";
DROP TABLE "ConsentRecord";
ALTER TABLE "new_ConsentRecord" RENAME TO "ConsentRecord";
CREATE INDEX "ConsentRecord_userId_idx" ON "ConsentRecord"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "FundApplication_reference_key" ON "FundApplication"("reference");

-- CreateIndex
CREATE INDEX "FundApplication_status_createdAt_idx" ON "FundApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FundApplication_email_createdAt_idx" ON "FundApplication"("email", "createdAt");

-- CreateIndex
CREATE INDEX "FundApplicationNote_fundApplicationId_createdAt_idx" ON "FundApplicationNote"("fundApplicationId", "createdAt");
