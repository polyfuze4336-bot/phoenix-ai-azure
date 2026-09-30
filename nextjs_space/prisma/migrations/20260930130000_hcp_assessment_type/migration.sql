-- Nullable by design: existing records remain unclassified rather than being
-- silently guessed as burn or general-wound assessments.
ALTER TABLE "AnalysisRecord" ADD COLUMN "assessmentType" TEXT;

CREATE INDEX "AnalysisRecord_assessmentType_createdAt_idx"
ON "AnalysisRecord"("assessmentType", "createdAt");
