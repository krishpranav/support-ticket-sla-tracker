import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_KEY } from "../../../lib/session";
export async function POST(request: Request): Promise<NextResponse> { const token = (await cookies()).get(SESSION_KEY)?.value; const response = await fetch(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/graphql", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: await request.text() }); return new NextResponse(await response.text(), { status: response.status, headers: { "content-type": "application/json" } }); }
