"use client";

import { DeviceView } from "@/lib/types";

export const GRAY = "#e5e5e5"; // neutral-200
const RED = "#ef4444"; // red-500

export function halfColor(device: DeviceView | undefined, runningColor: string) {
  if (device?.jobState === "offline") return RED;
  return device?.jobState === "running" ? runningColor : GRAY;
}

export function halfTextColor(device: DeviceView | undefined, runningTextColor: string) {
  return device?.jobState === "offline" ? "text-red-600" : runningTextColor;
}

// SmartThings 클라우드 쪽 갱신 지연 때문에 초 단위까지 보여주면 실제보다 더 정확한 것처럼
// 오해를 줄 수 있어서, 평소엔 분 단위로만 표시한다 (올림 처리: 59초 남아도 "1분"으로).
// 다만 1분 미만으로 임박했을 때는 초 단위가 유용해서 그때만 초로 보여준다.
export function formatRemaining(sec: number | null) {
  if (sec === null) return null;
  if (sec < 60) return `${sec}초`;
  const m = Math.ceil(sec / 60);
  return `${m}분`;
}

export function liveRemaining(device: DeviceView | undefined, now: number): string | null {
  if (device?.jobState === "offline") return "연결끊김";
  if (device?.jobState !== "running" || device.remainingEndAt === null || device.remainingEndAt === undefined) {
    return null;
  }
  return formatRemaining(Math.max(0, Math.round((device.remainingEndAt - now) / 1000)));
}

// 원 테두리를 위/아래 반원으로 나눠 두 기기의 가동 여부를 색으로 보여준다(채우지 않고 테두리만).
// 돌아가는 중이면 각 반원 색 텍스트로 남은 시간도 같이 표시한다.
export default function SplitCircleIcon({
  topColor,
  bottomColor,
  topTime,
  bottomTime,
  topTextColor = "text-orange-600",
  bottomTextColor = "text-blue-600",
}: {
  topColor: string;
  bottomColor: string;
  topTime: string | null;
  bottomTime: string | null;
  topTextColor?: string;
  bottomTextColor?: string;
}) {
  return (
    <div className="relative flex-1 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-[80%] aspect-square">
        <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke={topColor} strokeWidth="8" strokeLinecap="round" />
        <path d="M 5 50 A 45 45 0 0 0 95 50" fill="none" stroke={bottomColor} strokeWidth="8" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none pointer-events-none gap-0.5">
        <span className={`text-xs font-bold tabular-nums h-4 ${topTextColor}`}>{topTime}</span>
        <span className={`text-xs font-bold tabular-nums h-4 ${bottomTextColor}`}>{bottomTime}</span>
      </div>
    </div>
  );
}
