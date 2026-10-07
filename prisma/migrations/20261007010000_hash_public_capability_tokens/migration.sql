-- Hash bearer-style public capability tokens before storing them.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "Client" RENAME COLUMN "portalToken" TO "portalTokenHash";
ALTER TABLE "Report" RENAME COLUMN "liveLinkToken" TO "liveLinkTokenHash";
ALTER TABLE "TeamInvite" RENAME COLUMN "token" TO "tokenHash";

UPDATE "Client"
SET "portalTokenHash" = encode(digest("portalTokenHash", 'sha256'), 'hex')
WHERE "portalTokenHash" IS NOT NULL;

UPDATE "Report"
SET "liveLinkTokenHash" = encode(digest("liveLinkTokenHash", 'sha256'), 'hex')
WHERE "liveLinkTokenHash" IS NOT NULL;

UPDATE "TeamInvite"
SET "tokenHash" = encode(digest("tokenHash", 'sha256'), 'hex')
WHERE "tokenHash" IS NOT NULL;

DROP INDEX IF EXISTS "Client_portalToken_key";
DROP INDEX IF EXISTS "Report_liveLinkToken_key";
DROP INDEX IF EXISTS "TeamInvite_token_key";
DROP INDEX IF EXISTS "Client_portalToken_idx";
DROP INDEX IF EXISTS "Report_liveLinkToken_idx";
DROP INDEX IF EXISTS "TeamInvite_token_idx";

CREATE UNIQUE INDEX "Client_portalTokenHash_key" ON "Client"("portalTokenHash");
CREATE UNIQUE INDEX "Report_liveLinkTokenHash_key" ON "Report"("liveLinkTokenHash");
CREATE UNIQUE INDEX "TeamInvite_tokenHash_key" ON "TeamInvite"("tokenHash");
CREATE INDEX "Client_portalTokenHash_idx" ON "Client"("portalTokenHash");
CREATE INDEX "Report_liveLinkTokenHash_idx" ON "Report"("liveLinkTokenHash");
CREATE INDEX "TeamInvite_tokenHash_idx" ON "TeamInvite"("tokenHash");
