-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "maxQuestions" INTEGER NOT NULL,
    "timeLimitMin" INTEGER NOT NULL,
    "topics" TEXT NOT NULL,
    "resumeText" TEXT,
    "jdText" TEXT,
    "resumeFileName" TEXT,
    "jdFileName" TEXT,
    "candidateName" TEXT,
    "candidateEmail" TEXT,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "messages" TEXT,
    "report" TEXT,
    "durationSec" INTEGER,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Interview_token_key" ON "Interview"("token");
