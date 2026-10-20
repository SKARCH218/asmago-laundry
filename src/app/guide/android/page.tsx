import Link from "next/link";
import { AndroidLogo } from "@/components/PlatformIcons";
import InstallAppButton from "@/components/InstallAppButton";

export default function AndroidGuidePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-xl mx-auto px-6 py-6">
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
            ← 홈으로
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <AndroidLogo className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold text-neutral-900">Android 알림 설정</h1>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8">
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm px-4 py-3 leading-relaxed">
          안드로이드는 지금 브라우저 상태로도 알림이 오긴 하지만, <b>앱으로 설치하면 훨씬 안정적</b>이에요.
          브라우저 탭은 배터리 절전 모드에 걸리면 알림이 늦게 몰려서 오는데, 앱으로 설치하면 그럴 확률이 줄고
          진동 패턴도 더 잘 동작해요.
        </div>

        <InstallAppButton />

        <ol className="space-y-5 mt-2">
          <Step n={1} title='위 "앱으로 설치하기" 버튼 누르기'>
            버튼이 안 보이면 이미 설치되어 있거나, 브라우저가 삼성 인터넷처럼 설치를 직접 지원 안 하는
            경우예요 — 그때는 브라우저 메뉴(⋮)에서 <b>"앱 설치"</b> 또는 <b>"홈 화면에 추가"</b>를 찾아주세요.
          </Step>
          <Step n={2} title="설치 후 앱 아이콘으로 열기">
            홈 화면에 생긴 아스마고 세탁실 아이콘으로 열어주세요.
          </Step>
          <Step n={3} title='세탁실에서 "완료되면 알림받기" 누르기'>
            원하는 세탁실/기기에서 버튼을 누르고 <b>알림 허용</b>을 선택하면 완료예요.
          </Step>
          <Step n={4} title="배터리 절전 대상에서 제외 (중요)">
            설정 → 앱 → (브라우저 또는 아스마고 세탁실) → 배터리 → <b>"제한 없음"</b>으로 바꿔주세요. 삼성
            인터넷 등 일부 브라우저는 절전 모드 때문에 알림이 늦게 몰려서 올 수 있어요.
          </Step>
        </ol>

        <div className="mt-8 rounded-xl border border-neutral-200 bg-white text-neutral-600 text-sm px-4 py-3 leading-relaxed">
          💡 세탁기에 붙어있는 QR을 찍으면 앱 설치 없이도 그 기기 알림만 바로 신청할 수 있어요. 다만 위 방법으로
          앱을 설치해두면 배터리 절전 영향을 덜 받아서 알림이 더 정확한 시점에 옵니다.
        </div>
      </main>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <div className="text-sm text-neutral-500 mt-0.5 leading-relaxed">{children}</div>
      </div>
    </li>
  );
}
