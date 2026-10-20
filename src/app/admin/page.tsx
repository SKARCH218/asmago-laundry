"use client";

import { useEffect, useState } from "react";

const AUTH_KEY = "asmago:adminPassword";
const STATE_LABELS: Record<string, string> = {
  running: "사용중",
  idle: "대기중",
  complete: "완료",
  paused: "일시정지",
  offline: "연결 끊김",
};

interface Stats {
  now: number;
  visitors: { online: number; today: number; total: number };
  subscribers: { total: number; active: number };
  devices: {
    total: number;
    byState: Record<string, number>;
    byRoom: { roomCode: string; roomLabel: string; total: number; running: number; offline: number }[];
    error?: string;
  };
  completions: { total: number; ranking: { deviceId: string; name: string; count: number }[] };
  board: { id: string; roomCode: string | null; text: string; createdAt: number; comments: { id: string; text: string; createdAt: number }[] }[];
  inquiries: { id: string; text: string; contact: string; createdAt: number }[];
  mealRatings: { date: string; count: number; average: number }[];
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  const fetchStats = async (pw: string) => {
    try {
      const res = await fetch("/api/admin/stats", { headers: { "x-admin-password": pw } });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "불러오지 못했습니다.");
        setAuthed(false);
        localStorage.removeItem(AUTH_KEY);
        return;
      }
      setStats(data);
      setError(null);
      setAuthed(true);
      localStorage.setItem(AUTH_KEY, pw);
    } catch {
      setError("네트워크 오류");
    }
  };

  useEffect(() => {
    if (!authed) return;
    fetchStats(password);
    const id = setInterval(() => fetchStats(password), 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const remove = async (url: string, id: string, key: "id" | "commentId" = "id") => {
    if (!confirm("삭제할까요?")) return;
    await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ [key]: id }),
    });
    fetchStats(password);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchStats(password);
          }}
          className="bg-white border border-neutral-200 rounded-2xl p-6 w-full max-w-sm shadow-sm"
        >
          <h1 className="text-lg font-bold text-neutral-900 mb-4">관리자 로그인</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm mb-3"
            autoFocus
          />
          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-neutral-900 text-white text-sm font-medium py-2.5">
            입장
          </button>
        </form>
      </div>
    );
  }

  if (!stats) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center text-neutral-400 text-sm">불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-neutral-900">관리자 통계</h1>
          <button
            onClick={() => {
              localStorage.removeItem(AUTH_KEY);
              setAuthed(false);
            }}
            className="text-xs text-neutral-400 underline"
          >
            로그아웃
          </button>
        </div>

        {stats.devices.error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">{stats.devices.error}</div>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card title="현재 접속자" value={`${stats.visitors.online}명`} sub={`오늘 ${stats.visitors.today}명 · 누적 ${stats.visitors.total}명`} />
          <Card title="알림 구독" value={`${stats.subscribers.active}명`} sub={`전체 브라우저 ${stats.subscribers.total}건`} />
          <Card title="누적 완료 횟수" value={`${stats.completions.total}회`} sub="세탁+건조 합산" />
        </div>

        <section className="bg-white border border-neutral-200 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-bold text-neutral-900 mb-3">기기 현황 (전체 {stats.devices.total}대)</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(stats.devices.byState).map(([state, count]) => (
              <span key={state} className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                {STATE_LABELS[state] ?? state} {count}
              </span>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-400 text-xs">
                <th className="font-medium pb-2">세탁실</th>
                <th className="font-medium pb-2">총 대수</th>
                <th className="font-medium pb-2">사용중</th>
                <th className="font-medium pb-2">연결 끊김</th>
              </tr>
            </thead>
            <tbody>
              {stats.devices.byRoom.map((r) => (
                <tr key={r.roomCode} className="border-t border-neutral-100">
                  <td className="py-2 text-neutral-900">{r.roomLabel}</td>
                  <td className="py-2 text-neutral-500">{r.total}</td>
                  <td className="py-2 text-blue-600">{r.running}</td>
                  <td className="py-2 text-red-600">{r.offline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-white border border-neutral-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-neutral-900 mb-3">가장 많이 쓰는 기기 TOP 10</h2>
          {stats.completions.ranking.length === 0 ? (
            <p className="text-sm text-neutral-400">아직 데이터가 없어요.</p>
          ) : (
            <ol className="space-y-1.5">
              {stats.completions.ranking.map((r, i) => (
                <li key={r.deviceId} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">
                    <span className="text-neutral-400 mr-2">{i + 1}</span>
                    {r.name}
                  </span>
                  <span className="font-semibold text-neutral-900">{r.count}회</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="bg-white border border-neutral-200 rounded-2xl p-5 mt-6">
          <h2 className="text-sm font-bold text-neutral-900 mb-3">관리자 문의 ({stats.inquiries.length})</h2>
          {stats.inquiries.length === 0 ? (
            <p className="text-sm text-neutral-400">문의가 없어요.</p>
          ) : (
            <ul className="space-y-3">
              {stats.inquiries.map((i) => (
                <li key={i.id} className="border-t border-neutral-100 pt-3 first:border-0 first:pt-0">
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap break-words">{i.text}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {new Date(i.createdAt).toLocaleString("ko-KR")} · 연락처: {i.contact || "없음"}
                    <button onClick={() => remove("/api/inquiry", i.id)} className="ml-2 text-red-500 underline">삭제</button>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-neutral-200 rounded-2xl p-5 mt-6">
          <h2 className="text-sm font-bold text-neutral-900 mb-3">분실물 게시글 ({stats.board.length})</h2>
          {stats.board.length === 0 ? (
            <p className="text-sm text-neutral-400">글이 없어요.</p>
          ) : (
            <ul className="space-y-3">
              {stats.board.map((b) => (
                <li key={b.id} className="border-t border-neutral-100 pt-3 first:border-0 first:pt-0">
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap break-words">{b.text}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {new Date(b.createdAt).toLocaleString("ko-KR")} · {b.roomCode ?? "전체"}
                    <button onClick={() => remove("/api/board", b.id)} className="ml-2 text-red-500 underline">삭제</button>
                  </p>
                  {b.comments.length > 0 && (
                    <ul className="mt-2 ml-3 pl-3 border-l-2 border-neutral-100 space-y-1">
                      {b.comments.map((c) => (
                        <li key={c.id} className="text-xs text-neutral-600 break-words">
                          {c.text}
                          <button onClick={() => remove(`/api/board/${b.id}/comments`, c.id, "commentId")} className="ml-2 text-red-500 underline">삭제</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-neutral-200 rounded-2xl p-5 mt-6">
          <h2 className="text-sm font-bold text-neutral-900 mb-3">조식 평점 (최근 7일)</h2>
          {stats.mealRatings.length === 0 ? (
            <p className="text-sm text-neutral-400">아직 평점이 없어요.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {stats.mealRatings.map((r) => (
                <li key={r.date} className="flex justify-between">
                  <span className="text-neutral-700">{r.date.slice(0, 4)}-{r.date.slice(4, 6)}-{r.date.slice(6)}</span>
                  <span className="font-semibold text-neutral-900">★ {r.average.toFixed(1)} <span className="text-neutral-400 font-normal">({r.count}명)</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5">
      <p className="text-xs text-neutral-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-400 mt-1">{sub}</p>
    </div>
  );
}
