// 실제 세탁실 도면. 좌/우 두 줄에 위(건조기)+아래(세탁기)가 한 세트로 겹쳐진 유닛 번호를
// 위에서 아래 순서로 나열한다. 도면이 아직 없는 방은 이 맵에 없으면 기존 탭 UI로 표시된다.
export interface FloorPlan {
  left: number[];
  right: number[];
  // 세탁기 없이 건조기 두 대만 위아래로 쌓인 특수 라인 번호(예: B동 2층 9~12번).
  // 기기 이름은 "{위치}-D-{번호}A"(하단)/"{위치}-D-{번호}B"(상단)로 등록한다.
  dryerPairs?: number[];
  // 출입구 표시 위치. 기본은 아래쪽 벽(bottom).
  entrance?: "bottom" | "right";
}

export const FLOOR_PLANS: Record<string, FloorPlan> = {
  "B-2": { left: [8, 7, 6, 5, 4, 3, 2, 1], right: [], dryerPairs: [9, 10, 11, 12], entrance: "right" },
  "C-1": { left: [4, 5, 6, 7, 8], right: [3, 2, 1] },
  "C-3A": { left: [7, 6, 2], right: [10, 4, 5] },
  "C-3B": { left: [6, 5, 4, 8], right: [3, 2, 1] },
};

export function getFloorPlan(roomCode: string): FloorPlan | undefined {
  return FLOOR_PLANS[roomCode];
}
