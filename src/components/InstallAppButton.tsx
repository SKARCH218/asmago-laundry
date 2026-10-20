"use client";

import { useEffect, useState } from "react";

// 안드로이드 크롬 등은 PWA 설치가 가능해지면 beforeinstallprompt 이벤트를 쏴준다.
// 이걸 가로채서 브라우저 기본 배너 대신 우리 UI에 맞는 버튼으로 설치를 띄운다.
// iOS 사파리는 이 이벤트 자체가 없어서(수동으로 "공유 > 홈 화면에 추가"만 가능) 버튼이 안 뜬다.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !deferredPrompt) return null;

  return (
    <button
      onClick={async () => {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setInstalled(true);
        setDeferredPrompt(null);
      }}
      className="w-full mb-6 flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white text-sm font-medium py-3"
    >
      📲 앱으로 설치하기
    </button>
  );
}
