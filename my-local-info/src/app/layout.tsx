import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "성남시 생활 정보 | 우리 동네 행사·축제·혜택",
  description:
    "성남시의 행사, 축제, 지원금, 혜택 정보를 한곳에서 확인하세요. 공공데이터포털 기반으로 매일 자동 업데이트됩니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {children}
      </body>
    </html>
  );
}
