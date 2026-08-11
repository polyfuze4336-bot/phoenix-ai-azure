-- Phoenix AI - initial schema for Azure Database for PostgreSQL Flexible Server.
-- Matches prisma/schema.prisma (models Case, ChatMessage, Article).
-- Applied via a controlled step ("prisma migrate deploy"), never a destructive reset.

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "burnDegree" TEXT,
    "severity" TEXT NOT NULL,
    "tbsaPercent" DOUBLE PRECISION,
    "bodyRegion" TEXT,
    "confidence" DOUBLE PRECISION,
    "ageGroup" TEXT,
    "outcome" TEXT,
    "characteristics" TEXT,
    "recommendations" TEXT,
    "imageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageKey" TEXT,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleBm" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "contentBm" TEXT NOT NULL,
    "summaryEn" TEXT NOT NULL,
    "summaryBm" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Case_caseType_idx" ON "Case"("caseType");

-- CreateIndex
CREATE INDEX "Case_createdAt_idx" ON "Case"("createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- CreateIndex
CREATE INDEX "ChatMessage_portal_idx" ON "ChatMessage"("portal");

-- CreateIndex
CREATE INDEX "Article_category_idx" ON "Article"("category");
