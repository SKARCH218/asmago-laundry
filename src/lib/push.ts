import webpush from "web-push";
import { getSubscriptionsForDevice, removeSubscription, removePostWatchers, type PostWatcher } from "@/lib/store";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID 키가 설정되지 않았습니다. .env.local을 확인하세요.");
  }
  webpush.setVapidDetails("mailto:admin@asmago.local", publicKey, privateKey);
  configured = true;
}

export async function notifyDeviceComplete(deviceId: string, label: string) {
  ensureConfigured();
  const subs = getSubscriptionsForDevice(deviceId);
  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title: "세탁 완료!",
    body: `${label} 세탁이 끝났어요. 지금 가지러 가세요.`,
  });

  await Promise.all(
    subs.map(async ({ endpoint, subscription }) => {
      try {
        await webpush.sendNotification(subscription as webpush.PushSubscription, payload);
      } catch (err: any) {
        // 만료되었거나 더 이상 유효하지 않은 구독은 정리한다.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          removeSubscription(endpoint);
        }
      }
    })
  );
}

// 분실물 글에 댓글이 달렸을 때: 글 알림을 켜둔 브라우저(작성자 본인 제외)에 보낸다.
export async function notifyPostWatchers(
  postId: string,
  watchers: PostWatcher[],
  payload: { title: string; body: string }
) {
  if (watchers.length === 0) return;
  ensureConfigured();
  const message = JSON.stringify({ ...payload, url: `/board/${postId}`, tag: `asmago-post-${postId}`, requireInteraction: false });
  const dead: string[] = [];
  await Promise.all(
    watchers.map(async ({ endpoint, subscription }) => {
      try {
        await webpush.sendNotification(subscription as webpush.PushSubscription, message);
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) dead.push(endpoint);
      }
    })
  );
  removePostWatchers(postId, dead);
}
