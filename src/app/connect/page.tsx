"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ConnectPage() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/smartthings/status")
      .then((r) => r.json())
      .then((d) => setConnected(d.connected))
      .catch(() => setConnected(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
            ← 세탁실 목록
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 mt-1">SmartThings 연결</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {connected === null && <p className="text-neutral-400 text-sm">연결 상태 확인 중...</p>}

        {connected === true && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm px-4 py-3">
            SmartThings 계정이 연결되어 있어요. 토큰은 자동으로 갱신됩니다.
          </div>
        )}

        {connected === false && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              세탁기·건조기 상태를 가져오려면 SmartThings 계정 연결이 필요합니다.
            </p>
            <a
              href="/api/auth/smartthings/start"
              className="w-fit rounded-lg bg-neutral-900 text-white text-sm font-medium px-4 py-2.5 hover:bg-neutral-700"
            >
              SmartThings 계정 연결하기
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
