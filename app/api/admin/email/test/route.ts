import { NextRequest,NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { readJsonBody } from "@/lib/request-security";
export async function POST(req:NextRequest){
 const a=await requireAuth();if(a.error||!a.session)return NextResponse.json({error:a.error},{status:a.status});
 if(a.session.user.role!=="SUPER_ADMIN")return NextResponse.json({error:"Forbidden"},{status:403});
 const b=await readJsonBody<any>(req).catch(()=>null);const to=typeof b?.to==="string"?b.to.trim():"";
 if(!/^\S+@\S+\.\S+$/.test(to))return NextResponse.json({error:"Valid recipient required"},{status:400});
 const result=await sendEmail({to,subject:"Threezero AEO email configuration test",text:"This is a configuration test from Threezero AEO.",html:"<p>This is a configuration test from <strong>Threezero AEO</strong>.</p>"});
 return NextResponse.json(result,{status:result.ok?200:502});
}