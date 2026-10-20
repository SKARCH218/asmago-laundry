import { NextResponse } from "next/server";
import { addInquiry, deleteInquiry } from "@/lib/store";
import { isAdmin } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const { clientId, text, contact } = await req.json().catch(() => ({}));
  const body = typeof text === "string" ? text.trim() : "";
  const contactText = typeof contact === "string" ? contact.trim().slice(0, 50) : "";
  if (typeof clientId !== "string" || !clientId) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  if (body.length < 5 || body.length > 500) {
    return NextResponse.json({ error: "문의 내용은 5~500자로 적어주세요." }, { status: 400 });
  }
  const result = addInquiry(clientId, body, contactText, Date.now());
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 429 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== "string") return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  deleteInquiry(id);
  return NextResponse.json({ ok: true });
}
