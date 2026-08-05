-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "consentAcceptedAt" TIMESTAMP(3),
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionTag" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "recommendedTestCodes" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "ConditionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConditionTag" (
    "userId" TEXT NOT NULL,
    "conditionTagId" TEXT NOT NULL,

    CONSTRAINT "UserConditionTag_pkey" PRIMARY KEY ("userId","conditionTagId")
);

-- CreateTable
CREATE TABLE "TestDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "periodicityDays" INTEGER NOT NULL DEFAULT 14,
    "category" TEXT NOT NULL DEFAULT 'screening',
    "version" INTEGER NOT NULL DEFAULT 1,
    "scoringRuleJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestQuestion" (
    "id" TEXT NOT NULL,
    "testDefinitionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "optionsJson" JSONB NOT NULL,
    "isFreeText" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testDefinitionId" TEXT NOT NULL,
    "answersCipher" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "interpretedSeverity" TEXT NOT NULL,
    "interpretedLabel" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mood" INTEGER NOT NULL,
    "sleepHours" DOUBLE PRECISION,
    "energyLevel" INTEGER,
    "notesCipher" TEXT NOT NULL DEFAULT '',
    "customFieldsJson" JSONB NOT NULL DEFAULT '{}',
    "crisisDetected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "schedule" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationLog" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "MedicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateRangeFrom" TIMESTAMP(3) NOT NULL,
    "dateRangeTo" TIMESTAMP(3) NOT NULL,
    "includedSections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shareToken" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ConditionTag_code_key" ON "ConditionTag"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TestDefinition_code_key" ON "TestDefinition"("code");

-- CreateIndex
CREATE INDEX "TestQuestion_testDefinitionId_idx" ON "TestQuestion"("testDefinitionId");

-- CreateIndex
CREATE INDEX "TestResponse_userId_testDefinitionId_idx" ON "TestResponse"("userId", "testDefinitionId");

-- CreateIndex
CREATE INDEX "TestResponse_userId_completedAt_idx" ON "TestResponse"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "DiaryEntry_userId_date_idx" ON "DiaryEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DiaryEntry_userId_date_key" ON "DiaryEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "Medication_userId_idx" ON "Medication"("userId");

-- CreateIndex
CREATE INDEX "MedicationLog_userId_takenAt_idx" ON "MedicationLog"("userId", "takenAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExportLog_shareToken_key" ON "ExportLog"("shareToken");

-- CreateIndex
CREATE INDEX "ExportLog_userId_idx" ON "ExportLog"("userId");

-- AddForeignKey
ALTER TABLE "UserConditionTag" ADD CONSTRAINT "UserConditionTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConditionTag" ADD CONSTRAINT "UserConditionTag_conditionTagId_fkey" FOREIGN KEY ("conditionTagId") REFERENCES "ConditionTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResponse" ADD CONSTRAINT "TestResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResponse" ADD CONSTRAINT "TestResponse_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "TestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationLog" ADD CONSTRAINT "MedicationLog_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationLog" ADD CONSTRAINT "MedicationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
