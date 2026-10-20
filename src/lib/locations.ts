// 세탁실 위치 정의. A동은 사용하지 않으므로 등록하지 않는다.
export interface Room {
  code: string; // SmartThings 기기 이름 접두어와 일치해야 함
  building: "B" | "C" | "T";
  label: string; // 화면에 표시될 위치명 (동/층)
  sub?: string; // 같은 층에 여러 세탁실이 있을 때 구분용 (괄호로 표시)
}

export const ROOMS: Room[] = [
  { code: "B-2", building: "B", label: "B동 2층" },
  { code: "C-1", building: "C", label: "C동 1층" },
  { code: "C-3A", building: "C", label: "C동 3층", sub: "엘레베이터 앞" },
  { code: "C-3B", building: "C", label: "C동 3층", sub: "휴게실 앞" },
];

// 실제 SmartThings 기기와 무관하게 상태를 수동으로 바꿔볼 수 있는 테스트 세탁실.
// building이 "T"라서 홈 화면(B/C동만 순회)에는 안 뜨고 /room/TEST 로 직접 들어가야 보인다.
export const TEST_ROOM_CODE = "TEST";
export const TEST_WASHER_ID = "test-washer-1";
export const TEST_DRYER_ID = "test-dryer-1";
export const TEST_ROOM: Room = { code: TEST_ROOM_CODE, building: "T", label: "테스트 세탁실" };

ROOMS.push(TEST_ROOM);

export function getRoom(code: string): Room | undefined {
  return ROOMS.find((r) => r.code === code);
}

// SmartThings 기기 이름 규칙: "{위치코드}-{W|D}-{번호}" 예) C-1-W-1, C-3A-D-1, B-2-D-9A
// 위치코드 자체에 하이픈이 들어갈 수 있어서 마지막 두 구간(종류, 번호)만 떼어내고 나머지를 위치코드로 본다.
// 번호는 보통 숫자(1, 2...)지만, B동 2층 9~12번처럼 세탁기 없이 건조기만 위/아래로 쌓인 라인은
// "9A"(하단)/"9B"(상단)처럼 문자가 붙는다 — 그래서 index는 숫자가 아니라 문자열로 다룬다.
// 위치코드는 ROOMS의 code와 일치해야 하며, 규칙에 맞지 않는 기기(A동 등)는 자동으로 제외된다.
export function parseDeviceLabel(
  label: string
): { roomCode: string; kind: "washer" | "dryer"; index: string; displayName: string } | null {
  const match = label.trim().match(/^(.+)-([WD])-([0-9A-Za-z]+)$/i);
  if (!match) return null;

  const [, roomCode, kindLetter, indexStr] = match;
  const room = getRoom(roomCode.toUpperCase());
  if (!room) return null;

  const kind = kindLetter.toUpperCase() === "W" ? "washer" : "dryer";
  const index = indexStr.toUpperCase();
  const kindLabel = kind === "washer" ? "세탁기" : "건조기";

  // "9A"(하단)/"9B"(상단)처럼 세탁기 없이 건조기만 쌓인 라인은 번호 대신 위치로 표시한다.
  const pairMatch = index.match(/^(\d+)([AB])$/);
  const displayName = pairMatch
    ? `${kindLabel} ${pairMatch[1]}번 ${pairMatch[2] === "A" ? "하단" : "상단"}`
    : `${kindLabel} ${index}`;

  return {
    roomCode: room.code,
    kind,
    index,
    displayName,
  };
}

// "9A" -> 9, "12" -> 12 처럼 번호 앞부분 숫자만 뽑아 정렬/도면 매칭에 쓴다.
export function indexNumber(index: string): number {
  const n = parseInt(index, 10);
  return Number.isNaN(n) ? 0 : n;
}
