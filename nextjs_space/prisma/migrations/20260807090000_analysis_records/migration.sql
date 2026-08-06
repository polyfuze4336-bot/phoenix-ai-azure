-- Phoenix AI - retained HCP AI wound-analysis records.
-- Matches prisma/schema.prisma model AnalysisRecord.
-- Applied via a controlled step ("prisma migrate deploy"), never a destructive reset.

-- CreateTable
CREATE TABLE "AnalysisRecord" (
    "id" TEXT NOT NULL,
    "clinicianName" TEXT,
    "clinicianEmail" TEXT,
    "imageKey" TEXT,
    "imageMimeType" TEXT,
    "woundCategory" TEXT,
    "woundType" TEXT,
    "burnDegree" TEXT,
    "severity" TEXT,
    "confidence" TEXT,
    "tbsaEstimate" TEXT,
    "isBurn" BOOLEAN NOT NULL DEFAULT false,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisRecord_createdAt_idx" ON "AnalysisRecord"("createdAt");
