import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 정적 배포용 설정
  output: "export",        // 정적 HTML 파일로 내보내기
  trailingSlash: true,     // URL 끝에 슬래시 추가 (예: /about/)
  images: {
    unoptimized: true,     // Cloudflare는 서버가 없어서 이미지 최적화 비활성화
  },
};

export default nextConfig;
