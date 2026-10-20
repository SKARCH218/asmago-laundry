import { ROOMS } from "@/lib/locations";
import { FLOOR_PLANS } from "@/lib/floorplans";

// QR 카드 인쇄용: 도면에 등록된 모든 실제 세탁기/건조기 라벨을 나열한다.
// (테스트 세탁실은 제외)
export interface DeviceLabelInfo {
  roomCode: string;
  roomLabel: string;
  kind: "washer" | "dryer";
  number: number;
  index: string; // "1", "9A", "9B" ...
  label: string; // "B-2-W-1"
  kindText: "세탁기" | "건조기";
  posText?: "상단" | "하단"; // 세탁기 없이 건조기만 위/아래로 쌓인 라인일 때만
}

export function getAllDeviceLabels(): DeviceLabelInfo[] {
  const result: DeviceLabelInfo[] = [];

  for (const room of ROOMS) {
    const plan = FLOOR_PLANS[room.code];
    if (!plan) continue;

    const roomLabel = room.sub ? `${room.label} (${room.sub})` : room.label;
    const units = [...plan.left, ...plan.right];

    for (const n of units) {
      result.push({
        roomCode: room.code,
        roomLabel,
        kind: "washer",
        number: n,
        index: String(n),
        label: `${room.code}-W-${n}`,
        kindText: "세탁기",
      });
      result.push({
        roomCode: room.code,
        roomLabel,
        kind: "dryer",
        number: n,
        index: String(n),
        label: `${room.code}-D-${n}`,
        kindText: "건조기",
      });
    }

    for (const n of plan.dryerPairs ?? []) {
      for (const suffix of ["A", "B"] as const) {
        result.push({
          roomCode: room.code,
          roomLabel,
          kind: "dryer",
          number: n,
          index: `${n}${suffix}`,
          label: `${room.code}-D-${n}${suffix}`,
          kindText: "건조기",
          posText: suffix === "A" ? "하단" : "상단",
        });
      }
    }
  }

  return result;
}
