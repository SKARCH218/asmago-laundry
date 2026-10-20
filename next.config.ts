import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 서버에 같은 와이파이(기숙사 공유기)의 다른 기기에서 접속할 수 있도록 허용.
  allowedDevOrigins: ["192.168.1.13", "192.168.1.*"],
};

export default nextConfig;
