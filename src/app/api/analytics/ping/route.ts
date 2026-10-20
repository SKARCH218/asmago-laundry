import { NextResponse } from "next/server";
import { recordVisit } from "@/lib/store";

export async function POST(req: Request) {
  const { clientId } = await req.json().catch(() => ({ clientId: null }));
  if (!clientId || typeof clientId !== "string") {
    return NextResponse.json({ error: "clientId가 필요합니다." }, { status: 400 });
  }
  recordVisit(clientId, Date.now());
  return NextResponse.json({ ok: true });
}
