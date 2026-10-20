import { NextResponse } from "next/server";
import { setPostWatcher } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { clientId, subscription, watch } = await req.json().catch(() => ({}));
  if (typeof clientId !== "string" || !clientId || typeof subscription?.endpoint !== "string" || typeof watch !== "boolean") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const ok = setPostWatcher(id, { endpoint: subscription.endpoint, subscription, clientId }, watch);
  if (!ok) return NextResponse.json({ error: "글을 찾을 수 없어요." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
