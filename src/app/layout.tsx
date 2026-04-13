import type { Metadata } from "next";
import Link from 'next/link';
import "./globals.css";

export const metadata: Metadata = {
  title: "성남시 생활 정보 | 행사·혜택·지원금 안내",
  description: "성남시 주민을 위한 지역 행사, 축제, 지원금, 혜택 정보를 매일 업데이트합니다.",
  openGraph: {
    title: "성남시 생활 정보 | 행사·혜택·지원금 안내",
    description: "성남시 주민을 위한 지역 행사, 축제, 지원금, 혜택 정보를 매일 업데이트합니다.",
    url: "https://infos-info.com",
    siteName: "성남시 생활 정보",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  const showAd = adId && adId !== "나중에_입력";

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const showGa = gaId && gaId !== "나중에_입력";

  return (
    <html lang="ko">
      <head>
        {showAd && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adId}`}
            crossOrigin="anonymous"
          ></script>
        )}
        {showGa && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="flex flex-col min-h-screen">
        {/* ── 헤더 ── */}
        <header className="site-header">
          <nav className="absolute top-6 right-6 z-10 flex gap-6">
            <Link href="/" className="text-white/80 hover:text-white font-bold text-sm transition-colors">홈</Link>
            <Link href="/about" className="text-white/80 hover:text-white font-bold text-sm transition-colors">소개</Link>
            <Link href="/blog" className="text-white/80 hover:text-white font-bold text-sm transition-colors">블로그</Link>
          </nav>
          
          <Link href="/" className="inline-block">
            <div className="header-badge">
              <span className="animate-pulse">●</span> 매일 업데이트되는 생활정보
            </div>
            <h1 className="header-title">성남시 생활 정보</h1>
            <p className="header-subtitle">
              성남시 주민들을 위한 맞춤형 혜택과 즐거운 행사 소식을 <br/>
              공공데이터 기반으로 가장 빠르게 전달해 드립니다.
            </p>
          </Link>
        </header>

        {children}

        {/* ── 푸터 ── */}
        <footer className="site-footer">
          <span className="footer-logo">성남시 생활 정보</span>
          <div className="footer-row">
            <a href="https://www.data.go.kr" target="_blank" rel="noopener noreferrer" className="footer-link">공공데이터포털</a>
            <span className="footer-dot">•</span>
            <Link href="/about" className="footer-link">사이트 소개</Link>
            <span className="footer-dot">•</span>
            <Link href="/privacy" className="footer-link">개인정보처리방침</Link>
          </div>
          <p className="footer-copy">
            © 2026 성남시 생활 정보 · 모든 정보는 공공데이터 API를 통해 실시간으로 수집 및 분석됩니다.
          </p>
        </footer>
      </body>
    </html>
  );
}
