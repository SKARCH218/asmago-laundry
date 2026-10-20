"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getClientId } from "@/lib/clientId";
import { ensurePushSubscription } from "@/lib/push-client";
import { loadWatchedPosts, setWatchedPost } from "@/lib/watchPosts";
import { ROOMS } from "@/lib/locations";

interface Post {
  id: string;
  roomCode: string | null;
  text: string;
  createdAt: number;
}
interface Comment {
  id: string;
  text: string;
  createdAt: number;
}

function roomName(code: string | null) {
  const r = ROOMS.find((x) => x.code === code);
  return r ? `${r.label}${r.sub ? ` (${r.sub})` : ""}` : "전체";
}

function ago(ms: number) {
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [missing, setMissing] = useState(false);
  const [watching, setWatching] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/board/${id}`)
      .then(async (r) => {
        if (r.status === 404) return setMissing(true);
        const d = await r.json();
        setPost(d.post);
        setComments(d.comments);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    load();
    setWatching(loadWatchedPosts().has(id));
  }, [id, load]);

  const toggleWatch = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const next = !watching;
      const sub = await ensurePushSubscription();
      if (!sub.ok) {
        setMsg({
          ok: false,
          text: sub.reason === "denied" ? "브라우저 알림 권한이 꺼져 있어요. 설정에서 허용해주세요." : "이 브라우저에서는 알림을 켤 수 없어요.",
        });
        return;
      }
      const res = await fetch(`/api/board/${id}/watch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: getClientId(), subscription: sub.subscription, watch: next }),
      });
      if (!res.ok) {
        setMsg({ ok: false, text: "알림 설정을 바꾸지 못했어요." });
        return;
      }
      setWatchedPost(id, next);
      setWatching(next);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/board/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: getClientId(), text }),
      });
      const data = await res.json();
      if (!res.ok) setMsg({ ok: false, text: data.error ?? "등록하지 못했어요." });
      else {
        setText("");
        load();
      }
    } catch {
      setMsg({ ok: false, text: "네트워크 오류가 났어요." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-xl mx-auto px-4 py-4">
          <Link href="/board" className="text-sm text-neutral-400">← 분실물 게시판</Link>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-5">
        {missing ? (
          <p className="text-sm text-neutral-400 text-center py-10">삭제되었거나 없는 글이에요.</p>
        ) : !post ? (
          <p className="text-sm text-neutral-400">불러오는 중...</p>
        ) : (
          <>
            <article className="rounded-2xl border border-neutral-200 bg-white px-4 py-4">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <span>{roomName(post.roomCode)}</span>
                <span>{ago(post.createdAt)}</span>
              </div>
              <p className="text-base text-neutral-900 whitespace-pre-wrap break-words">{post.text}</p>
              <button
                onClick={toggleWatch}
                disabled={busy}
                className={`mt-4 w-full h-11 rounded-full text-sm font-medium border ${
                  watching ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-700 border-neutral-300"
                }`}
              >
                {watching ? "댓글 알림 받는 중 ✓ (누르면 끄기)" : "이 글 댓글 알림받기"}
              </button>
            </article>

            <h2 className="text-sm font-bold text-neutral-900 mt-6 mb-2">댓글 {comments.length}</h2>
            {comments.length === 0 ? (
              <p className="text-sm text-neutral-400 mb-4">아직 댓글이 없어요.</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
                    <p className="text-sm text-neutral-900 whitespace-pre-wrap break-words">{c.text}</p>
                    <p className="text-xs text-neutral-400 mt-1">{ago(c.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={submit} className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={200}
                placeholder="댓글을 남겨주세요"
                className="flex-1 h-11 rounded-full border border-neutral-300 bg-white px-4 text-base"
              />
              <button
                disabled={busy || text.trim().length < 1}
                className="h-11 px-5 rounded-full bg-neutral-900 text-white text-sm font-medium disabled:opacity-40"
              >
                등록
              </button>
            </form>
            {msg && <p className={`mt-2 text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
          </>
        )}
      </main>
    </div>
  );
}
