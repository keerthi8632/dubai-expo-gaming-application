-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('TRADE', 'SPIN');

-- CreateEnum
CREATE TYPE "ForcedOutcome" AS ENUM ('WIN', 'LOSE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('NOT_PLAYED', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ENGLISH', 'ARABIC');

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryOfResidence" TEXT NOT NULL,
    "doesTrade" BOOLEAN,
    "language" "Language" NOT NULL DEFAULT 'ENGLISH',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'NOT_PLAYED',
    "forcedOutcome" "ForcedOutcome",
    "forcedByAdminId" TEXT,
    "forcedAt" TIMESTAMP(3),
    "resultDetail" JSONB,
    "prizeLabel" TEXT,
    "claimCode" TEXT,
    "claimedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Participant_phone_idx" ON "Participant"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_email_key" ON "Participant"("email");

-- CreateIndex
CREATE INDEX "OtpCode_participantId_channel_idx" ON "OtpCode"("participantId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_claimCode_key" ON "GameSession"("claimCode");

-- CreateIndex
CREATE INDEX "GameSession_gameType_status_idx" ON "GameSession"("gameType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_participantId_gameType_key" ON "GameSession"("participantId", "gameType");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GameConfig_key_key" ON "GameConfig"("key");

-- AddForeignKey
ALTER TABLE "OtpCode" ADD CONSTRAINT "OtpCode_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
