"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { getAllDeviceLabels, DeviceLabelInfo } from "@/lib/deviceLabels";

export default function PrintCardsPage() {
  const [origin, setOrigin] = useState("");
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const labels = getAllDeviceLabels();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!origin) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        labels.map(async (d) => {
          const url = `${origin}/subscribe/${d.label}`;
          const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 240 });
          return [d.label, dataUrl] as const;
        })
      );
      if (!cancelled) setQrCodes(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin]);

  return (
    <div className="min-h-screen bg-neutral-100 py-6 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 mb-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">QR 카드 인쇄</h1>
          <p className="text-sm text-neutral-500">A4 한 장에 8장씩(4열 x 2행), 총 {labels.length}장</p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-neutral-900 text-white text-sm font-medium px-5 py-2.5"
        >
          인쇄하기
        </button>
      </div>

      <div className="cards-sheet">
        {labels.map((d) => (
          <Card key={d.label} device={d} qrDataUrl={qrCodes[d.label]} />
        ))}
      </div>

      <style>{`
        .cards-sheet {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          width: 297mm;
          margin: 0 auto;
          background: white;
        }
        .card {
          width: 74.25mm;
          height: 105mm;
          box-sizing: border-box;
          border: 1px dashed #ccc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 4mm;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .card:nth-child(8n+1) {
          page-break-before: always;
        }
        @media print {
          .card:nth-child(8n+1) {
            page-break-before: always;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

function Card({ device, qrDataUrl }: { device: DeviceLabelInfo; qrDataUrl?: string }) {
  return (
    <div className="card">
      <div className="flex flex-col items-center gap-1 mt-[8mm]">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt={device.label} className="w-[42mm] h-[42mm]" />
        ) : (
          <div className="w-[42mm] h-[42mm] bg-neutral-100" />
        )}
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <p className="text-[9px] text-neutral-400 tracking-wide">{device.label}</p>
        <p className="text-sm font-bold text-neutral-900 text-center leading-tight">
          {device.posText ? `${device.number}번 ${device.kindText} ${device.posText}` : `${device.number}번 ${device.kindText}`}
        </p>
        <p className="text-[9px] text-neutral-400 text-center">{device.roomLabel}</p>
      </div>

      <div className="flex items-center gap-1.5 mb-[8mm]">
        <Image src="/logo.png" alt="" width={16} height={9.5} className="object-contain" />
        <span className="text-[10px] font-semibold text-neutral-700">아스마고 세탁실</span>
      </div>
    </div>
  );
}
