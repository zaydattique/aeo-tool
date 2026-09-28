import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "aeo-command" });

export function isInngestConfigured(): boolean {
  return Boolean(
    process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === "1"
  );
}
