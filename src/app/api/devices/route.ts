import { NextResponse } from "next/server";
import { listLaundryDevices, getDeviceStatus } from "@/lib/smartthings";
import { updateJobState, getTestDeviceState, setTestDeviceState, incrementCompletion, clearDeviceSubscriptions, COMPLETION_TIMEOUT_MS } from "@/lib/store";
import { parseDeviceLabel, getRoom, TEST_WASHER_ID, TEST_DRYER_ID, TEST_ROOM_CODE } from "@/lib/locations";
import { notifyDeviceComplete } from "@/lib/push";

export const dynamic = "force-dynamic";

// 완료 후 COMPLETION_TIMEOUT_MS가 지나면 (도어 센서가 없어 실제로 가져갔는지 확인할 수 없으므로)
// 그냥 대기중으로 간주해 표시한다. completedAt 자체는 그대로 두고 표시용 상태만 바꾼다.
function applyCompletionTimeout(jobState: string, completedAt: number | null, now: number): string {
  if (jobState === "complete" && completedAt !== null && now - completedAt >= COMPLETION_TIMEOUT_MS) {
    return "idle";
  }
  return jobState;
}

// 테스트 기기는 실제 시간이 흐르는 것처럼 동작한다: "사용중"으로 설정한 시각(startedAt)과
// 지정한 총 시간(durationSeconds)을 기준으로 매 요청마다 남은 시간을 다시 계산하고,
// 0 이하가 되면 자동으로 "완료"로 전환해 저장한다.
function buildTestDevice(deviceId: string, kind: "washer" | "dryer", label: string, now: number) {
  const raw = getTestDeviceState(deviceId);
  let jobState = raw.jobState;
  let remainingSeconds: number | null = null;

  if (raw.jobState === "running" && raw.startedAt !== null && raw.durationSeconds !== null) {
    const elapsed = Math.floor((now - raw.startedAt) / 1000);
    remainingSeconds = raw.durationSeconds - elapsed;
    if (remainingSeconds <= 0) {
      jobState = "complete";
      remainingSeconds = 0;
      setTestDeviceState(deviceId, { jobState: "complete", durationSeconds: null, startedAt: null });
    }
  }

  const meta = updateJobState(deviceId, jobState, now);

  if (meta.completedAt === now) {
    // notifyDeviceComplete는 첫 await 전에 구독자 목록을 읽으므로, 호출 직후 구독을 비워도 이번 알림은 간다.
    notifyDeviceComplete(deviceId, label).catch(() => {});
    clearDeviceSubscriptions(deviceId);
  }

  return {
    deviceId,
    label,
    kind,
    index: "1",
    jobState: applyCompletionTimeout(jobState, meta.completedAt, now),
    remainingSeconds,
    completedAt: meta.completedAt,
    roomId: TEST_ROOM_CODE,
  };
}

function buildTestDevices(now: number) {
  return [
    buildTestDevice(TEST_WASHER_ID, "washer", "테스트 세탁기", now),
    buildTestDevice(TEST_DRYER_ID, "dryer", "테스트 건조기", now),
  ];
}

export async function GET() {
  const now = Date.now();

  if (process.env.MOCK_DEVICES === "1") {
    return NextResponse.json({
      now,
      devices: [
        { deviceId: "w1", label: "세탁기 1", kind: "washer", index: "1", jobState: "running", remainingSeconds: 754, completedAt: null, roomId: "B-2" },
        { deviceId: "w2", label: "세탁기 1", kind: "washer", index: "1", jobState: "complete", remainingSeconds: 0, completedAt: now - 2 * 60000, roomId: "C-1" },
        { deviceId: "w3", label: "세탁기 1", kind: "washer", index: "1", jobState: "idle", remainingSeconds: null, completedAt: null, roomId: "C-3A" },
        { deviceId: "d1", label: "건조기 1", kind: "dryer", index: "1", jobState: applyCompletionTimeout("complete", now - 6 * 60000, now), remainingSeconds: 0, completedAt: now - 6 * 60000, roomId: "C-3B" },
        ...buildTestDevices(now),
      ],
    });
  }

  // 테스트 기기는 SmartThings 연결 상태와 무관하게 항상 표시한다.
  const testDevices = buildTestDevices(now);

  try {
    const allDevices = await listLaundryDevices();

    const results = await Promise.all(
      allDevices.map(async (d) => {
        const parsed = parseDeviceLabel(d.label);
        if (!parsed) return null; // 이름 규칙에 맞지 않는 기기(A동 등)는 제외

        const status = await getDeviceStatus(d.deviceId, parsed.kind);
        const meta = updateJobState(d.deviceId, status.jobState, now);

        // running -> complete로 막 전환된 경우에만 푸시를 보낸다 (completedAt === now).
        if (meta.completedAt === now) {
          const room = getRoom(parsed.roomCode);
          const label = room ? `${room.label}${room.sub ? ` (${room.sub})` : ""} ${parsed.displayName}` : parsed.displayName;
          notifyDeviceComplete(d.deviceId, label).catch(() => {});
          incrementCompletion(d.deviceId);
          clearDeviceSubscriptions(d.deviceId);
        }

        return {
          deviceId: d.deviceId,
          label: parsed.displayName,
          kind: parsed.kind,
          index: parsed.index,
          jobState: applyCompletionTimeout(status.jobState, meta.completedAt, now),
          remainingSeconds: status.remainingSeconds,
          completedAt: meta.completedAt,
          roomId: parsed.roomCode,
        };
      })
    );

    return NextResponse.json({ devices: [...results.filter(Boolean), ...testDevices], now });
  } catch (err: any) {
    // SmartThings 연동에 문제가 있어도 테스트 기기는 계속 보여준다.
    return NextResponse.json({ devices: testDevices, now, error: err.message ?? "알 수 없는 오류" });
  }
}
