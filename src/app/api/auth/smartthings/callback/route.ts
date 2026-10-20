import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/smartthings-auth";

// 리버스 프록시(nginx) 뒤에서는 req.url이 내부 바인드 주소(localhost:3000)를 가리킬 수 있어서
// 실제 접속 도메인은 프록시가 넘겨주는 헤더에서 읽는다.
function getBaseUrl(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.headers.get("cookie")?.match(/st_oauth_state=([^;]+)/)?.[1];

  if (!code) {
    return NextResponse.json({ error: "SmartThings 인증 코드가 없습니다." }, { status: 400 });
  }
  if (!state || state !== cookieState) {
    return NextResponse.json({ error: "state 값이 일치하지 않습니다. 다시 시도해주세요." }, { status: 400 });
  }

  const redirectUri = new URL("/api/auth/smartthings/callback", getBaseUrl(req)).toString();

  try {
    await exchangeCodeForTokens(code, redirectUri);
    const res = NextResponse.redirect(new URL("/connect?connected=1", getBaseUrl(req)));
    res.cookies.delete("st_oauth_state");
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
