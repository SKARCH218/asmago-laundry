import { getValidAccessToken } from "@/lib/smartthings-auth";

const API_BASE = "https://api.smartthings.com/v1";

async function stFetch(path: string) {
  const token = await getValidAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SmartThings API 오류 (${res.status}): ${body}`);
  }
  return res.json();
}

export type MachineKind = "washer" | "dryer";

export interface RawDevice {
  deviceId: string;
  label: string;
  kind: MachineKind;
}

// SmartThings 기기 목록에서 세탁기/건조기 capability를 가진 기기만 골라낸다.
export async function listLaundryDevices(): Promise<RawDevice[]> {
  const data = await stFetch("/devices");
  const items: any[] = data.items ?? [];
  const result: RawDevice[] = [];

  for (const item of items) {
    const capabilityIds: string[] = (item.components ?? [])
      .flatMap((c: any) => c.capabilities ?? [])
      .map((c: any) => c.id as string);

    const isWasher = capabilityIds.includes("washerOperatingState");
    const isDryer = capabilityIds.includes("dryerOperatingState");

    if (isWasher || isDryer) {
      result.push({
        deviceId: item.deviceId,
        label: item.label ?? item.name ?? "이름없는 기기",
        kind: isWasher ? "washer" : "dryer",
      });
    }
  }
  return result;
}

export type JobState = "idle" | "running" | "paused" | "complete" | "offline";

// 완료 예정 시각이 이만큼 지나도록 여전히 "돌아가는 중"으로 남아있으면, 기기가 클라우드에
// 상태를 보고하지 못하고 있다고 본다(와이파이 끊김 등). 기숙사가 밤 11시에 인터넷을
// 끊는 것처럼 통신이 끊기면 SmartThings가 마지막 상태를 그대로 들고 있어서 필요하다.
const OFFLINE_AFTER_MS = 10 * 60 * 1000;

export interface DeviceStatus {
  deviceId: string;
  jobState: JobState;
  // 초 단위 잔여시간. 알 수 없으면 null.
  remainingSeconds: number | null;
  raw: any;
}

function pickAttr(status: any, capability: string, attribute: string) {
  return status?.components?.main?.[capability]?.[attribute]?.value ?? null;
}

// SmartThings의 washerJobState / machineState 값을 앱 내부 상태로 정규화한다.
// 실제 필드명은 기기 펌웨어에 따라 달라질 수 있어 raw 값을 함께 반환한다.
function normalizeJobState(machineState: string | null, jobState: string | null): JobState {
  const ms = (machineState ?? "").toLowerCase();
  const js = (jobState ?? "").toLowerCase();

  if (js.includes("finish") || js.includes("complete") || js === "none" && ms === "stop") {
    if (js.includes("finish") || js.includes("complete")) return "complete";
  }
  if (ms === "pause") return "paused";
  if (ms === "run") return "running";
  if (ms === "stop" || ms === "" ) return "idle";
  return "idle";
}

export async function getDeviceStatus(deviceId: string, kind: MachineKind): Promise<DeviceStatus> {
  const status = await stFetch(`/devices/${deviceId}/status`);
  const capability = kind === "washer" ? "washerOperatingState" : "dryerOperatingState";

  const machineState = pickAttr(status, capability, "machineState");
  const jobState = pickAttr(status, capability, "washerJobState") ?? pickAttr(status, capability, "dryerJobState");
  const normalizedJobState = normalizeJobState(machineState, jobState);

  // completionTime(ISO 8601 UTC, 표준 capability)은 "완료 예정 시각" 자체라서
  // 분 단위로만 갱신되는 remainingTime(숫자)보다 훨씬 정확하고, 폴링마다 흔들리지도 않는다.
  // SmartThings가 정지 후에도 이 값을 지우지 않고 마지막 값을 그대로 들고 있어서,
  // 실제로 돌아가는 중이 아니면(=running이 아니면) 무시한다.
  const completionTimeStr: string | null =
    normalizedJobState === "running" ? pickAttr(status, capability, "completionTime") : null;

  let remainingSeconds: number | null = null;
  let finalJobState = normalizedJobState;
  if (completionTimeStr) {
    const remainingMs = new Date(completionTimeStr).getTime() - Date.now();
    if (remainingMs < -OFFLINE_AFTER_MS) {
      // 완료 예정 시각이 한참 지났는데도 아직 "사용중"이면 통신이 끊긴 것으로 간주.
      finalJobState = "offline";
    } else {
      remainingSeconds = Math.max(0, Math.round(remainingMs / 1000));
    }
  }

  return {
    deviceId,
    jobState: finalJobState,
    remainingSeconds,
    raw: { machineState, jobState, completionTimeStr },
  };
}
