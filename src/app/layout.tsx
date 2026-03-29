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
      </head>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "성남시 생활 정보",
                "url": "https://infos-info.com",
                "description": "성남시 주민을 위한 지역 행사, 축제, 지원금, 혜택 정보"
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://infos-info.com" },
                  { "@type": "ListItem", "position": 2, "name": "블로그", "item": "https://infos-info.com/blog" }
                ]
              }
            ])
          }}
        />
        {/* ── 헤더 ── */}
        <header className="site-header">
          <nav style={{ position: 'absolute', top: '20px', right: '24px', zIndex: 10, display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', opacity: 0.9 }}>홈</Link>
            <Link href="/about" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', opacity: 0.9 }}>소개</Link>
            <Link href="/blog" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', opacity: 0.9 }}>블로그</Link>
          </nav>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="header-emoji">🍊</span>
            <h1 className="header-title" style={{ color: '#e67e22' }}>성남시 생활 정보</h1>
          </Link>
          <p className="header-subtitle">
            우리 동네의 따끈따끈한 소식을 전해드립니다
          </p>

          <span className="header-badge">📡 매일 자동 업데이트</span>
        </header>

        {children}

        {/* ── 푸터 ── */}
        <footer className="site-footer" style={{ marginTop: 'auto' }}>
          <div className="footer-row">
            <span>데이터 출처:</span>
            <a
              href="https://www.data.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              공공데이터포털 (data.go.kr)
            </a>
            <span className="footer-dot">•</span>
            <span>성남시 생활 정보</span>
          </div>
          <p className="footer-copy">
            © 2026 성남시 생활 정보 · 본 사이트의 데이터는 공공데이터를 기반으로 합니다.
          </p>
        </footer>
      </body>
    </html>
  );
}
