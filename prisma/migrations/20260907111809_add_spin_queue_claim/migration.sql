-- CreateTable
CREATE TABLE "SpinQueueClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "windowIndex" INTEGER NOT NULL,
    "prizeLabel" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "claimedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SpinQueueClaim_date_windowIndex_key" ON "SpinQueueClaim"("date", "windowIndex");
