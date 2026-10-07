CREATE TYPE "MetricState" AS ENUM ('LIVE','CACHED','ESTIMATED');
CREATE TYPE "MetricConfidence" AS ENUM ('HIGH','MEDIUM','LOW');
CREATE TYPE "EvidenceType" AS ENUM ('WEBSITE','AI_RESPONSE','CITATION','SEARCH_RESULT','BUSINESS_PROFILE','DOCUMENT','MANUAL');

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
CREATE UNIQUE INDEX "MetricDefinition_slug_key" ON "MetricDefinition"("slug");
CREATE INDEX "MetricDefinition_category_isActive_idx" ON "MetricDefinition"("category","isActive");

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
CREATE INDEX "MetricObservation_agencyId_clientId_observedAt_id_idx" ON "MetricObservation"("agencyId","clientId","observedAt","id");
CREATE INDEX "MetricObservation_clientId_metricId_observedAt_idx" ON "MetricObservation"("clientId","metricId","observedAt");
CREATE INDEX "MetricObservation_metricId_observedAt_idx" ON "MetricObservation"("metricId","observedAt");
CREATE INDEX "MetricObservation_sourceSnapshotId_idx" ON "MetricObservation"("sourceSnapshotId");

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
CREATE UNIQUE INDEX "BrandProfile_clientId_key" ON "BrandProfile"("clientId");
CREATE INDEX "BrandProfile_agencyId_idx" ON "BrandProfile"("agencyId");

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
CREATE UNIQUE INDEX "BrandEvidence_clientId_contentHash_key" ON "BrandEvidence"("clientId","contentHash");
CREATE INDEX "BrandEvidence_agencyId_clientId_observedAt_idx" ON "BrandEvidence"("agencyId","clientId","observedAt");
CREATE INDEX "BrandEvidence_clientId_type_observedAt_idx" ON "BrandEvidence"("clientId","type","observedAt");

ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "MetricDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrandEvidence" ADD CONSTRAINT "BrandEvidence_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrandEvidence" ADD CONSTRAINT "BrandEvidence_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Metric observations are historical evidence, not mutable state.
CREATE OR REPLACE FUNCTION prevent_metric_observation_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'METRIC_OBSERVATION_IMMUTABLE';
END;
$$;

CREATE TRIGGER metric_observation_immutable
BEFORE UPDATE OR DELETE ON "MetricObservation"
FOR EACH ROW
EXECUTE FUNCTION prevent_metric_observation_mutation();
