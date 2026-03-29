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
function InfoCard({ item }: { item: LocalInfoItem }) {
  const isEvent = item.category === "행사";
  return (
    <a href="/blog" className="card">
      {/* 카테고리 배지 */}
      <span className={`card-badge ${isEvent ? "badge-event" : "badge-benefit"}`}>
        {isEvent ? "🎪" : "💰"} {item.category}
      </span>

      {/* 제목 */}
      <p className="card-name">{item.name}</p>

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
  const allPosts = getSortedPostsData().slice(0, 3); // 최신 글 3개만 가져오기
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
          {allPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}/`} className="blog-card">
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
            </Link>
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
          {events.map((item) => (
            <InfoCard key={item.id} item={item} />
          ))}
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
          {benefits.map((item) => (
            <InfoCard key={item.id} item={item} />
          ))}
        </div>
      </section>

    </main>
  );
}
