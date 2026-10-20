import { getSmartThingsTokens, saveSmartThingsTokens, SmartThingsTokens } from "@/lib/store";

// SmartThings의 OAuth-In 엔드포인트는 api.smartthings.com이 아니라 별도 도메인이다.
const TOKEN_ENDPOINT = "https://oauthin-regional.api.smartthings.com/oauth/token";
const AUTHORIZE_ENDPOINT = "https://oauthin-regional.api.smartthings.com/oauth/authorize";

// 만료 5분 전이면 미리 갱신한다.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name}이(가) 설정되지 않았습니다. .env.local을 확인하세요.`);
  return value;
}

function basicAuthHeader() {
  const clientId = getEnv("SMARTTHINGS_CLIENT_ID");
  const clientSecret = getEnv("SMARTTHINGS_CLIENT_SECRET");
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export function getAuthorizeUrl(redirectUri: string, state: string) {
  const clientId = getEnv("SMARTTHINGS_CLIENT_ID");
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "r:devices:* x:devices:*",
    state,
  });
  return `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

async function exchangeToken(body: URLSearchParams): Promise<SmartThingsTokens> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SmartThings 토큰 발급 실패 (${res.status}): ${text}`);
  }

  const data = await res.json();
  const tokens: SmartThingsTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  saveSmartThingsTokens(tokens);
  return tokens;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  return exchangeToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    })
  );
}

async function refreshTokens(refreshToken: string) {
  return exchangeToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
  );
}

// 항상 유효한(만료 임박하지 않은) access token을 반환한다. 필요하면 자동으로 갱신한다.
export async function getValidAccessToken(): Promise<string> {
  const tokens = getSmartThingsTokens();
  if (!tokens) {
    throw new Error("SmartThings 계정이 연결되어 있지 않습니다. /connect 에서 연결해주세요.");
  }

  if (Date.now() < tokens.expiresAt - REFRESH_MARGIN_MS) {
    return tokens.accessToken;
  }

  const refreshed = await refreshTokens(tokens.refreshToken);
  return refreshed.accessToken;
}

export function isSmartThingsConnected(): boolean {
  return getSmartThingsTokens() !== null;
}
