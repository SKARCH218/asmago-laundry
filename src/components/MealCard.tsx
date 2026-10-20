"use client";

import { useEffect, useState } from "react";
import { getClientId } from "@/lib/clientId";

interface MealData {
  date: string;
  label: "오늘" | "내일";
  dishes: string[];
  rating: { count: number; average: number | null; mine: number | null };
}

export default function MealCard() {
  const [meal, setMeal] = useState<MealData | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = () =>
      fetch(`/api/meal?clientId=${getClientId()}`)
        .then((r) => r.json())
        .then(setMeal)
        .catch(() => {});
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const rate = async (score: number) => {
    setSaving(true);
    try {
      const res = await fetch("/api/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: getClientId(), score }),
      });
      const data = await res.json();
      if (res.ok) setMeal((m) => (m ? { ...m, rating: data.rating } : m));
    } finally {
      setSaving(false);
    }
  };

  if (!meal) return null;

  const { rating } = meal;
  const shown = rating.mine ?? 0;

  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left px-4 py-4" aria-expanded={open}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-amber-900">아침 꼭 챙겨먹으세요!</p>
          <span className="text-xs text-amber-700 shrink-0">{meal.label} 조식 {open ? "▲" : "▼"}</span>
        </div>
        {meal.dishes.length > 0 ? (
          <ul className="mt-3 grid grid-cols-2 gap-1.5">
            {meal.dishes.map((dish, i) => (
              <li
                key={i}
                className="rounded-lg bg-white/80 border border-amber-100 px-2.5 py-2 text-[15px] leading-snug text-neutral-900 break-keep"
              >
                {dish}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-amber-700">등록된 조식 식단이 없어요.</p>
        )}
      </button>

      {open && meal.dishes.length > 0 && (
        <div className="border-t border-amber-200 bg-white px-4 py-4">
          <p className="text-xs text-neutral-500 mb-2">
            {meal.label} 조식 어때요?{" "}
            {rating.average !== null && (
              <span className="text-neutral-400">
                평균 {rating.average.toFixed(1)} ({rating.count}명)
              </span>
            )}
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                disabled={saving}
                onClick={() => rate(n)}
                aria-label={`${n}점`}
                className={`flex-1 h-11 rounded-lg text-xl border ${
                  n <= shown ? "bg-amber-400 border-amber-400 text-white" : "bg-white border-neutral-200 text-neutral-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          {rating.mine !== null && <p className="mt-2 text-xs text-emerald-600">평점을 남겼어요. 다시 누르면 수정돼요.</p>}
        </div>
      )}
    </section>
  );
}
