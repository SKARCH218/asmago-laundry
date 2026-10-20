self.addEventListener("push", (event) => {
  let data = { title: "아스마고 세탁실", body: "세탁이 완료됐어요." };
  try {
    data = event.data.json();
  } catch {
    // ignore malformed payload, use default
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo.png",
      badge: "/logo.png",
      // 웹푸시는 커스텀 알림음을 지정할 수 없어(Web Notification API 자체 미지원),
      // 대신 강한 진동 패턴 + 화면에 계속 남기는 것으로 최대한 눈에 띄게 한다.
      vibrate: [300, 150, 300, 150, 300],
      // 세탁 완료는 눈에 띄게 계속 남기고, 게시판 같은 공지성 알림은 기본 동작으로 둔다.
      requireInteraction: data.requireInteraction ?? true,
      tag: data.tag ?? "asmago-laundry-complete",
      renotify: true,
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      const url = event.notification.data?.url ?? "/";
      if (clientList.length > 0) {
        return clientList[0].navigate(url).then((c) => (c ? c.focus() : clientList[0].focus()));
      }
      return self.clients.openWindow(url);
    })
  );
});
