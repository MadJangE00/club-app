import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 이미지 최적화 끄기 (빌드 속도 향상)
  images: {
    unoptimized: true,
  },
  // 빌드 출력 최적화
  output: "standalone",
};

export default nextConfig;
