"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLaundryData } from "@/lib/useLaundryData";
import { getRoom, TEST_ROOM_CODE, indexNumber } from "@/lib/locations";
import { getFloorPlan } from "@/lib/floorplans";
import MachineCard from "@/components/MachineCard";
import FloorPlanRoom from "@/components/FloorPlanRoom";
import TestControls from "@/components/TestControls";
import { notFound } from "next/navigation";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const room = getRoom(roomId.toUpperCase());
  const { devices, now, error, subscriptions, subscribeStatus, subscribeError, toggleSubscribe } = useLaundryData();
  const [tab, setTab] = useState<"washer" | "dryer">("washer");

  if (!room) notFound();

  const isTestRoom = room.code === TEST_ROOM_CODE;
  const floorPlan = getFloorPlan(room.code);
  const byIndex = (a: { index: string }, b: { index: string }) => indexNumber(a.index) - indexNumber(b.index) || a.index.localeCompare(b.index);
  const washers = devices.filter((d) => d.roomId === room.code && d.kind === "washer").sort(byIndex);
  const dryers = devices.filter((d) => d.roomId === room.code && d.kind === "dryer").sort(byIndex);
  const shown = tab === "washer" ? washers : dryers;
  const roomDevices = devices.filter((d) => d.roomId === room.code);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className={`${floorPlan ? "max-w-xl" : "max-w-3xl"} mx-auto px-6 py-6 flex items-start justify-between`}>
          <div>
            <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
              ← 세탁실 목록
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900 mt-1">
              {room.label}
              {room.sub && <span className="text-neutral-400 text-base font-normal"> ({room.sub})</span>}
            </h1>
          </div>
          <Image src="/logo.png" alt="학교 로고" width={56} height={33} className="shrink-0 object-contain" />
        </div>

        {!floorPlan && (
          <div className={`${floorPlan ? "max-w-xl" : "max-w-3xl"} mx-auto px-6 flex gap-1 -mb-px`}>
            {(["washer", "dryer"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === k
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {k === "washer" ? "세탁기" : "건조기"}
                {(k === "washer" ? washers.length : dryers.length) > 0 && (
                  <span className="ml-1.5 text-xs text-neutral-400">
                    {k === "washer" ? washers.length : dryers.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className={`${floorPlan ? "max-w-xl" : "max-w-3xl"} mx-auto px-6 py-8`}>
        {isTestRoom && <TestControls />}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
            기기 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </div>
        )}

        {subscribeStatus === "denied" && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm px-4 py-3">
            브라우저 알림 권한이 차단되어 있어요. 알림을 받으려면 브라우저 설정에서 이 사이트의 알림을 허용해주세요.
          </div>
        )}
        {subscribeStatus === "unsupported" && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm px-4 py-3">
            이 브라우저는 알림 기능을 지원하지 않아요.
          </div>
        )}
        {subscribeStatus === "error" && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
            알림 신청에 실패했어요. 잠시 후 다시 시도해주세요.
            {subscribeError && <div className="mt-1 text-xs text-red-500 break-all">{subscribeError}</div>}
          </div>
        )}

        {roomDevices.length === 0 && !error && (
          <p className="text-neutral-400 text-sm">기기 정보를 불러오는 중...</p>
        )}

        {floorPlan ? (
          <FloorPlanRoom
            plan={floorPlan}
            devices={roomDevices}
            now={now}
            subscriptions={subscriptions}
            onToggleSubscribe={toggleSubscribe}
          />
        ) : shown.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {shown.map((d) => (
              <MachineCard
                key={d.deviceId}
                device={d}
                now={now}
                subscribed={subscriptions.has(d.deviceId)}
                onToggleSubscribe={toggleSubscribe}
              />
            ))}
          </div>
        ) : (
          (washers.length > 0 || dryers.length > 0) && (
            <p className="text-neutral-400 text-sm">
              이 세탁실에는 {tab === "washer" ? "세탁기" : "건조기"}가 없어요.
            </p>
          )
        )}
      </main>
    </div>
  );
}
