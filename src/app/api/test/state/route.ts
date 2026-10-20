import { NextResponse } from "next/server";
import { setTestDeviceState } from "@/lib/store";
import { TEST_WASHER_ID, TEST_DRYER_ID } from "@/lib/locations";

export async function POST(req: Request) {
  const body = await req.json();
  const { deviceId, jobState, durationSeconds } = body;

  if (![TEST_WASHER_ID, TEST_DRYER_ID].includes(deviceId)) {
    return NextResponse.json({ error: "알 수 없는 테스트 기기입니다." }, { status: 400 });
  }
  if (!["idle", "running", "complete"].includes(jobState)) {
    return NextResponse.json({ error: "jobState는 idle/running/complete 중 하나여야 합니다." }, { status: 400 });
  }

  if (jobState === "running") {
    setTestDeviceState(deviceId, {
      jobState: "running",
      durationSeconds: durationSeconds ?? 60,
      startedAt: Date.now(),
    });
  } else {
    setTestDeviceState(deviceId, { jobState, durationSeconds: null, startedAt: null });
  }

  return NextResponse.json({ ok: true });
}
