CREATE INDEX "Scan_status_startedAt_idx"
ON "Scan" ("status", "startedAt");

CREATE INDEX "Scan_agencyId_createdAt_status_idx"
ON "Scan" ("agencyId", "createdAt", "status");
