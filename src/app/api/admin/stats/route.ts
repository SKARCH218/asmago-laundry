import { NextResponse } from "next/server";
import { getVisitorStats, getCompletionCounts, getSubscriberStats, listBoardPosts, listComments, listInquiries, listMealRatingDays } from "@/lib/store";
import { getAllDeviceLabels } from "@/lib/deviceLabels";
import { ROOMS } from "@/lib/locations";

interface DeviceView {
  deviceId: string;
  label: string;
  kind: "washer" | "dryer";
  index: string;
  jobState: string;
  roomId: string;
}

function getBaseUrl(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const password = req.headers.get("x-admin-password");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "ADMIN_PASSWORD가 서버에 설정되어 있지 않습니다." }, { status: 500 });
  }
  if (password !== expected) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const now = Date.now();
  const visitors = getVisitorStats(now);
  const completions = getCompletionCounts();
  const subscribers = getSubscriberStats();

  let devices: DeviceView[] = [];
  let devicesError: string | undefined;
  try {
    const res = await fetch(`${getBaseUrl(req)}/api/devices`, { cache: "no-store" });
    const data = await res.json();
    devices = (data.devices ?? []).filter((d: DeviceView) => d.roomId !== "TEST");
    devicesError = data.error;
  } catch (e: any) {
    devicesError = e.message ?? "기기 정보를 불러오지 못했습니다.";
  }

  const totalsByState: Record<string, number> = {};
  for (const d of devices) {
    totalsByState[d.jobState] = (totalsByState[d.jobState] ?? 0) + 1;
  }

  const roomBreakdown = ROOMS.filter((r) => r.code !== "TEST").map((room) => {
    const roomDevices = devices.filter((d) => d.roomId === room.code);
    return {
      roomCode: room.code,
      roomLabel: room.sub ? `${room.label} (${room.sub})` : room.label,
      total: roomDevices.length,
      running: roomDevices.filter((d) => d.jobState === "running").length,
      offline: roomDevices.filter((d) => d.jobState === "offline").length,
    };
  });

  // 완료 횟수 랭킹: 기기 코드(라벨)를 사람이 읽을 수 있는 이름으로 붙여준다.
  const labelInfos = getAllDeviceLabels();
  const nameByDeviceId = new Map(devices.map((d) => [d.deviceId, `${labelInfos.find((l) => l.roomCode === d.roomId && l.kind === d.kind && l.index === d.index)?.roomLabel ?? d.roomId} ${d.label}`]));

  const completionRanking = Object.entries(completions)
    .map(([deviceId, count]) => ({ deviceId, name: nameByDeviceId.get(deviceId) ?? deviceId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalCompletions = Object.values(completions).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    now,
    visitors,
    subscribers,
    board: listBoardPosts().map(({ clientId: _c, watchers: _w, ...p }) => ({
      ...p,
      comments: listComments(p.id).map(({ clientId: _cc, ...c }) => c),
    })),
    inquiries: listInquiries().map(({ clientId: _c, ...i }) => i),
    mealRatings: listMealRatingDays(7),
    devices: {
      total: devices.length,
      byState: totalsByState,
      byRoom: roomBreakdown,
      error: devicesError,
    },
    completions: {
      total: totalCompletions,
      ranking: completionRanking,
    },
  });
}
