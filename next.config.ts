import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // 이미지 최적화 끄기 (빌드 속도 향상)
  images: {
    unoptimized: true,
  },
  // 빌드 출력 최적화
  output: "standalone",
  // webpack 강제 사용 (next-pwa 호환)
  turbopack: {},
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default withPWA(nextConfig as any);
