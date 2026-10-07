-- Phase 4: normalized AI visibility evidence and immutable engine observations.

CREATE TABLE "AIResponse" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "engine" TEXT NOT NULL,
  "model" TEXT,
  "state" "MetricState" NOT NULL DEFAULT 'LIVE',
  "confidence" "MetricConfidence" NOT NULL DEFAULT 'MEDIUM',
  "country" TEXT,
  "language" TEXT,
  "answerText" TEXT NOT NULL,
  "answerHash" TEXT NOT NULL,
  "citationsExtracted" INTEGER NOT NULL DEFAULT 0,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "methodologyVersion" TEXT NOT NULL,
  CONSTRAINT "AIResponse_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AIResponse_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AIResponse_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AIResponse_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "TrackedPrompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AIResponse_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "VisibilitySnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "CitationEvidence" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "responseId" TEXT NOT NULL,
  "engine" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "position" INTEGER,
  "title" TEXT,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "contentHash" TEXT NOT NULL,
  CONSTRAINT "CitationEvidence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CitationEvidence_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CitationEvidence_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CitationEvidence_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "TrackedPrompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CitationEvidence_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "AIResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PromptEngineObservation" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "responseId" TEXT,
  "engine" TEXT NOT NULL,
  "state" "MetricState" NOT NULL DEFAULT 'LIVE',
  "confidence" "MetricConfidence" NOT NULL DEFAULT 'MEDIUM',
  "score" DECIMAL(5,2) NOT NULL,
  "mentioned" BOOLEAN NOT NULL DEFAULT false,
  "recommended" BOOLEAN NOT NULL DEFAULT false,
  "competitorMentioned" BOOLEAN NOT NULL DEFAULT false,
  "answerPosition" INTEGER,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "methodologyVersion" TEXT NOT NULL,
  CONSTRAINT "PromptEngineObservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromptEngineObservation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PromptEngineObservation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PromptEngineObservation_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "TrackedPrompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PromptEngineObservation_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "VisibilitySnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PromptEngineObservation_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "AIResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AIResponse_snapshotId_engine_key" ON "AIResponse"("snapshotId", "engine");
CREATE INDEX "AIResponse_agencyId_clientId_observedAt_id_idx" ON "AIResponse"("agencyId","clientId","observedAt","id");
CREATE INDEX "AIResponse_clientId_promptId_engine_observedAt_idx" ON "AIResponse"("clientId","promptId","engine","observedAt");
CREATE INDEX "AIResponse_engine_observedAt_idx" ON "AIResponse"("engine","observedAt");
CREATE INDEX "AIResponse_answerHash_idx" ON "AIResponse"("answerHash");

CREATE UNIQUE INDEX "CitationEvidence_responseId_url_key" ON "CitationEvidence"("responseId","url");
CREATE INDEX "CitationEvidence_agencyId_clientId_observedAt_id_idx" ON "CitationEvidence"("agencyId","clientId","observedAt","id");
CREATE INDEX "CitationEvidence_clientId_engine_domain_observedAt_idx" ON "CitationEvidence"("clientId","engine","domain","observedAt");
CREATE INDEX "CitationEvidence_domain_observedAt_idx" ON "CitationEvidence"("domain","observedAt");

CREATE UNIQUE INDEX "PromptEngineObservation_snapshotId_engine_key" ON "PromptEngineObservation"("snapshotId","engine");
CREATE INDEX "PromptEngineObservation_agencyId_clientId_observedAt_id_idx" ON "PromptEngineObservation"("agencyId","clientId","observedAt","id");
CREATE INDEX "PromptEngineObservation_clientId_promptId_engine_observedAt_idx" ON "PromptEngineObservation"("clientId","promptId","engine","observedAt");
CREATE INDEX "PromptEngineObservation_engine_observedAt_idx" ON "PromptEngineObservation"("engine","observedAt");

-- Evidence is append-only. The application never updates or deletes these records.
CREATE OR REPLACE FUNCTION prevent_phase4_evidence_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'PHASE4_EVIDENCE_IMMUTABLE';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_response_immutable
BEFORE UPDATE ON "AIResponse"
FOR EACH ROW EXECUTE FUNCTION prevent_phase4_evidence_mutation();

CREATE TRIGGER citation_evidence_immutable
BEFORE UPDATE ON "CitationEvidence"
FOR EACH ROW EXECUTE FUNCTION prevent_phase4_evidence_mutation();

CREATE TRIGGER prompt_engine_observation_immutable
BEFORE UPDATE ON "PromptEngineObservation"
FOR EACH ROW EXECUTE FUNCTION prevent_phase4_evidence_mutation();
