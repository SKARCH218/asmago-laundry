import { NextResponse } from "next/server";
import { addComment, deleteComment, getBoardPost } from "@/lib/store";
import { notifyPostWatchers } from "@/lib/push";
import { isAdmin } from "@/lib/adminAuth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { clientId, text } = await req.json().catch(() => ({}));
  const body = typeof text === "string" ? text.trim() : "";
  const post = getBoardPost(id);
  if (!post) return NextResponse.json({ error: "글을 찾을 수 없어요." }, { status: 404 });
  if (typeof clientId !== "string" || !clientId) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  if (body.length < 1 || body.length > 200) {
    return NextResponse.json({ error: "댓글은 1~200자로 적어주세요." }, { status: 400 });
  }

  const result = addComment(id, clientId, body, Date.now());
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 429 });

  // 댓글 쓴 사람 본인은 알림에서 제외한다.
  const targets = (post.watchers ?? []).filter((w) => w.clientId !== clientId);
  notifyPostWatchers(id, targets, {
    title: clientId === post.clientId ? "내가 쓴 글에 댓글을 남겼어요" : "내 글에 댓글이 달렸어요",
    body: body.length > 60 ? body.slice(0, 60) + "…" : body,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  const { commentId } = await req.json().catch(() => ({}));
  if (typeof commentId !== "string") return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  deleteComment(commentId);
  return NextResponse.json({ ok: true });
}
