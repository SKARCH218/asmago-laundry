"use client";

import { DeviceView } from "@/lib/types";
import SplitCircleIcon, { halfColor, halfTextColor, liveRemaining } from "@/components/SplitCircleIcon";

const ORANGE = "#fb923c"; // orange-400
const BLUE = "#60a5fa"; // blue-400

// 세탁기처럼 보이는 아이콘 카드: 위 반원=건조기(주황), 아래 반원=세탁기(파랑).
// 누르면 상세(건조기+세탁기 카드)를 연다.
export default function StackedUnit({
  number,
  washer,
  dryer,
  now,
  onOpen,
}: {
  number: number;
  washer: DeviceView | undefined;
  dryer: DeviceView | undefined;
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
        topColor={halfColor(dryer, ORANGE)}
        bottomColor={halfColor(washer, BLUE)}
        topTime={liveRemaining(dryer, now)}
        bottomTime={liveRemaining(washer, now)}
        topTextColor={halfTextColor(dryer, "text-orange-600")}
        bottomTextColor={halfTextColor(washer, "text-blue-600")}
      />
    </button>
  );
}
