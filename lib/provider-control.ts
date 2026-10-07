import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const PROVIDERS = ["openai","anthropic","perplexity","gemini","firecrawl","resend","stripe","redis","inngest"] as const;
export type ProviderName = (typeof PROVIDERS)[number];
const ENV_KEYS: Record<ProviderName,string[]> = {
 openai:["OPENAI_API_KEY"], anthropic:["ANTHROPIC_API_KEY"], perplexity:["PERPLEXITY_API_KEY"],
 gemini:["GEMINI_API_KEY","GOOGLE_GENERATIVE_AI_API_KEY"], firecrawl:["FIRECRAWL_API_KEY"],
 resend:["RESEND_API_KEY"], stripe:["STRIPE_SECRET_KEY"], redis:["UPSTASH_REDIS_REST_TOKEN","UPSTASH_REDIS_REST_URL"],
 inngest:["INNGEST_EVENT_KEY","INNGEST_SIGNING_KEY"]
};
function encryptionKey(){const raw=process.env.PROVIDER_SECRET_ENCRYPTION_KEY||process.env.NEXTAUTH_SECRET;if(!raw)throw new Error("Provider secret encryption key is required");return crypto.createHash("sha256").update(raw).digest();}
export function encryptProviderSecret(secret:string){const iv=crypto.randomBytes(12);const c=crypto.createCipheriv("aes-256-gcm",encryptionKey(),iv);const data=Buffer.concat([c.update(secret,"utf8"),c.final()]);return Buffer.concat([iv,c.getAuthTag(),data]).toString("base64url");}
export function decryptProviderSecret(payload:string){const raw=Buffer.from(payload,"base64url");const d=crypto.createDecipheriv("aes-256-gcm",encryptionKey(),raw.subarray(0,12));d.setAuthTag(raw.subarray(12,28));return Buffer.concat([d.update(raw.subarray(28)),d.final()]).toString("utf8");}
export function fingerprintSecret(secret:string){return crypto.createHash("sha256").update(secret).digest("hex").slice(0,16);}
export function maskedCredential(fp:string|null){return fp?"••••••••"+fp.slice(-4):null;}
export function providerEnvConfigured(p:ProviderName){return ENV_KEYS[p].some(k=>Boolean(process.env[k]));}
export async function getProviderRuntime(p:ProviderName){
 const c=await prisma.providerConfig.findUnique({where:{provider:p}});
 if(c)return c.status==="ENABLED"&&c.encryptedCredential?{credential:decryptProviderSecret(c.encryptedCredential),model:c.model,timeoutMs:c.timeoutMs,concurrencyLimit:c.concurrencyLimit,rateLimitPerMinute:c.rateLimitPerMinute,monthlyBudgetCents:c.monthlyBudgetCents,source:"database" as const}:null;
 const secret=ENV_KEYS[p].map(k=>process.env[k]).find(Boolean);
 return secret?{credential:secret,model:null,timeoutMs:30000,concurrencyLimit:4,rateLimitPerMinute:60,monthlyBudgetCents:null,source:"environment" as const}:null;
}
export async function recordProviderUsage(i:{provider:ProviderName;agencyId?:string|null;clientId?:string|null;feature:string;model?:string|null;inputTokens?:number;outputTokens?:number;estimatedCostCents?:number;status?:string;latencyMs?:number}){
 const c=await prisma.providerConfig.findUnique({where:{provider:i.provider}});if(!c)return;
 await prisma.providerUsageEvent.create({data:{providerId:c.id,agencyId:i.agencyId??null,clientId:i.clientId??null,feature:i.feature,model:i.model??null,inputTokens:i.inputTokens??0,outputTokens:i.outputTokens??0,estimatedCostCents:i.estimatedCostCents??0,status:i.status??"SUCCESS",latencyMs:i.latencyMs??null}});
}
export async function providerSummary(){
 const rows=await prisma.providerConfig.findMany({orderBy:{provider:"asc"},select:{id:true,provider:true,status:true,model:true,timeoutMs:true,concurrencyLimit:true,rateLimitPerMinute:true,monthlyBudgetCents:true,credentialFingerprint:true,lastTestAt:true,lastTestStatus:true,lastError:true}});
 const start=new Date();start.setUTCDate(1);start.setUTCHours(0,0,0,0);
 const usage=await prisma.providerUsageEvent.groupBy({by:["providerId"],where:{createdAt:{gte:start}},_sum:{requestCount:true,inputTokens:true,outputTokens:true,estimatedCostCents:true}});
 const m=new Map(usage.map(x=>[x.providerId,x._sum]));
 return rows.map(({id,credentialFingerprint,...r})=>({...r,credential:maskedCredential(credentialFingerprint),monthlyUsage:m.get(id)??{requestCount:0,inputTokens:0,outputTokens:0,estimatedCostCents:0}}));
}