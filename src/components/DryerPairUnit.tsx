"use client";

import { DeviceView } from "@/lib/types";
import SplitCircleIcon, { halfColor, halfTextColor, liveRemaining } from "@/components/SplitCircleIcon";

const ORANGE = "#fb923c"; // orange-400 (상단)
const ORANGE_DARK = "#ea580c"; // orange-600 (하단)

// 세탁기 없이 건조기 두 대만 위(B)/아래(A)로 쌓인 라인용 아이콘. 둘 다 건조기라 색은 주황으로 통일.
export default function DryerPairUnit({
  number,
  top,
  bottom,
  now,
  onOpen,
}: {
  number: number;
  top: DeviceView | undefined;
  bottom: DeviceView | undefined;
  now: number;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="aspect-square rounded-xl border-2 border-neutral-300 bg-white shadow-sm flex flex-col p-2 hover:border-neutral-400 transition-colors"
    >
      <div className="flex items-center justify-center text-xs font-bold text-neutral-700 mb-1">{number}</div>
      <SplitCircleIcon
        topColor={halfColor(top, ORANGE)}
        bottomColor={halfColor(bottom, ORANGE_DARK)}
        topTime={liveRemaining(top, now)}
        bottomTime={liveRemaining(bottom, now)}
        topTextColor={halfTextColor(top, "text-orange-600")}
        bottomTextColor={halfTextColor(bottom, "text-orange-700")}
      />
    </button>
  );
}
