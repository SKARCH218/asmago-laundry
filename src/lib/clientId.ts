const CLIENT_ID_KEY = "asmago:clientId";

// 로그인이 없는 앱이라 "이용자"를 브라우저별 임의 ID로만 구분한다(통계·도배 제한용).
export function getClientId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}
