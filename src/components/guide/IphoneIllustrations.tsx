// 실제 스크린샷 대신, 저작권 문제 없이 핵심 위치만 짚어주는 간단한 설명용 일러스트.

export function ShareButtonIllustration() {
  return (
    <svg viewBox="0 0 280 160" className="w-full max-w-[280px] mx-auto" role="img" aria-label="Safari 하단 공유 버튼 위치">
      <rect x="1" y="1" width="278" height="158" rx="18" fill="#fff" stroke="#e5e5e5" strokeWidth="2" />
      {/* 주소창 */}
      <rect x="16" y="16" width="248" height="26" rx="8" fill="#f5f5f5" />
      <circle cx="30" cy="29" r="5" fill="#d4d4d4" />
      <rect x="44" y="24" width="120" height="10" rx="5" fill="#d4d4d4" />
      {/* 본문 영역 */}
      <rect x="16" y="54" width="248" height="60" rx="8" fill="#fafafa" />
      <rect x="28" y="66" width="140" height="10" rx="5" fill="#e5e5e5" />
      <rect x="28" y="84" width="100" height="10" rx="5" fill="#e5e5e5" />
      {/* 하단 툴바 */}
      <rect x="1" y="124" width="278" height="35" rx="0" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1" />
      <g opacity="0.35">
        <path d="M40 133 v18 M32 140 h16" stroke="#a3a3a3" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M100 151 a10 10 0 1 0 -0.1 0" stroke="#a3a3a3" strokeWidth="2.5" fill="none" />
      </g>
      {/* 공유 버튼 강조 */}
      <circle cx="170" cy="142" r="20" fill="#dbeafe" />
      <path
        d="M170 132 v16 M163 138 l7 -7 l7 7 M161 148 h18"
        stroke="#2563eb"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <g opacity="0.35">
        <path d="M235 132 l8 20 h-16 z" stroke="#a3a3a3" strokeWidth="2.2" fill="none" />
      </g>
      <text x="170" y="122" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2563eb">
        여기!
      </text>
    </svg>
  );
}

export function AddToHomeScreenIllustration() {
  return (
    <svg viewBox="0 0 280 200" className="w-full max-w-[280px] mx-auto" role="img" aria-label='공유 메뉴에서 "홈 화면에 추가" 위치'>
      <rect x="1" y="1" width="278" height="198" rx="18" fill="#fff" stroke="#e5e5e5" strokeWidth="2" />
      {/* 시트 핸들 */}
      <rect x="120" y="12" width="40" height="5" rx="2.5" fill="#e5e5e5" />
      {/* 상단 앱 아이콘 줄 */}
      <g>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={20 + i * 62} y="28" width="46" height="46" rx="12" fill="#f0f0f0" />
        ))}
      </g>
      {/* 메뉴 리스트 */}
      <rect x="16" y="90" width="248" height="1" fill="#eee" />
      <MenuRow y={98} label="복사하기" />
      <MenuRow y={130} label="즐겨찾기에 추가" />
      {/* 강조된 항목 */}
      <rect x="16" y="160" width="248" height="32" rx="8" fill="#dbeafe" />
      <rect x="28" y="171" width="16" height="16" rx="4" fill="none" stroke="#2563eb" strokeWidth="2" />
      <path d="M36 175 v8 M32 179 h8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
      <text x="52" y="182" fontSize="12" fontWeight="700" fill="#1d4ed8">
        홈 화면에 추가
      </text>
      <text x="264" y="182" textAnchor="end" fontSize="11" fontWeight="700" fill="#2563eb">
        ← 여기
      </text>
    </svg>
  );
}

function MenuRow({ y, label }: { y: number; label: string }) {
  return (
    <>
      <rect x="28" y={y - 9} width="14" height="14" rx="3" fill="#eee" />
      <text x="52" y={y + 2} fontSize="12" fill="#a3a3a3">
        {label}
      </text>
    </>
  );
}
