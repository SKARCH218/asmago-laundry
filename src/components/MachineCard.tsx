"use client";

import { DeviceView } from "@/lib/types";

const STATE_LABEL: Record<DeviceView["jobState"], string> = {
  idle: "대기중",
  running: "사용중",
  paused: "일시정지",
  complete: "완료",
  offline: "연결 끊김",
};

const STATE_BADGE_STYLE: Record<DeviceView["jobState"], string> = {
  idle: "bg-neutral-100 text-neutral-600 border-neutral-200",
  running: "bg-blue-50 text-blue-700 border-blue-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
  offline: "bg-red-50 text-red-600 border-red-200",
};

// 세탁조(원) 색상: idle=회색, complete=초록, paused=주황, offline=빨강(점선).
// running은 종류별로 다름 — 건조기는 주황, 세탁기는 파랑(둘 다 도는 애니메이션).
function drumRingStyle(jobState: DeviceView["jobState"], kind: DeviceView["kind"]) {
  if (jobState === "running") {
    return kind === "dryer" ? "border-orange-400 border-t-orange-100" : "border-blue-400 border-t-blue-100";
  }
  const STATIC_STYLE: Record<Exclude<DeviceView["jobState"], "running">, string> = {
    idle: "border-neutral-200",
    paused: "border-amber-300",
    complete: "border-emerald-400",
    offline: "border-red-300 border-dashed",
  };
  return STATIC_STYLE[jobState];
}

// SmartThings 클라우드 쪽 갱신 지연 때문에 초 단위까지 보여주면 실제보다 더 정확한 것처럼
// 오해를 줄 수 있어서, 평소엔 분 단위로만 표시한다 (올림 처리: 59초 남아도 "1분"으로).
// 다만 1분 미만으로 임박했을 때는 초 단위가 유용해서 그때만 초로 보여준다.
function formatRemaining(sec: number | null) {
  if (sec === null) return null;
  if (sec < 60) return `${sec}초`;
  const m = Math.ceil(sec / 60);
  return `${m}분`;
}

function formatElapsed(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 1) return "방금";
  return `${totalMin}분`;
}

export default function MachineCard({
  device,
  now,
  subscribed,
  onToggleSubscribe,
}: {
  device: DeviceView;
  now: number;
  subscribed: boolean;
  onToggleSubscribe: (deviceId: string) => void;
}) {
  const liveRemainingSeconds =
    device.jobState === "running" && device.remainingEndAt !== null
      ? Math.max(0, Math.round((device.remainingEndAt - now) / 1000))
      : null;

  const completedAgoMs =
    device.jobState === "complete" && device.completedAt ? now - device.completedAt : null;

  return (
    <div className="aspect-square rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-neutral-400">{device.kind === "washer" ? "세탁기" : "건조기"}</p>
          <h3 className="text-base font-semibold text-neutral-900">{device.label}</h3>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${STATE_BADGE_STYLE[device.jobState]}`}>
          {STATE_LABEL[device.jobState]}
        </span>
      </div>

      {/* 세탁조: 도어 원 */}
      <div className="relative flex-1 flex items-center justify-center min-h-0">
        <div
          className={`relative w-[68%] aspect-square rounded-full border-[6px] flex items-center justify-center ${drumRingStyle(device.jobState, device.kind)} ${
            device.jobState === "running" ? "animate-spin [animation-duration:3s]" : ""
          }`}
        >
          <div
            className={`absolute inset-2 rounded-full border-2 border-dashed ${
              device.jobState === "idle" ? "border-neutral-100" : "border-current opacity-30"
            }`}
          />
        </div>
        {/* 원 중앙 텍스트는 회전 영향을 안 받도록 별도 레이어에 겹쳐 표시 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {device.jobState === "running" && liveRemainingSeconds !== null && (
            <span className="text-lg font-bold text-neutral-900 tabular-nums">
              {formatRemaining(liveRemainingSeconds)}
            </span>
          )}
          {device.jobState === "complete" && <span className="text-2xl">✓</span>}
          {device.jobState === "idle" && <span className="text-2xl text-neutral-300">○</span>}
          {device.jobState === "offline" && <span className="text-xl text-red-400">⚠</span>}
        </div>
      </div>

      {device.jobState === "complete" && completedAgoMs !== null && (
        <p className="text-xs font-medium text-center text-emerald-700 mb-1">
          {formatElapsed(completedAgoMs)} 전 완료
        </p>
      )}
      {device.jobState === "offline" && (
        <p className="text-xs font-medium text-center text-red-500 mb-1">
          기기와 통신이 안 돼요 (와이파이 확인 필요)
        </p>
      )}

      {device.jobState !== "complete" && (
        <button
          onClick={() => onToggleSubscribe(device.deviceId)}
          className={`text-xs px-3 py-1.5 rounded-lg border w-full ${
            subscribed
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
          }`}
        >
          {subscribed ? "완료 알림 신청됨 ✓" : "완료되면 알림받기"}
        </button>
      )}
    </div>
  );
}
