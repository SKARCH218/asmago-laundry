"use client";

import { useState } from "react";
import Link from "next/link";
import { getClientId } from "@/lib/clientId";

export default function InquiryPage() {
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: getClientId(), text, contact }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "보내지 못했어요." });
      } else {
        setText("");
        setMsg({ ok: true, text: "문의가 전달됐어요. 확인 후 연락처로 답변드릴게요." });
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
          <h1 className="text-xl font-bold text-neutral-900 mt-1">관리자 문의</h1>
          <p className="text-xs text-neutral-500 mt-1">고장·오류·건의사항을 남겨주세요.</p>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-5">
        <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            rows={6}
            placeholder="문의 내용을 적어주세요 (5자 이상)"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={50}
            placeholder="답변받을 연락처 (선택, 학번/호실 등)"
            className="w-full h-11 rounded-lg border border-neutral-300 px-3 text-base"
          />
          <button
            disabled={sending || text.trim().length < 5}
            className="w-full h-12 rounded-full bg-neutral-900 text-white text-sm font-medium disabled:opacity-40"
          >
            보내기
          </button>
          {msg && <p className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
        </form>
      </main>
    </div>
  );
}
