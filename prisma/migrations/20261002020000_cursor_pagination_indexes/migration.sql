CREATE INDEX "Client_agencyId_createdAt_id_idx"
ON "Client" ("agencyId", "createdAt", "id");

CREATE INDEX "Action_agencyId_priority_createdAt_id_idx"
ON "Action" ("agencyId", "priority", "createdAt", "id");

CREATE INDEX "VisibilitySnapshot_agencyId_clientId_recordedAt_id_idx"
ON "VisibilitySnapshot" ("agencyId", "clientId", "recordedAt", "id");
