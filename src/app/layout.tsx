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
        {/* ── 상단 네비게이션 (Sticky Glassmorphism) ── */}
        <nav className="fixed top-0 left-0 w-full z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 transition-all">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-white font-black text-xl tracking-wider flex items-center gap-1">
              LOCAL<span className="text-[#7950f2]">INFO</span><span className="text-xs font-medium ml-2 px-2 py-0.5 bg-white/10 rounded-full opacity-80">생활정보</span>
            </Link>
            <div className="flex gap-6">
              <Link href="/" className="text-sm font-bold text-white/70 hover:text-white transition-colors">홈</Link>
              <Link href="/blog" className="text-sm font-bold text-white/70 hover:text-white transition-colors">모든 혜택</Link>
            </div>
          </div>
        </nav>

        {/* ── 메인 헤더 ── */}
        <header className="site-header">
          <Link href="/" className="inline-block mt-8">
            <div className="header-badge">
              <span className="animate-pulse text-[#7950f2]">●</span> 실시간 전국 혜택 업데이트
            </div>
            <h1 className="header-title">전국 꿀정보 & 혜택</h1>
            <p className="header-subtitle">
              숨어있는 전국 지원금, 혜택, 그리고 즐거운 축제 소식을 <br/>
              가장 빠르고 정확하게 분석하여 전달해 드립니다.
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
