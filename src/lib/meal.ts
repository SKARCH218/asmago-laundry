// 아산스마트팩토리마이스터고등학교 NEIS 급식 조회 (교육청 N10, 학교코드 8140472).
const ATPT_CODE = "N10";
const SCHOOL_CODE = "8140472";

// 20:20 이후에는 다음날 조식, 그 전(0:00~20:19)에는 오늘 조식을 보여준다. 기준은 한국시간.
export function targetBreakfast(now = Date.now()): { ymd: string; label: "오늘" | "내일" } {
  const kst = new Date(now + 9 * 3600 * 1000);
  const minutes = kst.getUTCHours() * 60 + kst.getUTCMinutes();
  const tomorrow = minutes >= 20 * 60 + 20;
  if (tomorrow) kst.setUTCDate(kst.getUTCDate() + 1);
  const ymd = `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, "0")}${String(kst.getUTCDate()).padStart(2, "0")}`;
  return { ymd, label: tomorrow ? "내일" : "오늘" };
}

const cache = new Map<string, { at: number; dishes: string[] }>();

export async function fetchBreakfast(ymd: string): Promise<string[]> {
  const hit = cache.get(ymd);
  if (hit && Date.now() - hit.at < (hit.dishes.length ? 30 : 10) * 60 * 1000) return hit.dishes;

  const url =
    `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${ATPT_CODE}` +
    `&SD_SCHUL_CODE=${SCHOOL_CODE}&MMEAL_SC_CODE=1&MLSV_YMD=${ymd}`;
  let dishes: string[] = [];
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    const raw: string | undefined = data?.mealServiceDietInfo?.[1]?.row?.[0]?.DDISH_NM;
    if (raw) {
      dishes = raw
        .split(/<br\s*\/?>/i)
        .map((d) => d.replace(/\s*\([\d.\s]+\)\s*$/, "").trim())
        .filter(Boolean);
    }
  } catch {
    if (hit) return hit.dishes;
  }
  cache.set(ymd, { at: Date.now(), dishes });
  return dishes;
}
