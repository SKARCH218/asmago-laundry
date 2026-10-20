import { NextResponse } from "next/server";
import { getAuthorizeUrl } from "@/lib/smartthings-auth";

// 리버스 프록시(nginx) 뒤에서는 req.url이 내부 바인드 주소(localhost:3000)를 가리킬 수 있어서
// 실제 접속 도메인은 프록시가 넘겨주는 헤더에서 읽는다.
function getBaseUrl(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const redirectUri = new URL("/api/auth/smartthings/callback", getBaseUrl(req)).toString();
  const state = crypto.randomUUID();

  try {
    const url = getAuthorizeUrl(redirectUri, state);
    const res = NextResponse.redirect(url);
    res.cookies.set("st_oauth_state", state, { httpOnly: true, maxAge: 600, path: "/" });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
