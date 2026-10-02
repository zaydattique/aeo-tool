CREATE INDEX "Client_agencyId_createdAt_idx"
ON "Client" ("agencyId", "createdAt");

CREATE INDEX "Scan_agencyId_status_createdAt_idx"
ON "Scan" ("agencyId", "status", "createdAt");

CREATE INDEX "Action_agencyId_status_createdAt_idx"
ON "Action" ("agencyId", "status", "createdAt");

CREATE INDEX "VisibilityJob_agencyId_status_createdAt_idx"
ON "VisibilityJob" ("agencyId", "status", "createdAt");

CREATE INDEX "Report_agencyId_deletedAt_createdAt_idx"
ON "Report" ("agencyId", "deletedAt", "createdAt");
