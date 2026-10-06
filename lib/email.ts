/**
 * Transactional email.
 * Primary: Resend when RESEND_API_KEY is set.
 * Fallback: console.log (dev / no key).
 */

import { prisma } from "@/lib/prisma";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(
  input: SendEmailInput
): Promise<{ ok: boolean; id?: string; mode: "resend" | "console" }> {
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const { getProviderRuntime } = await import("./provider-control");
  const resendRuntime = await getProviderRuntime("resend");
  const from = process.env.EMAIL_FROM || "Threezero AEO <onboarding@resend.dev>";
  const delivery = await prisma.emailDelivery.create({ data: { provider: resendRuntime ? "resend" : "console", toAddress: to.join(","), fromAddress: from, subject: input.subject, status: "QUEUED" } });

  if (resendRuntime) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendRuntime.credential);
      const result = await resend.emails.send({
        from,
        to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
      if (result.error) {
        console.error("[email] Resend error:", result.error);
        await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: "FAILED", error: result.error.message } });
        await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: "FAILED", error: err instanceof Error ? err.message : "Resend failed" } });
      return { ok: false, mode: "resend" };
      }
      await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", providerId: result.data?.id ?? null, sentAt: new Date() } });
      return { ok: true, id: result.data?.id, mode: "resend" };
    } catch (err) {
      console.error("[email] Resend failed:", err);
      return { ok: false, mode: "resend" };
    }
  }

  console.log("[email:console]", {
    from,
    to,
    subject: input.subject,
    text: input.text || input.html.replace(/<[^>]+>/g, " ").slice(0, 500),
  });
  await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", sentAt: new Date() } });
  return { ok: true, mode: "console" };
}

export function scanCompletedEmailHtml(opts: {
  agencyName: string;
  clientName: string;
  score: number | null;
  actionsCount: number;
  dashboardUrl: string;
}) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2>Scan complete — ${escapeHtml(opts.clientName)}</h2>
      <p>${escapeHtml(opts.agencyName)} · AEO Command</p>
      <p>Visibility score: <strong>${opts.score ?? "—"}/100</strong></p>
      <p>${opts.actionsCount} action(s) ready in the Action Center.</p>
      <p><a href="${opts.dashboardUrl}">Open client workspace</a></p>
    </div>
  `;
}

export function weeklyDigestEmailHtml(opts: {
  agencyName: string;
  lines: string[];
  dashboardUrl: string;
}) {
  const items = opts.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("");
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2>Weekly AEO digest — ${escapeHtml(opts.agencyName)}</h2>
      <ul>${items}</ul>
      <p><a href="${opts.dashboardUrl}">Open dashboard</a></p>
    </div>
  `;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
