"use client";

import { useState } from "react";
import { DeviceView } from "@/lib/types";
import { FloorPlan } from "@/lib/floorplans";
import StackedUnit from "@/components/StackedUnit";
import DryerPairUnit from "@/components/DryerPairUnit";
import MachineCard from "@/components/MachineCard";

type OpenTarget = { type: "unit"; number: number } | { type: "pair"; number: number };

export default function FloorPlanRoom({
  plan,
  devices,
  now,
  subscriptions,
  onToggleSubscribe,
}: {
  plan: FloorPlan;
  devices: DeviceView[]; // 이 방에 속한 기기 목록
  now: number;
  subscriptions: Set<string>;
  onToggleSubscribe: (deviceId: string) => void;
}) {
  const [openTarget, setOpenTarget] = useState<OpenTarget | null>(null);

  const byIndex = (index: string, kind: "washer" | "dryer") =>
    devices.find((d) => d.index === index && d.kind === kind);

  const renderColumn = (numbers: number[]) => (
    <div className="flex flex-col gap-4">
      {numbers.map((n) => (
        <StackedUnit
          key={n}
          number={n}
          dryer={byIndex(String(n), "dryer")}
          washer={byIndex(String(n), "washer")}
          now={now}
          onOpen={() => setOpenTarget({ type: "unit", number: n })}
        />
      ))}
    </div>
  );

  let modalTitle = "";
  let modalCards: DeviceView[] = [];
  if (openTarget?.type === "unit") {
    modalTitle = `${openTarget.number}번 유닛`;
    modalCards = [byIndex(String(openTarget.number), "dryer"), byIndex(String(openTarget.number), "washer")].filter(
      (d): d is DeviceView => !!d
    );
  } else if (openTarget?.type === "pair") {
    modalTitle = `${openTarget.number}번 라인`;
    modalCards = [byIndex(`${openTarget.number}B`, "dryer"), byIndex(`${openTarget.number}A`, "dryer")].filter(
      (d): d is DeviceView => !!d
    );
  }

  return (
    <div className="relative rounded-2xl border-2 border-neutral-300 bg-neutral-50 p-5 sm:p-8 pb-12">
      <div className="grid grid-cols-2 gap-x-8 sm:gap-x-16">
        {renderColumn(plan.left)}
        <div className="flex flex-col gap-4">
          {renderColumn(plan.right)}
          {plan.dryerPairs && plan.dryerPairs.length > 0 && (
            <div className="flex flex-col gap-4">
              {plan.dryerPairs.map((n) => (
                <DryerPairUnit
                  key={n}
                  number={n}
                  top={byIndex(`${n}B`, "dryer")}
                  bottom={byIndex(`${n}A`, "dryer")}
                  now={now}
                  onOpen={() => setOpenTarget({ type: "pair", number: n })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* 출입구: 방 벽면에 붙여서 표시 (기본 아래쪽, 방에 따라 오른쪽) */}
      <span
        className={`absolute text-xs text-neutral-400 border border-neutral-300 rounded px-4 py-1 bg-neutral-50 ${
          plan.entrance === "right"
            ? "top-1/2 right-0 -translate-y-1/2 translate-x-1/2 [writing-mode:vertical-rl]"
            : "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2"
        }`}
      >
        출입구
      </span>

      {openTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpenTarget(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-neutral-900">{modalTitle}</h3>
              <button
                onClick={() => setOpenTarget(null)}
                className="text-neutral-400 hover:text-neutral-600 text-sm px-2 py-1"
              >
                닫기
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modalCards.map((device) => (
                <MachineCard
                  key={device.deviceId}
                  device={device}
                  now={now}
                  subscribed={subscriptions.has(device.deviceId)}
                  onToggleSubscribe={onToggleSubscribe}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
