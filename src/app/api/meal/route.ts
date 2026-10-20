import { NextResponse } from "next/server";
import { fetchBreakfast, targetBreakfast } from "@/lib/meal";
import { getMealRatingSummary, setMealRating } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId") ?? undefined;
  const { ymd, label } = targetBreakfast();
  const dishes = await fetchBreakfast(ymd);
  return NextResponse.json({ date: ymd, label, dishes, rating: getMealRatingSummary(ymd, clientId) });
}

export async function POST(req: Request) {
  const { clientId, score } = await req.json().catch(() => ({}));
  if (typeof clientId !== "string" || !clientId || !Number.isInteger(score) || score < 1 || score > 5) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { ymd } = targetBreakfast();
  setMealRating(ymd, clientId, score);
  return NextResponse.json({ ok: true, rating: getMealRatingSummary(ymd, clientId) });
}
