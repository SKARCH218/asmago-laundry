"use client";

import Link from "next/link";
import Image from "next/image";
import { useLaundryData } from "@/lib/useLaundryData";
import { ROOMS } from "@/lib/locations";
import { AppleLogo, AndroidLogo } from "@/components/PlatformIcons";
import MealCard from "@/components/MealCard";

// 같은 층(라벨)에 세탁실이 둘 이상이면(C동 3층) 한 줄에 묶어 보여줘서 다른 층과 같은 줄에 섞이지 않게 한다.
function floorGroups(building: string) {
  const groups: (typeof ROOMS)[] = [];
  for (const room of ROOMS.filter((r) => r.building === building)) {
    const g = groups.find((x) => x[0].label === room.label);
    if (g) g.push(room);
    else groups.push([room]);
  }
  return groups;
}

export default function Home() {
  const { devices, error } = useLaundryData();

  const buildings = ["B", "C"] as const;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center gap-3">
          <Image src="/logo.png" alt="학교 로고" width={68} height={40} className="shrink-0 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">아스마고 세탁실</h1>
            <p className="text-sm text-neutral-500 mt-1">세탁실을 선택하세요</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <MealCard />

        <section className="mb-8">
          <h2 className="text-sm font-bold text-neutral-900 mb-3">
            알림설정 안내{" "}
            <span className="font-normal text-neutral-500">(알림이 안울릴시 이곳을 이용해주세요!)</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/guide/iphone"
              className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white py-5 shadow-sm hover:border-neutral-400 transition-colors"
            >
              <AppleLogo className="w-7 h-7 text-neutral-900" />
              <span className="text-sm font-semibold text-neutral-900">iPhone</span>
            </Link>
            <Link
              href="/guide/android"
              className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white py-5 shadow-sm hover:border-neutral-400 transition-colors"
            >
              <AndroidLogo className="w-7 h-7 text-emerald-600" />
              <span className="text-sm font-semibold text-neutral-900">Android</span>
            </Link>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-3">
          <Link href="/board" className="rounded-2xl border border-neutral-200 bg-white py-4 text-center text-sm font-semibold text-neutral-900 shadow-sm">
            분실물 게시판
          </Link>
          <Link href="/inquiry" className="rounded-2xl border border-neutral-200 bg-white py-4 text-center text-sm font-semibold text-neutral-900 shadow-sm">
            관리자 문의
          </Link>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
            기기 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </div>
        )}

        {buildings.map((building) => (
          <section key={building} className="mb-10">
            <h2 className="text-base font-bold text-neutral-900 mb-4">{building}동</h2>
            <div className="space-y-4">
              {floorGroups(building).map((group) => (
                <div key={group[0].label} className={`grid gap-4 ${group.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                  {group.map((room) => {
                const roomDevices = devices.filter((d) => d.roomId === room.code);
                const washers = roomDevices.filter((d) => d.kind === "washer");
                const dryers = roomDevices.filter((d) => d.kind === "dryer");
                const runningWashers = washers.filter((d) => d.jobState === "running").length;
                const runningDryers = dryers.filter((d) => d.jobState === "running").length;
                const complete = roomDevices.filter((d) => d.jobState === "complete").length;
                const offline = roomDevices.filter((d) => d.jobState === "offline").length;

                return (
                  <Link
                    key={room.code}
                    href={`/room/${room.code}`}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-neutral-400 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {room.label}
                      {room.sub && (
                        <span className="text-neutral-400 text-sm font-normal"> ({room.sub})</span>
                      )}
                    </h3>
                    {roomDevices.length === 0 ? (
                      <p className="text-sm text-neutral-400 mt-2">기기 정보 없음</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {washers.length > 0 && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            세탁기 {runningWashers}/{washers.length}
                          </span>
                        )}
                        {dryers.length > 0 && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                            건조기 {runningDryers}/{dryers.length}
                          </span>
                        )}
                        {complete > 0 && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            완료 {complete}
                          </span>
                        )}
                        {offline > 0 && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500 text-white border border-red-500">
                            연결 끊김 {offline}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
                  })}
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
