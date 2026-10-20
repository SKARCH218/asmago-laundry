"use client";

import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLaundryData } from "@/lib/useLaundryData";
import { parseDeviceLabel, getRoom } from "@/lib/locations";

export default function SubscribePage({ params }: { params: Promise<{ label: string }> }) {
  const { label: rawLabel } = use(params);
  const label = decodeURIComponent(rawLabel);
  const { devices, subscriptions, subscribeStatus, subscribeError, toggleSubscribe } = useLaundryData();
  const [attempted, setAttempted] = useState(false);
  const requestedRef = useRef(false);

  const parsed = parseDeviceLabel(label);
  const room = parsed ? getRoom(parsed.roomCode) : undefined;
  const device = parsed ? devices.find((d) => d.roomId === parsed.roomCode && d.kind === parsed.kind && d.index === parsed.index) : undefined;

  useEffect(() => {
    if (!device || requestedRef.current) return;
    if (subscriptions.has(device.deviceId)) return;
    requestedRef.current = true;
    setAttempted(true);
    toggleSubscribe(device.deviceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device]);

  const subscribed = device ? subscriptions.has(device.deviceId) : false;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center gap-4">
      <Image src="/logo.png" alt="학교 로고" width={56} height={33} className="object-contain" />
      <h1 className="text-xl font-bold text-neutral-900">아스마고 세탁실</h1>

      {!parsed || !room ? (
        <p className="text-sm text-red-600">잘못된 QR 코드예요. 기기를 다시 확인해주세요.</p>
      ) : !device ? (
        <p className="text-sm text-neutral-400">기기 정보를 불러오는 중...</p>
      ) : (
        <>
          <p className="text-sm text-neutral-500">
            {room.label}
            {room.sub && ` (${room.sub})`} · {parsed.displayName}
          </p>

          {subscribed ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-6 py-4 text-sm font-medium">
              ✅ 이 기기 완료 알림을 신청했어요.
              <br />세탁이 끝나면 알려드릴게요.
            </div>
          ) : subscribeStatus === "denied" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 px-6 py-4 text-sm">
              브라우저 알림 권한이 차단되어 있어요. 설정에서 알림을 허용한 뒤
              <button
                onClick={() => device && toggleSubscribe(device.deviceId)}
                className="ml-1 underline font-medium"
              >
                다시 시도
              </button>
              해주세요.
            </div>
          ) : subscribeStatus === "unsupported" ? (
            <p className="text-sm text-amber-600">이 브라우저는 알림 기능을 지원하지 않아요.</p>
          ) : subscribeStatus === "error" ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-6 py-4 text-sm">
              알림 신청에 실패했어요.
              {subscribeError && <div className="mt-1 text-xs text-red-500 break-all">{subscribeError}</div>}
              <button
                onClick={() => device && toggleSubscribe(device.deviceId)}
                className="mt-2 underline font-medium block"
              >
                다시 시도
              </button>
            </div>
          ) : attempted ? (
            <p className="text-sm text-neutral-400">알림 신청 처리 중...</p>
          ) : (
            <button
              onClick={() => device && toggleSubscribe(device.deviceId)}
              className="rounded-full bg-neutral-900 text-white text-sm font-medium px-6 py-3"
            >
              완료되면 알림받기
            </button>
          )}

          <a
            href={`/room/${room.code}`}
            className="text-xs text-neutral-400 underline mt-2"
          >
            {room.label} 전체 현황 보기
          </a>
        </>
      )}
    </div>
  );
}
