import { NextResponse } from "next/server";
import { saveSubscription, removeSubscription, getSubscribedDeviceIds } from "@/lib/store";

export async function POST(req: Request) {
  const { subscription, deviceIds } = await req.json();
  if (!subscription?.endpoint || !Array.isArray(deviceIds)) {
    return NextResponse.json({ error: "subscription과 deviceIds가 필요합니다." }, { status: 400 });
  }

  if (deviceIds.length === 0) {
    removeSubscription(subscription.endpoint);
  } else {
    saveSubscription(subscription.endpoint, subscription, deviceIds);
  }

  return NextResponse.json({ ok: true });
}

// 서버가 알고 있는 이 브라우저의 구독 기기 목록. 완료 알림 후 서버가 구독을 비우므로 클라이언트가 이걸로 동기화한다.
export async function GET(req: Request) {
  const endpoint = new URL(req.url).searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "endpoint가 필요합니다." }, { status: 400 });
  return NextResponse.json({ deviceIds: getSubscribedDeviceIds(endpoint) });
}
