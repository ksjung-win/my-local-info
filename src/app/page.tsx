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

// ── 날짜 포맷 변환 ──────────────────────────────────
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function getDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDate(startDate);
  return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
}

// ── 카드 컴포넌트 ────────────────────────────────────
function InfoCard({ item, slug }: { item: LocalInfoItem, slug?: string }) {
  const isEvent = item.category === "행사";
  
  // 확실한 링크 생성 (slug가 있으면 상세페이지, 없으면 블로그 목록)
  const targetHref = slug ? `/blog/${slug}` : "/blog";
  
  return (
    <Link href={targetHref} className="card" data-slug={slug || "none"}>
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
    </Link>
  );
}

// ── 메인 페이지 ──────────────────────────────────────
export default function Home() {
  const data = getLocalInfoData();
  const allPosts = getSortedPostsData(); // 전체 글 가져오기 (매칭용)
  const recentPosts = allPosts.slice(0, 3); // 최신 글 3개만 (표시용)
  const events = data.items.filter((item) => item.category === "행사");
  const benefits = data.items.filter((item) => item.category === "혜택");

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([...eventJsonLds, ...benefitJsonLds]) }}
      />
      
      {/* ── 최신 블로그 소식 섹션 ── */}
      <section className="section" style={{ marginTop: "32px" }}>
        <div className="section-header">
          <span className="section-icon">📰</span>
          <h2 className="section-title">최신 블로그 소식</h2>
          <Link href="/blog" className="view-all">전체보기 →</Link>
        </div>
        <div className="card-grid" style={{ gridTemplateColumns: '1fr', gap: '20px' }}>
          {recentPosts.map((post) => (
            <a key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
              <div className="blog-card-header">
                <span className="blog-category">{post.category || "소식"}</span>
                <span className="blog-date">{post.date}</span>
              </div>
              <h3 className="blog-title">{post.title}</h3>
              <p className="blog-summary">{post.summary}</p>
              {post.tags && post.tags.length > 0 && (
                <div className="card-tags">
                  {post.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── 행사/축제 섹션 ── */}
      <section className="section">
        <div className="section-header">
          <span className="section-icon">🎪</span>
          <h2 className="section-title">이번 달 행사 · 축제</h2>
          <span className="section-count">{events.length}건</span>
        </div>
        <div className="card-grid">
          {events.map((item) => {
            // 1순위: 데이터에 명시된 slug 사용
            // 2순위: 기존 키워드 기반 매칭 (하위 호환성)
            let targetSlug = item.slug;
            
            if (!targetSlug) {
              const keywords = item.name.split(/\s+/).filter(w => w.length > 1);
              const matchedPost = allPosts.find(post => {
                const fullText = (post.title + " " + post.content).toLowerCase();
                const matchCount = keywords.filter(kw => fullText.includes(kw.toLowerCase())).length;
                return matchCount >= Math.max(1, Math.ceil(keywords.length * 0.7));
              });
              targetSlug = matchedPost?.slug;
            }
            
            return <InfoCard key={item.id} item={item} slug={targetSlug} />;
          })}
        </div>
      </section>

      <div className="divider" />
      <AdBanner />
      <div className="divider" />

      {/* ── 지원금/혜택 섹션 ── */}
      <section className="section">
        <div className="section-header">
          <span className="section-icon">💰</span>
          <h2 className="section-title">지원금 · 혜택 정보</h2>
          <span className="section-count">{benefits.length}건</span>
        </div>
        <div className="card-grid benefit-grid">
          {benefits.map((item) => {
             let targetSlug = item.slug;

             if (!targetSlug) {
               const keywords = item.name.split(/\s+/).filter(w => w.length > 1);
               const matchedPost = allPosts.find(post => {
                 const fullText = (post.title + " " + post.content).toLowerCase();
                 const matchCount = keywords.filter(kw => fullText.includes(kw.toLowerCase())).length;
                 return matchCount >= Math.max(1, Math.ceil(keywords.length * 0.7));
               });
               targetSlug = matchedPost?.slug;
             }
             
             return <InfoCard key={item.id} item={item} slug={targetSlug} />;
          })}
        </div>
      </section>

    </main>
  );
}
