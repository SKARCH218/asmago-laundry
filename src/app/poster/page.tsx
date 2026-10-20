"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";

export default function PosterPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>();

  useEffect(() => {
    QRCode.toDataURL("http://xn--299at8vn0g1wc.kro.kr", { margin: 1, width: 480 }).then(setQrDataUrl);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 py-6 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto px-4 mb-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">홍보 포스터 인쇄</h1>
          <p className="text-sm text-neutral-500">A4 한 장</p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-neutral-900 text-white text-sm font-medium px-5 py-2.5"
        >
          인쇄하기
        </button>
      </div>

      <div className="poster">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={44} height={26} className="object-contain" />
          <span className="text-2xl font-bold text-neutral-500 tracking-wide">아스마고 세탁실</span>
        </div>

        <div className="flex flex-col items-center gap-3 mt-[14mm]">
          <p className="text-[13mm] font-black leading-[1.15] text-center text-neutral-900">
            내 휴대폰으로
            <br />
            세탁실 현황을
            <br />
            <span className="text-blue-600">실시간</span>으로 본다고?
          </p>
          <p className="text-[6mm] font-medium text-neutral-500 text-center mt-2">
            지금 사용중인지 몰라서 헛걸음할 필요 없이,
            <br />
            다 됐는데 못 가져가는 일도 없이.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 mt-[14mm]">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR" className="w-[62mm] h-[62mm] border-4 border-white shadow-lg rounded-xl" />
          ) : (
            <div className="w-[62mm] h-[62mm] bg-neutral-200 rounded-xl" />
          )}
          <p className="text-[7mm] font-bold text-neutral-900">QR 찍고 바로 확인하기</p>
          <p className="text-[5mm] text-neutral-400">아스마고.kro.kr</p>
        </div>

        <div className="features">
          <Feature emoji="🧺" text="세탁기·건조기 사용중/대기중 실시간 확인" />
          <Feature emoji="🔔" text="세탁 끝나면 알림으로 바로 알려드려요" />
          <Feature emoji="📱" text="앱 설치 없이 QR/링크로 바로 이용" />
        </div>
      </div>

      <style>{`
        @font-face {
          font-family: "TossFaceFontMac";
          src: url("/fonts/TossFaceFontMac.ttf") format("truetype");
          font-display: swap;
        }
        .emoji {
          font-family: "TossFaceFontMac", sans-serif;
        }
        .poster {
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          margin: 0 auto;
          background: white;
          padding: 12mm 14mm;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .features {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 6mm;
          width: 100%;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

function Feature({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-3 bg-neutral-50 rounded-2xl px-[8mm] py-[5mm]">
      <span className="emoji text-[9mm]">{emoji}</span>
      <span className="text-[5.5mm] font-semibold text-neutral-800">{text}</span>
    </div>
  );
}
