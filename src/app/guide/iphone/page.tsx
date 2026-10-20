import Link from "next/link";
import { AppleLogo } from "@/components/PlatformIcons";
import { ShareButtonIllustration, AddToHomeScreenIllustration } from "@/components/guide/IphoneIllustrations";

export default function IphoneGuidePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-xl mx-auto px-6 py-6">
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
            ← 홈으로
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <AppleLogo className="w-6 h-6 text-neutral-900" />
            <h1 className="text-xl font-bold text-neutral-900">iPhone 알림 설정</h1>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-3 leading-relaxed">
          ⚠️ 아이폰은 애플 정책상 <b>Safari로 "홈 화면에 추가"한 상태에서만</b> 알림이 옵니다. 그리고 아이폰은
          알림 종류가 <b>텍스트뿐</b>이라(진동 패턴·소리 커스텀 불가), 안드로이드보다 알림이 약하게 느껴질 수
          있어요. 무음 모드거나 화면이 꺼져 있으면 놓치기 쉬우니 참고해주세요.
        </div>

        <ol className="space-y-5">
          <Step n={1} title="꼭 Safari로 접속">
            크롬 등 다른 브라우저는 안 되고, <b>반드시 Safari</b>로 이 사이트에 들어와 있어야 해요.
          </Step>
          <Step n={2} title="하단 공유 버튼 누르기">
            화면 아래쪽(또는 주소창 옆) <b>공유 아이콘(□↑)</b>을 눌러주세요.
            <div className="mt-3 bg-neutral-50 rounded-xl p-3">
              <ShareButtonIllustration />
            </div>
          </Step>
          <Step n={3} title='"홈 화면에 추가" 선택'>
            메뉴를 아래로 내려서 <b>"홈 화면에 추가"</b>를 눌러 추가해주세요.
            <div className="mt-3 bg-neutral-50 rounded-xl p-3">
              <AddToHomeScreenIllustration />
            </div>
          </Step>
          <Step n={4} title="홈 화면 아이콘으로 다시 열기">
            방금 추가된 <b>아스마고 세탁실 아이콘</b>으로 앱처럼 열어주세요 (Safari 탭이 아니라 이 아이콘으로
            열어야 알림이 동작해요).
          </Step>
          <Step n={5} title='세탁실에서 "완료되면 알림받기" 누르기'>
            원하는 세탁실/기기에서 버튼을 누르고 <b>알림 허용</b>을 선택하면 완료예요.
          </Step>
        </ol>

        <div className="mt-8 rounded-xl border border-neutral-200 bg-white text-neutral-600 text-sm px-4 py-3 leading-relaxed">
          💡 세탁기에 붙어있는 QR을 찍어서 바로 알림 신청하는 것도 같은 원리예요 — 아이폰이면 QR을 찍기 전에
          먼저 위 방법대로 홈 화면에 추가해두셔야 알림이 옵니다.
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
