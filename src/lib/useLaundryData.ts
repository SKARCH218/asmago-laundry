"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DeviceView } from "@/lib/types";
import { syncPushSubscription, fetchServerSubscribedIds } from "@/lib/push-client";
import { getClientId } from "@/lib/clientId";

const POLL_INTERVAL_MS = 3000;
const PING_INTERVAL_MS = 15000;
const SUBSCRIPTION_KEY = "asmago:subscriptions";

function loadSubscriptions(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(SUBSCRIPTION_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveSubscriptions(subs: Set<string>) {
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify([...subs]));
}

// 기기 목록 폴링과 완료 알림(Web Push) 구독을 한 곳에서 관리하는 훅.
// 홈(전체 요약)과 세탁실별 페이지가 동일한 로직을 공유한다.
export function useLaundryData() {
  const [devices, setDevices] = useState<DeviceView[]>([]);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "denied" | "unsupported" | "error">("idle");
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  // deviceId -> 직전에 서버가 알려준 remainingSeconds/remainingEndAt.
  // SmartThings는 남은시간을 분 단위로만 갱신해서, 값이 실제로 바뀌었을 때만
  // 종료시각을 다시 잡아야 카운트다운이 매 폴링마다 흔들리지 않는다.
  const remainingRef = useRef<Record<string, { remainingSeconds: number; remainingEndAt: number }>>({});

  useEffect(() => {
    setSubscriptions(loadSubscriptions());

    // 완료 알림이 나가면 서버가 그 기기의 구독을 지우므로, 화면 진입/복귀 때 서버 기준으로 맞춘다.
    const syncFromServer = async () => {
      const ids = await fetchServerSubscribedIds();
      if (!ids) return;
      const local = loadSubscriptions();
      if (local.size === ids.length && ids.every((id) => local.has(id))) return;
      const next = new Set(ids);
      saveSubscriptions(next);
      setSubscriptions(next);
    };
    syncFromServer();
    const onVisible = () => document.visibilityState === "visible" && syncFromServer();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "기기 정보를 불러오지 못했습니다.");
        return;
      }
      setError(null);
      setNow(data.now);
      setDevices(
        data.devices.map((d: DeviceView) => {
          if (d.remainingSeconds == null) {
            delete remainingRef.current[d.deviceId];
            return { ...d, remainingEndAt: null };
          }

          const prev = remainingRef.current[d.deviceId];
          const remainingEndAt =
            prev && prev.remainingSeconds === d.remainingSeconds
              ? prev.remainingEndAt
              : data.now + d.remainingSeconds * 1000;

          remainingRef.current[d.deviceId] = { remainingSeconds: d.remainingSeconds, remainingEndAt };
          return { ...d, remainingEndAt };
        })
      );
    } catch (e: any) {
      setError(e.message ?? "네트워크 오류");
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const id = setInterval(fetchDevices, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchDevices]);

  useEffect(() => {
    const clientId = getClientId();
    if (!clientId) return;
    const ping = () =>
      fetch("/api/analytics/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      }).catch(() => {});
    ping();
    const id = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const toggleSubscribe = useCallback(
    async (deviceId: string) => {
      const next = new Set(subscriptions);
      if (next.has(deviceId)) next.delete(deviceId);
      else next.add(deviceId);

      setSubscriptions(next);
      saveSubscriptions(next);

      const result = await syncPushSubscription([...next]);
      if (!result.ok) {
        setSubscribeStatus(result.reason ?? "error");
        setSubscribeError(result.reason === "error" ? String((result as any).error?.message ?? result.error) : null);
        // 알림 등록에 실패하면 구독 상태를 되돌린다.
        next.delete(deviceId);
        setSubscriptions(new Set(next));
        saveSubscriptions(next);
      } else {
        setSubscribeStatus("idle");
        setSubscribeError(null);
      }
    },
    [subscriptions]
  );

  return { devices, now, error, subscriptions, subscribeStatus, subscribeError, toggleSubscribe };
}
