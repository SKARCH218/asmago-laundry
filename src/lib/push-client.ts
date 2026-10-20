"use client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

async function getSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

async function subscribe(): Promise<PushSubscription> {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY가 설정되지 않았습니다.");

  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });
}

// 로컬에 저장된 전체 구독 기기 목록(deviceIds)을 서버와 동기화한다.
// 매번 전체 목록을 보내 서버 쪽 레코드를 통째로 교체하는 방식이라 별도 unsubscribe 처리가 필요 없다.
export async function syncPushSubscription(deviceIds: string[]) {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" as const };

  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    if (result !== "granted") return { ok: false, reason: "denied" as const };
  }
  if (Notification.permission !== "granted") {
    return { ok: false, reason: "denied" as const };
  }

  try {
    const sub = deviceIds.length > 0 ? await subscribe() : await getSubscription();
    if (!sub) return { ok: true };

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), deviceIds }),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error" as const, error: e };
  }
}

// 기기 알림과 무관하게 이 브라우저의 푸시 구독만 확보한다(글 댓글 알림용). 권한 요청도 여기서 처리한다.
export async function ensurePushSubscription() {
  if (!isPushSupported()) return { ok: false as const, reason: "unsupported" as const };
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission !== "granted") return { ok: false as const, reason: "denied" as const };
  try {
    const sub = await subscribe();
    return { ok: true as const, subscription: sub.toJSON() };
  } catch (e) {
    return { ok: false as const, reason: "error" as const, error: e };
  }
}

// 서버에 남아있는 이 브라우저의 구독 기기 목록(없으면 null: 푸시 미구독/미지원).
export async function fetchServerSubscribedIds(): Promise<string[] | null> {
  if (!isPushSupported() || Notification.permission !== "granted") return null;
  try {
    const sub = await getSubscription();
    if (!sub) return null;
    const res = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()).deviceIds as string[];
  } catch {
    return null;
  }
}
