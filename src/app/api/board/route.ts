import { NextResponse } from "next/server";
import { addBoardPost, countCommentsByPost, deleteBoardPost, listBoardPosts } from "@/lib/store";
import { getRoom } from "@/lib/locations";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const counts = countCommentsByPost();
  // clientId·watchers(푸시 구독 정보)는 응답에서 뺀다.
  return NextResponse.json({
    posts: listBoardPosts().map(({ clientId: _c, watchers: _w, ...p }) => ({ ...p, commentCount: counts[p.id] ?? 0 })),
  });
}

export async function POST(req: Request) {
  const { clientId, roomCode, text, subscription } = await req.json().catch(() => ({}));
  const body = typeof text === "string" ? text.trim() : "";
  if (typeof clientId !== "string" || !clientId) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  if (body.length < 2 || body.length > 200) {
    return NextResponse.json({ error: "내용은 2~200자로 적어주세요." }, { status: 400 });
  }
  const room = typeof roomCode === "string" && roomCode ? getRoom(roomCode) : undefined;
  if (roomCode && (!room || room.code === "TEST")) return NextResponse.json({ error: "세탁실이 올바르지 않아요." }, { status: 400 });

  const watcher = typeof subscription?.endpoint === "string" ? { endpoint: subscription.endpoint, subscription } : null;
  const result = addBoardPost(clientId, room?.code ?? null, body, watcher, Date.now());
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 429 });
  return NextResponse.json({ ok: true, id: result.post.id });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== "string") return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  deleteBoardPost(id);
  return NextResponse.json({ ok: true });
}
