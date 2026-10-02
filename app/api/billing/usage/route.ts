import { NextResponse } from "next/server";
import { requireAgency } from "@/lib/session";
import { getUsageSummary } from "@/lib/usage";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAgency();
  if (auth.error || !auth.agencyId) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rl = await rateLimit(`billing-usage:${auth.agencyId}`, billingUsageLimit(), billingUsageWindowMs());
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many usage requests. Try again later." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  const summary = await getUsageSummary(auth.agencyId);

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: [{ region: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json({ ...summary, plans });
}
