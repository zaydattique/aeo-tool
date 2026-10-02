-- Prevent duplicate queued/running scans for the same client even when
-- multiple app instances admit requests concurrently.
CREATE UNIQUE INDEX "Scan_one_active_per_client"
ON "Scan" ("clientId")
WHERE "status" IN ('QUEUED', 'RUNNING');
