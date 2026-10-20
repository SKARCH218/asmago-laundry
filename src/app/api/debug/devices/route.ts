import { NextResponse } from "next/server";
import { listLaundryDevices } from "@/lib/smartthings";

// 설정용 엔드포인트: SmartThings 계정에 연결된 세탁기/건조기의 실제 deviceId를 확인하는 용도.
// 여기서 확인한 deviceId를 src/lib/locations.ts의 DEVICE_ROOM_MAP에 채워 넣는다.
export async function GET() {
  try {
    const devices = await listLaundryDevices();
    return NextResponse.json({ devices });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "알 수 없는 오류" }, { status: 500 });
  }
}
