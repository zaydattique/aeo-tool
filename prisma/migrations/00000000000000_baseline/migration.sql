-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'AGENCY_OWNER', 'AGENCY_MEMBER');

-- CreateEnum
CREATE TYPE "AgencyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'SCANNING', 'ERROR', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ScanStage" AS ENUM ('QUEUED', 'CRAWL', 'EXTRACT', 'AI_ANALYSIS', 'ACTION_GENERATION', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "VisibilityJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "ActionPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ActionCategory" AS ENUM ('TECHNICAL', 'CONTENT', 'SCHEMA', 'ENTITY', 'AUTHORITY', 'PERFORMANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ActionEffort" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "BillingRegion" AS ENUM ('PAKISTAN', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('ENABLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "MetricState" AS ENUM ('LIVE', 'CACHED', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "MetricConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('WEBSITE', 'AI_RESPONSE', 'CITATION', 'SEARCH_RESULT', 'BUSINESS_PROFILE', 'DOCUMENT', 'MANUAL');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" "BillingRegion" NOT NULL,
    "priceMonthly" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "maxClients" INTEGER NOT NULL,
    "maxScansPerMonth" INTEGER NOT NULL,
    "maxTrackedPrompts" INTEGER NOT NULL,
    "maxTeamSeats" INTEGER NOT NULL,
    "whiteLabel" BOOLEAN NOT NULL DEFAULT false,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandColors" JSONB,
    "status" "AgencyStatus" NOT NULL DEFAULT 'TRIAL',
    "billingRegion" "BillingRegion" NOT NULL DEFAULT 'PAKISTAN',
    "planId" TEXT,
    "stripeCustomerId" TEXT,
    "createdBySuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "fullName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'AGENCY_MEMBER',
    "agencyId" TEXT,
    "avatarUrl" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "emailVerified" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecretCiphertext" TEXT,
    "mfaSetupTokenHash" TEXT,
    "mfaSetupExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "brandName" TEXT,
    "location" TEXT,
    "keywords" TEXT[],
    "competitors" TEXT[],
    "currentVisibilityScore" INTEGER,
    "lastScannedAt" TIMESTAMP(3),
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "rescanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rescanIntervalDays" INTEGER NOT NULL DEFAULT 7,
    "nextRescanAt" TIMESTAMP(3),
    "portalTokenHash" TEXT,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'QUEUED',
    "stage" "ScanStage" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "rawCrawlData" JSONB,
    "aiAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scanId" TEXT,
    "priority" "ActionPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "ActionCategory" NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "effortLevel" "ActionEffort" NOT NULL DEFAULT 'MEDIUM',
    "suggestedText" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'TODO',
    "assignedToId" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedPrompt" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "kind" TEXT NOT NULL DEFAULT 'brand',
    "targetName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TrackedPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisibilitySnapshot" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "jobId" TEXT,
    "score" DECIMAL(5,2) NOT NULL,
    "sources" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisibilitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisibilityJob" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "VisibilityJobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "promptCount" INTEGER NOT NULL DEFAULT 0,
    "opsReserved" INTEGER NOT NULL DEFAULT 0,
    "opsConsumed" INTEGER NOT NULL DEFAULT 0,
    "usageMeterId" TEXT,
    "usageSettled" BOOLEAN NOT NULL DEFAULT false,
    "liveEngineCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "activeClientKey" TEXT,
    "errorMessage" TEXT,
    "resultSummary" JSONB,
    "actorId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisibilityJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "generatedById" TEXT,
    "config" JSONB,
    "pdfUrl" TEXT,
    "liveLinkTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENCY_MEMBER',
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyId" TEXT,
    "tokenId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "agencyId" TEXT,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "targetType" TEXT,
    "targetId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaRecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageMeter" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "clientsCount" INTEGER NOT NULL DEFAULT 0,
    "scansUsed" INTEGER NOT NULL DEFAULT 0,
    "promptsUsed" INTEGER NOT NULL DEFAULT 0,
    "reportsGenerated" INTEGER NOT NULL DEFAULT 0,
    "visibilityOpsUsed" INTEGER NOT NULL DEFAULT 0,
    "visibilityOpsReserved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "ProviderStatus" NOT NULL DEFAULT 'DISABLED',
    "model" TEXT,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "concurrencyLimit" INTEGER NOT NULL DEFAULT 4,
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 60,
    "monthlyBudgetCents" INTEGER,
    "encryptedCredential" TEXT,
    "credentialFingerprint" TEXT,
    "lastTestAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCredentialRotation" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "rotatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "ProviderCredentialRotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderUsageEvent" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "agencyId" TEXT,
    "clientId" TEXT,
    "feature" TEXT NOT NULL,
    "model" TEXT,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "provider" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "fromAddress" TEXT,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "providerId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "aggregation" TEXT NOT NULL,
    "timeWindow" TEXT NOT NULL,
    "confidenceMethod" TEXT NOT NULL,
    "displayFormat" TEXT NOT NULL,
    "methodologyVersion" TEXT NOT NULL DEFAULT '1.0',
    "engineApplicability" JSONB,
    "requiredInputs" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricObservation" (
    "id" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "value" DECIMAL(18,6) NOT NULL,
    "state" "MetricState" NOT NULL DEFAULT 'LIVE',
    "confidence" "MetricConfidence" NOT NULL DEFAULT 'MEDIUM',
    "engine" TEXT,
    "country" TEXT,
    "language" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "sourceSnapshotId" TEXT,
    "methodologyVersion" TEXT NOT NULL,
    "inputsHash" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT,

    CONSTRAINT "MetricObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandProfile" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "aliases" JSONB NOT NULL,
    "description" TEXT,
    "products" JSONB NOT NULL,
    "services" JSONB NOT NULL,
    "locations" JSONB NOT NULL,
    "competitors" JSONB NOT NULL,
    "approvedFacts" JSONB NOT NULL,
    "disallowedClaims" JSONB NOT NULL,
    "sourceUrls" JSONB NOT NULL,
    "methodologyVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandEvidence" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "sourceUrl" TEXT,
    "title" TEXT,
    "contentHash" TEXT NOT NULL,
    "extractedFacts" JSONB NOT NULL,
    "confidence" "MetricConfidence" NOT NULL DEFAULT 'MEDIUM',
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "methodologyVersion" TEXT NOT NULL,

    CONSTRAINT "BrandEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE INDEX "Plan_region_isActive_idx" ON "Plan"("region", "isActive");

-- CreateIndex
CREATE INDEX "Plan_slug_idx" ON "Plan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");

-- CreateIndex
CREATE INDEX "Agency_status_idx" ON "Agency"("status");

-- CreateIndex
CREATE INDEX "Agency_deletedAt_idx" ON "Agency"("deletedAt");

-- CreateIndex
CREATE INDEX "Agency_planId_idx" ON "Agency"("planId");

-- CreateIndex
CREATE INDEX "Agency_stripeCustomerId_idx" ON "Agency"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_mfaSetupTokenHash_key" ON "User"("mfaSetupTokenHash");

-- CreateIndex
CREATE INDEX "User_agencyId_idx" ON "User"("agencyId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_passwordResetToken_idx" ON "User"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Client_portalTokenHash_key" ON "Client"("portalTokenHash");

-- CreateIndex
CREATE INDEX "Client_agencyId_idx" ON "Client"("agencyId");

-- CreateIndex
CREATE INDEX "Client_agencyId_deletedAt_idx" ON "Client"("agencyId", "deletedAt");

-- CreateIndex
CREATE INDEX "Client_agencyId_createdAt_id_idx" ON "Client"("agencyId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_lastScannedAt_idx" ON "Client"("lastScannedAt");

-- CreateIndex
CREATE INDEX "Client_rescanEnabled_nextRescanAt_idx" ON "Client"("rescanEnabled", "nextRescanAt");

-- CreateIndex
CREATE INDEX "Client_portalTokenHash_idx" ON "Client"("portalTokenHash");

-- CreateIndex
CREATE INDEX "Scan_agencyId_idx" ON "Scan"("agencyId");

-- CreateIndex
CREATE INDEX "Scan_clientId_idx" ON "Scan"("clientId");

-- CreateIndex
CREATE INDEX "Scan_agencyId_status_idx" ON "Scan"("agencyId", "status");

-- CreateIndex
CREATE INDEX "Scan_status_createdAt_idx" ON "Scan"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_status_startedAt_idx" ON "Scan"("status", "startedAt");

-- CreateIndex
CREATE INDEX "Scan_agencyId_createdAt_status_idx" ON "Scan"("agencyId", "createdAt", "status");

-- CreateIndex
CREATE INDEX "Scan_clientId_status_createdAt_idx" ON "Scan"("clientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Action_agencyId_idx" ON "Action"("agencyId");

-- CreateIndex
CREATE INDEX "Action_clientId_idx" ON "Action"("clientId");

-- CreateIndex
CREATE INDEX "Action_agencyId_status_idx" ON "Action"("agencyId", "status");

-- CreateIndex
CREATE INDEX "Action_agencyId_status_createdAt_idx" ON "Action"("agencyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Action_agencyId_priority_createdAt_id_idx" ON "Action"("agencyId", "priority", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Action_assignedToId_idx" ON "Action"("assignedToId");

-- CreateIndex
CREATE INDEX "Action_scanId_idx" ON "Action"("scanId");

-- CreateIndex
CREATE INDEX "Action_deletedAt_idx" ON "Action"("deletedAt");

-- CreateIndex
CREATE INDEX "TrackedPrompt_agencyId_idx" ON "TrackedPrompt"("agencyId");

-- CreateIndex
CREATE INDEX "TrackedPrompt_clientId_idx" ON "TrackedPrompt"("clientId");

-- CreateIndex
CREATE INDEX "TrackedPrompt_agencyId_clientId_idx" ON "TrackedPrompt"("agencyId", "clientId");

-- CreateIndex
CREATE INDEX "TrackedPrompt_kind_idx" ON "TrackedPrompt"("kind");

-- CreateIndex
CREATE INDEX "TrackedPrompt_deletedAt_idx" ON "TrackedPrompt"("deletedAt");

-- CreateIndex
CREATE INDEX "VisibilitySnapshot_agencyId_idx" ON "VisibilitySnapshot"("agencyId");

-- CreateIndex
CREATE INDEX "VisibilitySnapshot_clientId_idx" ON "VisibilitySnapshot"("clientId");

-- CreateIndex
CREATE INDEX "VisibilitySnapshot_promptId_idx" ON "VisibilitySnapshot"("promptId");

-- CreateIndex
CREATE INDEX "VisibilitySnapshot_jobId_idx" ON "VisibilitySnapshot"("jobId");

-- CreateIndex
CREATE INDEX "VisibilitySnapshot_agencyId_clientId_recordedAt_id_idx" ON "VisibilitySnapshot"("agencyId", "clientId", "recordedAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "VisibilitySnapshot_jobId_promptId_key" ON "VisibilitySnapshot"("jobId", "promptId");

-- CreateIndex
CREATE INDEX "VisibilityJob_agencyId_idx" ON "VisibilityJob"("agencyId");

-- CreateIndex
CREATE INDEX "VisibilityJob_clientId_idx" ON "VisibilityJob"("clientId");

-- CreateIndex
CREATE INDEX "VisibilityJob_agencyId_status_idx" ON "VisibilityJob"("agencyId", "status");

-- CreateIndex
CREATE INDEX "VisibilityJob_agencyId_status_createdAt_idx" ON "VisibilityJob"("agencyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "VisibilityJob_status_createdAt_idx" ON "VisibilityJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "VisibilityJob_clientId_status_idx" ON "VisibilityJob"("clientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VisibilityJob_agencyId_idempotencyKey_key" ON "VisibilityJob"("agencyId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "VisibilityJob_activeClientKey_key" ON "VisibilityJob"("activeClientKey");

-- CreateIndex
CREATE UNIQUE INDEX "Report_liveLinkTokenHash_key" ON "Report"("liveLinkTokenHash");

-- CreateIndex
CREATE INDEX "Report_agencyId_idx" ON "Report"("agencyId");

-- CreateIndex
CREATE INDEX "Report_agencyId_deletedAt_createdAt_idx" ON "Report"("agencyId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Report_clientId_idx" ON "Report"("clientId");

-- CreateIndex
CREATE INDEX "Report_liveLinkTokenHash_idx" ON "Report"("liveLinkTokenHash");

-- CreateIndex
CREATE INDEX "Report_deletedAt_idx" ON "Report"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_tokenHash_key" ON "TeamInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "TeamInvite_agencyId_idx" ON "TeamInvite"("agencyId");

-- CreateIndex
CREATE INDEX "TeamInvite_tokenHash_idx" ON "TeamInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "TeamInvite_email_idx" ON "TeamInvite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_agencyId_email_key" ON "TeamInvite"("agencyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenId_key" ON "UserSession"("tokenId");

-- CreateIndex
CREATE INDEX "UserSession_userId_revokedAt_expiresAt_idx" ON "UserSession"("userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_agencyId_createdAt_idx" ON "UserSession"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_agencyId_createdAt_idx" ON "SecurityEvent"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_createdAt_idx" ON "SecurityEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_severity_createdAt_idx" ON "SecurityEvent"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_targetType_targetId_idx" ON "SecurityEvent"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "MfaRecoveryCode_codeHash_key" ON "MfaRecoveryCode"("codeHash");

-- CreateIndex
CREATE INDEX "MfaRecoveryCode_userId_usedAt_idx" ON "MfaRecoveryCode"("userId", "usedAt");

-- CreateIndex
CREATE INDEX "ActivityLog_agencyId_idx" ON "ActivityLog"("agencyId");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");

-- CreateIndex
CREATE INDEX "ActivityLog_agencyId_createdAt_idx" ON "ActivityLog"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_resourceType_resourceId_idx" ON "ActivityLog"("resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeEvent_eventId_key" ON "StripeEvent"("eventId");

-- CreateIndex
CREATE INDEX "StripeEvent_eventType_receivedAt_idx" ON "StripeEvent"("eventType", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_agencyId_idx" ON "Subscription"("agencyId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "UsageMeter_agencyId_idx" ON "UsageMeter"("agencyId");

-- CreateIndex
CREATE INDEX "UsageMeter_periodStart_idx" ON "UsageMeter"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "UsageMeter_agencyId_periodStart_key" ON "UsageMeter"("agencyId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderConfig_provider_key" ON "ProviderConfig"("provider");

-- CreateIndex
CREATE INDEX "ProviderConfig_status_idx" ON "ProviderConfig"("status");

-- CreateIndex
CREATE INDEX "ProviderConfig_lastTestStatus_lastTestAt_idx" ON "ProviderConfig"("lastTestStatus", "lastTestAt");

-- CreateIndex
CREATE INDEX "ProviderCredentialRotation_providerId_createdAt_idx" ON "ProviderCredentialRotation"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderCredentialRotation_rotatedById_createdAt_idx" ON "ProviderCredentialRotation"("rotatedById", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderUsageEvent_providerId_createdAt_idx" ON "ProviderUsageEvent"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderUsageEvent_agencyId_createdAt_idx" ON "ProviderUsageEvent"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderUsageEvent_clientId_createdAt_idx" ON "ProviderUsageEvent"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderUsageEvent_feature_createdAt_idx" ON "ProviderUsageEvent"("feature", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_slug_key" ON "EmailTemplate"("slug");

-- CreateIndex
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "EmailDelivery_status_createdAt_idx" ON "EmailDelivery"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailDelivery_toAddress_createdAt_idx" ON "EmailDelivery"("toAddress", "createdAt");

-- CreateIndex
CREATE INDEX "EmailDelivery_provider_createdAt_idx" ON "EmailDelivery"("provider", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDefinition_slug_key" ON "MetricDefinition"("slug");

-- CreateIndex
CREATE INDEX "MetricDefinition_category_isActive_idx" ON "MetricDefinition"("category", "isActive");

-- CreateIndex
CREATE INDEX "MetricObservation_agencyId_clientId_observedAt_id_idx" ON "MetricObservation"("agencyId", "clientId", "observedAt", "id");

-- CreateIndex
CREATE INDEX "MetricObservation_clientId_metricId_observedAt_idx" ON "MetricObservation"("clientId", "metricId", "observedAt");

-- CreateIndex
CREATE INDEX "MetricObservation_metricId_observedAt_idx" ON "MetricObservation"("metricId", "observedAt");

-- CreateIndex
CREATE INDEX "MetricObservation_sourceSnapshotId_idx" ON "MetricObservation"("sourceSnapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandProfile_clientId_key" ON "BrandProfile"("clientId");

-- CreateIndex
CREATE INDEX "BrandProfile_agencyId_idx" ON "BrandProfile"("agencyId");

-- CreateIndex
CREATE INDEX "BrandEvidence_agencyId_clientId_observedAt_idx" ON "BrandEvidence"("agencyId", "clientId", "observedAt");

-- CreateIndex
CREATE INDEX "BrandEvidence_clientId_type_observedAt_idx" ON "BrandEvidence"("clientId", "type", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BrandEvidence_clientId_contentHash_key" ON "BrandEvidence"("clientId", "contentHash");

-- AddForeignKey
ALTER TABLE "Agency" ADD CONSTRAINT "Agency_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedPrompt" ADD CONSTRAINT "TrackedPrompt_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedPrompt" ADD CONSTRAINT "TrackedPrompt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibilitySnapshot" ADD CONSTRAINT "VisibilitySnapshot_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibilitySnapshot" ADD CONSTRAINT "VisibilitySnapshot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibilitySnapshot" ADD CONSTRAINT "VisibilitySnapshot_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "TrackedPrompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibilitySnapshot" ADD CONSTRAINT "VisibilitySnapshot_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "VisibilityJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibilityJob" ADD CONSTRAINT "VisibilityJob_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibilityJob" ADD CONSTRAINT "VisibilityJob_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibilityJob" ADD CONSTRAINT "VisibilityJob_usageMeterId_fkey" FOREIGN KEY ("usageMeterId") REFERENCES "UsageMeter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaRecoveryCode" ADD CONSTRAINT "MfaRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageMeter" ADD CONSTRAINT "UsageMeter_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCredentialRotation" ADD CONSTRAINT "ProviderCredentialRotation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCredentialRotation" ADD CONSTRAINT "ProviderCredentialRotation_rotatedById_fkey" FOREIGN KEY ("rotatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUsageEvent" ADD CONSTRAINT "ProviderUsageEvent_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUsageEvent" ADD CONSTRAINT "ProviderUsageEvent_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUsageEvent" ADD CONSTRAINT "ProviderUsageEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "MetricDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandEvidence" ADD CONSTRAINT "BrandEvidence_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandEvidence" ADD CONSTRAINT "BrandEvidence_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

