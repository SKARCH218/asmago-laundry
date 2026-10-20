"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getClientId } from "@/lib/clientId";
import { ensurePushSubscription } from "@/lib/push-client";
import { setWatchedPost } from "@/lib/watchPosts";
import { ROOMS, TEST_ROOM_CODE } from "@/lib/locations";

interface Post {
  id: string;
  roomCode: string | null;
  text: string;
  createdAt: number;
  commentCount: number;
}

const rooms = ROOMS.filter((r) => r.code !== TEST_ROOM_CODE);

function roomName(code: string | null) {
  const r = rooms.find((x) => x.code === code);
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

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [writing, setWriting] = useState(false);
  const [notify, setNotify] = useState(true);

  const load = useCallback(() => {
    fetch("/api/board")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts))
      .catch(() => setPosts([]));
  }, []);

  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    try {
      // 댓글 알림을 켠 경우 먼저 이 브라우저의 푸시 구독을 확보한다(실패해도 글은 올린다).
      let subscription: unknown = null;
      let notifyNote = "";
      if (notify) {
        const sub = await ensurePushSubscription();
        if (sub.ok) subscription = sub.subscription;
        else notifyNote = sub.reason === "denied" ? " (알림 권한이 꺼져 있어 댓글 알림은 못 켰어요)" : " (이 브라우저에서는 댓글 알림을 켤 수 없어요)";
      }
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: getClientId(), roomCode: roomCode || null, text, subscription }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "등록하지 못했어요." });
      } else {
        if (subscription) setWatchedPost(data.id, true);
        setText("");
        setWriting(false);
        setMsg({ ok: true, text: `등록했어요.${notifyNote}` });
        load();
      }
    } catch {
      setMsg({ ok: false, text: "네트워크 오류가 났어요." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-xl mx-auto px-4 py-4">
          <Link href="/" className="text-sm text-neutral-400">← 홈으로</Link>
          <h1 className="text-xl font-bold text-neutral-900 mt-1">분실물 게시판</h1>
          <p className="text-xs text-neutral-500 mt-1">빨래를 잃어버렸거나 주인 없는 빨래를 발견했다면 남겨주세요. (익명)</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5">
        {writing ? (
          <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-4 mb-3 space-y-3">
            <select
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full h-11 rounded-lg border border-neutral-300 px-3 text-base bg-white"
            >
              <option value="">세탁실 선택 안 함</option>
              {rooms.map((r) => (
                <option key={r.code} value={r.code}>{roomName(r.code)}</option>
              ))}
            </select>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="예) 3번 세탁기에 파란 후드티가 있어요"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
            />
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="w-4 h-4" />
              댓글이 달리면 알림받기
            </label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-400 mr-auto">{text.length}/200</span>
              <button
                type="button"
                onClick={() => setWriting(false)}
                className="h-11 px-4 text-sm text-neutral-500"
              >
                취소
              </button>
              <button
                disabled={sending || text.trim().length < 2}
                className="h-11 px-6 rounded-full bg-neutral-900 text-white text-sm font-medium disabled:opacity-40"
              >
                올리기
              </button>
            </div>
            {msg && <p className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
          </form>
        ) : (
          <button
            onClick={() => {
              setMsg(null);
              setWriting(true);
            }}
            className="w-full mb-3 h-14 rounded-2xl border-2 border-dashed border-neutral-300 bg-white text-sm font-semibold text-neutral-600 flex items-center justify-center gap-2"
          >
            <span className="text-xl leading-none">+</span> 글 작성하기
          </button>
        )}
        {!writing && msg && <p className={`mb-3 text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}

        {posts === null ? (
          <p className="text-sm text-neutral-400">불러오는 중...</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-10">아직 올라온 글이 없어요.</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/board/${p.id}`} className="block rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                    <span>{roomName(p.roomCode)}</span>
                    <span>{ago(p.createdAt)}</span>
                  </div>
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap break-words">{p.text}</p>
                  <p className="mt-2 text-xs text-neutral-400">댓글 {p.commentCount}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
