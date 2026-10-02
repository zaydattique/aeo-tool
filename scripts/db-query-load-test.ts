import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const concurrency = Math.min(200, Math.max(1, Number.parseInt(process.env.LOAD_TEST_CONCURRENCY || "25", 10)));
const iterations = Math.min(10_000, Math.max(1, Number.parseInt(process.env.LOAD_TEST_ITERATIONS || "100", 10)));
const agencyId = process.env.LOAD_TEST_AGENCY_ID;
const clientId = process.env.LOAD_TEST_CLIENT_ID;

if (!agencyId || !clientId) {
  throw new Error("Set LOAD_TEST_AGENCY_ID and LOAD_TEST_CLIENT_ID before running the production query load test.");
}

async function sample() {
  const started = performance.now();
  await Promise.all([
    prisma.client.findMany({
      where: { agencyId, deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 51,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.action.findMany({
      where: { agencyId, deletedAt: null },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      take: 201,
      select: { id: true, priority: true, createdAt: true },
    }),
    prisma.visibilitySnapshot.findMany({
      where: { agencyId, clientId },
      orderBy: [{ recordedAt: "asc" }, { id: "asc" }],
      take: 501,
      select: { id: true, recordedAt: true, score: true },
    }),
  ]);
  return performance.now() - started;
}

async function main() {
  const samples: number[] = [];
  let completed = 0;
  const worker = async () => {
    while (true) {
      const n = completed++;
      if (n >= iterations) return;
      samples.push(await sample());
    }
  };

  const started = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  samples.sort((a, b) => a - b);
  const percentile = (p: number) => samples[Math.min(samples.length - 1, Math.floor(samples.length * p))] ?? 0;
  console.log(JSON.stringify({
    iterations,
    concurrency,
    totalMs: Math.round(performance.now() - started),
    p50Ms: Math.round(percentile(0.50)),
    p95Ms: Math.round(percentile(0.95)),
    p99Ms: Math.round(percentile(0.99)),
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
