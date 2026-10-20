"use client";

import { useState } from "react";
import { TEST_WASHER_ID, TEST_DRYER_ID } from "@/lib/locations";

async function setTestState(deviceId: string, jobState: "idle" | "running" | "complete", durationSeconds?: number) {
  await fetch("/api/test/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, jobState, durationSeconds }),
  });
}

function DeviceControls({ deviceId, name }: { deviceId: string; name: string }) {
  const [busy, setBusy] = useState(false);

  const run = async (jobState: "idle" | "running" | "complete", durationSeconds?: number) => {
    setBusy(true);
    await setTestState(deviceId, jobState, durationSeconds);
    setBusy(false);
  };

  return (
    <div>
      <p className="text-xs font-semibold text-neutral-600 mb-2">{name}</p>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={() => run("idle")}
          className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 disabled:opacity-50"
        >
          대기중으로
        </button>
        <button
          disabled={busy}
          onClick={() => run("running", 15)}
          className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 disabled:opacity-50"
        >
          사용중 (15초, 실제로 흐름)
        </button>
        <button
          disabled={busy}
          onClick={() => run("running", 3600)}
          className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 disabled:opacity-50"
        >
          사용중 (1시간)
        </button>
        <button
          disabled={busy}
          onClick={() => run("complete")}
          className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 disabled:opacity-50"
        >
          완료로 (알림 트리거)
        </button>
      </div>
    </div>
  );
}

export default function TestControls() {
  return (
    <div className="mb-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-100 p-4 flex flex-col gap-4">
      <p className="text-xs font-medium text-neutral-500">
        테스트용 컨트롤 — 실제 SmartThings 기기와 무관하게 상태를 바꿔볼 수 있어요. &quot;사용중&quot;은 실제
        시간이 흘러서 0초가 되면 자동으로 완료로 바뀝니다.
      </p>
      <DeviceControls deviceId={TEST_WASHER_ID} name="테스트 세탁기" />
      <DeviceControls deviceId={TEST_DRYER_ID} name="테스트 건조기" />
    </div>
  );
}
