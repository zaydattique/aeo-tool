CREATE TABLE "CrawlRun" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "scanId" TEXT,
  "startUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "pagesCrawled" INTEGER NOT NULL DEFAULT 0,
  "pagesFailed" INTEGER NOT NULL DEFAULT 0,
  "linksDiscovered" INTEGER NOT NULL DEFAULT 0,
  "maxPages" INTEGER NOT NULL,
  "maxDepth" INTEGER NOT NULL,
  "durationMs" INTEGER,
  "robotsAllowed" BOOLEAN,
  "sitemapFound" BOOLEAN NOT NULL DEFAULT false,
  "llmsTxtFound" BOOLEAN NOT NULL DEFAULT false,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "methodologyVersion" TEXT NOT NULL DEFAULT '5.0',
  CONSTRAINT "CrawlRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CrawlRun_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CrawlRun_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CrawlRun_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "CrawlPage" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "canonicalUrl" TEXT,
  "finalUrl" TEXT,
  "depth" INTEGER NOT NULL,
  "statusCode" INTEGER,
  "responseMs" INTEGER,
  "responseBytes" INTEGER,
  "contentType" TEXT,
  "title" TEXT,
  "metaDescription" TEXT,
  "h1Count" INTEGER NOT NULL DEFAULT 0,
  "h2Count" INTEGER NOT NULL DEFAULT 0,
  "wordCount" INTEGER NOT NULL DEFAULT 0,
  "internalLinks" INTEGER NOT NULL DEFAULT 0,
  "externalLinks" INTEGER NOT NULL DEFAULT 0,
  "indexable" BOOLEAN,
  "robotsNoindex" BOOLEAN,
  "pageType" TEXT,
  "duplicateHash" TEXT,
  "structuredData" JSONB,
  "entitySignals" JSONB,
  "contentSignals" JSONB,
  "technicalSignals" JSONB,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrawlPage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CrawlPage_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CrawlRun"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CrawlPage_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CrawlPage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "CrawlIssue" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "pageId" TEXT,
  "agencyId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrawlIssue_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CrawlIssue_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CrawlRun"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CrawlIssue_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CrawlPage"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CrawlIssue_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CrawlIssue_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CrawlRun_scanId_key" ON "CrawlRun"("scanId");
CREATE INDEX "CrawlRun_agencyId_clientId_startedAt_id_idx" ON "CrawlRun"("agencyId","clientId","startedAt","id");
CREATE INDEX "CrawlRun_clientId_status_startedAt_idx" ON "CrawlRun"("clientId","status","startedAt");
CREATE UNIQUE INDEX "CrawlPage_runId_url_key" ON "CrawlPage"("runId","url");
CREATE INDEX "CrawlPage_agencyId_clientId_fetchedAt_id_idx" ON "CrawlPage"("agencyId","clientId","fetchedAt","id");
CREATE INDEX "CrawlPage_clientId_statusCode_idx" ON "CrawlPage"("clientId","statusCode");
CREATE INDEX "CrawlPage_clientId_duplicateHash_idx" ON "CrawlPage"("clientId","duplicateHash");
CREATE INDEX "CrawlPage_runId_depth_id_idx" ON "CrawlPage"("runId","depth","id");
CREATE INDEX "CrawlIssue_agencyId_clientId_severity_createdAt_id_idx" ON "CrawlIssue"("agencyId","clientId","severity","createdAt","id");
CREATE INDEX "CrawlIssue_runId_severity_code_idx" ON "CrawlIssue"("runId","severity","code");
CREATE INDEX "CrawlIssue_pageId_idx" ON "CrawlIssue"("pageId");