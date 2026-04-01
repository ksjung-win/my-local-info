import fs from "fs";
import path from "path";
import { getSortedPostsData } from "@/lib/posts";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

// ── 타입 정의 ──────────────────────────────────────
interface LocalInfoItem {
  id: number;
  name: string;
  category: "행사" | "혜택";
  startDate: string;
  endDate: string;
  location: string;
  target: string;
  summary: string;
  link: string;
  slug?: string;
}

interface LocalInfoData {
  lastUpdated: string;
  source: string;
  items: LocalInfoItem[];
}

// ── 데이터 로드 (빌드 시 JSON 파일에서 읽기) ─────────
function getLocalInfoData(): LocalInfoData {
  const filePath = path.join(process.cwd(), "public", "data", "local-info.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

// ── 날짜 포맷 변환 (NaN 방지) ──────────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === "상시") return "상시";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function getDateRange(startDate: string, endDate: string): string {
  if (!startDate || startDate === "상시") return "상시 운영";
  if (startDate === endDate) return formatDate(startDate);
  if (endDate === "상시") return `${formatDate(startDate)} ~ 상시`;
  return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
}

// ── 카드 컴포넌트 ────────────────────────────────────
function InfoCard({ item, slug }: { item: LocalInfoItem, slug?: string }) {
  const isEvent = item.category === "행사";
  
  // 확실한 링크 생성 (slug가 있으면 상세페이지, 없으면 블로그 목록)
  const targetHref = slug ? `/blog/${slug}` : "/blog";
  
  return (
    <a href={targetHref} className="card" data-slug={slug || "none"}>
      {/* 카테고리 배지 */}
      <span className={`card-badge ${isEvent ? "badge-event" : "badge-benefit"}`}>
        {isEvent ? "🎪" : "💰"} {item.category}
      </span>

      {/* 제목 */}
      <h3 className="card-name">{item.name}</h3>

      {/* 요약 */}
      <p className="card-summary">{item.summary}</p>

      {/* 메타 정보 */}
      <div className="card-meta">
        <div className="meta-row">
          <span className="meta-icon">📅</span>
          <span>{getDateRange(item.startDate, item.endDate)}</span>
        </div>
        {item.location && (
          <div className="meta-row">
            <span className="meta-icon">📍</span>
            <span>{item.location}</span>
          </div>
        )}
        <div className="meta-row">
          <span className="meta-icon">👤</span>
          <span>{item.target}</span>
        </div>
      </div>

      {/* 하단 링크 */}
      <div className="card-footer">
        <span className="card-link">자세히 보기</span>
        <span className="card-arrow">→</span>
      </div>
    </a>
  );
}

// ── 메인 페이지 ──────────────────────────────────────
export default function Home() {
  const data = getLocalInfoData();
  const allPosts = getSortedPostsData(); // 전체 글 가져오기 (매칭용)
  const recentPosts = allPosts.slice(0, 3); // 최신 글 3개만 (표시용)
  const events = data.items.filter((item) => item.category === "행사");
  const benefits = data.items.filter((item) => item.category === "혜택");

  // ── 모든 항목에 대한 절대 링크 매핑 (무조건 연결 보장) ──
  const FIXED_SLUGS: Record<string | number, string> = {
    1: "blog-event-1", // 성남시 봄꽃 축제
    2: "blog-event-2", // 판교 청년 창업 박람회
    3: "blog-event-3", // 성남시 어린이날 큰잔치
    4: "blog-benefit-1", // 성남시 청년 월세 지원금
    5: "blog-benefit-1", // 경기도 출산지원금 (성남시와 유사하므로 임시 연결)
    6: "blog-benefit-1", // 유아학비 (누리과정) 지원
    7: "blog-benefit-1", // 근로·자녀장려금
    8: "blog-benefit-1", // 주택금융공사 월세자금보증
    9: "blog-benefit-2"  // 친환경 에너지절감장비 보급
  };

  const eventJsonLds = events.map(item => ({
    "@context": "https://schema.org",
    "@type": "Event",
    "name": item.name,
    "startDate": item.startDate,
    "endDate": item.endDate === "상시" ? "2026-12-31" : item.endDate,
    "location": {
      "@type": "Place",
      "name": item.location || "온라인/성남시 관내"
    },
    "description": item.summary
  }));

  const benefitJsonLds = benefits.map(item => ({
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    "name": item.name,
    "description": item.summary,
    "provider": {
      "@type": "GovernmentOrganization",
      "name": "성남시"
    }
  }));

  return (
    <main className="main-content">
      {/* 고유 ID 헤더 (업데이트 확인용) */}
      <div className="text-[10px] opacity-10 text-right">Ver. 20260331-2025</div>

      <header className="site-header">
        <div className="header-badge">성남시 생활정보 통합 채널</div>
        <h1 className="header-title" style={{ marginTop: '24px' }}>우리 동네 생활 정보</h1>
        <p className="header-subtitle">성남시의 최신 행사와 혜택을 매일 업데이트합니다</p>
      </header>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([...eventJsonLds, ...benefitJsonLds]) }}
      />

      <AdBanner />

      {/* ── 최신 생활 정보 프리뷰 섹션 ── */}
      <section className="mt-12 mb-16">
        <div className="section-header">
          <span className="section-icon">🆕</span>
          <h2 className="section-title">최신 업데이트 정보</h2>
          <span className="section-count">성남시 최신 소식 {recentPosts.length}건</span>
        </div>
        
        <div className="card-grid">
          {recentPosts.map((post) => {
            // 해당 포스트에 맞는 데이터 매칭 시도
            const matchedItem = data.items.find(item => post.title.includes(item.name)) || {
              category: post.category || "정보",
              summary: post.summary,
              startDate: "2026-04-01",
              endDate: "상시",
              location: "성남시",
              target: "성남 시민",
              name: post.title
            };
            return <InfoCard key={post.slug} item={matchedItem as any} slug={post.slug} />;
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/blog" className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg hover:-translate-y-1">
            <span>나머지 {allPosts.length - recentPosts.length}개의 정보 더 보기</span>
            <span className="text-xl">→</span>
          </Link>
        </div>
      </section>

      {/* ── 주요 서비스 포털 안내 ── */}
      <section className="bg-orange-50 rounded-3xl p-10 border border-orange-100 text-center mb-16 shadow-inner">
        <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">원하는 정보를 찾으시나요?</h3>
        <p className="text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          축제, 행사, 지원금 등 모든 카테고리의 정보를 한눈에 보시려면 <br/> 
          <strong>블로그 전체보기</strong> 게시판을 이용해 보세요.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/blog" className="bg-white text-orange-600 border-2 border-orange-200 px-6 py-3 rounded-xl font-bold hover:bg-orange-600 hover:text-white transition-all shadow-sm">
            🎡 축제/행사 전체보기
          </Link>
          <Link href="/blog" className="bg-white text-indigo-600 border-2 border-indigo-200 px-6 py-3 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
            💰 복지/혜택 전체보기
          </Link>
        </div>
      </section>

      <div className="divider opacity-20" />
      <AdBanner />
    </main>
  );
}
