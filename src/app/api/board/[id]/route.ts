import { NextResponse } from "next/server";
import { getBoardPost, listComments } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = getBoardPost(id);
  if (!post) return NextResponse.json({ error: "글을 찾을 수 없어요." }, { status: 404 });
  const { clientId: _c, watchers: _w, ...pub } = post;
  return NextResponse.json({
    post: pub,
    comments: listComments(id).map(({ clientId: _cc, ...c }) => c),
  });
}
