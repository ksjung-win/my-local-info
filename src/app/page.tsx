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

// ── 카드 컴포넌트 (고도화 버전) ────────────────────────────────────
function InfoCard({ item, slug }: { item: LocalInfoItem, slug?: string }) {
  const isEvent = item.category === "행사";
  const targetHref = slug ? `/blog/${slug}` : "/blog";
  
  // 날짜 계산 (마감 임박 배지용)
  const today = new Date();
  const endDate = item.endDate === "상시" ? null : new Date(item.endDate);
  const isClosingSoon = endDate && (endDate.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 7 && (endDate.getTime() - today.getTime()) > 0;
  
  return (
    <a href={targetHref} className="card group" data-slug={slug || "none"}>
      <div className="flex justify-between items-start mb-4">
        <span className={`card-badge ${isEvent ? "badge-event" : "badge-benefit"}`}>
          {isEvent ? "🎨 행사/축제" : "🎁 복지/혜택"}
        </span>
        {isClosingSoon && <span className="card-badge badge-urgent">🔥 마감임박</span>}
      </div>

      <h3 className="card-name">{item.name}</h3>
      <p className="card-summary">{item.summary}</p>

      <div className="card-meta">
        {item.target && (
          <div className="meta-row">
            <span className="meta-icon">🎯</span>
            <span className="meta-label">대상</span>
            <span className="text-slate-800 line-clamp-1">{item.target}</span>
          </div>
        )}
        <div className="meta-row">
          <span className="meta-icon">📅</span>
          <span className="meta-label">기간</span>
          <span>{getDateRange(item.startDate, item.endDate)}</span>
        </div>
        {item.location && item.location !== "성남시" && (
          <div className="meta-row">
            <span className="meta-icon">📍</span>
            <span className="meta-label">장소</span>
            <span>{item.location}</span>
          </div>
        )}
      </div>

      <div className="card-footer">
        <span className="card-link group-hover:text-brand transition-colors">상세 정보 보기</span>
        <span className="card-arrow text-brand transition-all">→</span>
      </div>
    </a>
  );
}

// ── 메인 페이지 ──────────────────────────────────────
export default function Home() {
  const data = getLocalInfoData();
  const allPosts = getSortedPostsData();
  const recentPosts = allPosts.slice(0, 3);
  const events = data.items.filter((item) => item.category === "행사").slice(0, 6);
  const benefits = data.items.filter((item) => item.category === "혜택").slice(0, 6);

  // ── 모든 항목에 대한 절대 링크 매핑 (무조건 연결 보장) ──
  const FIXED_SLUGS: Record<string | number, string> = {
    1: "blog-event-1", // 성남시 봄꽃 축제
    2: "blog-event-2", // 판교 청년 창업 박람회
    3: "blog-event-3", // 성남시 어린이날 큰잔치
    4: "blog-benefit-1", // 성남시 청년 월세 지원금
    5: "blog-benefit-1", // 경기도 출산지원금
    6: "blog-benefit-1", // 유아학비 (누리과정) 지원
    7: "blog-benefit-1", // 근로·자녀장려금
    8: "blog-benefit-1", // 주택금융공사 월세자금보증
    9: "blog-benefit-2",  // 친환경 에너지절감장비 보급
    11: "2026-04-02-observer-boarding-support" // 최신 글 추가
  };

  return (
    <main className="main-content">
      {/* [1] 최근 소식 (상단 강조) */}
      <section className="mt-16 mb-24">
        <div className="section-header">
          <div className="section-title-wrap">
            <span className="text-2xl">✨</span>
            <h2 className="section-title">최근 업데이트 소식</h2>
          </div>
          <Link href="/blog" className="text-sm font-bold text-slate-400 hover:text-brand transition-colors">전체보기 →</Link>
        </div>
        <div className="card-grid">
          {recentPosts.map((post) => {
            const matchedItem = data.items.find(item => post.title.includes(item.name)) || {
              category: post.category || "정보",
              summary: post.summary,
              startDate: post.date,
              endDate: "상시",
              location: "성남시",
              target: "주민 누구나",
              name: post.title
            };
            return <InfoCard key={post.slug} item={matchedItem as any} slug={post.slug} />;
          })}
        </div>
      </section>

      <div className="divider" />

      {/* [2] 행사/축제 섹션 */}
      <section className="my-24">
        <div className="section-header">
          <div className="section-title-wrap">
            <span className="text-2xl">🎭</span>
            <h2 className="section-title">우리 동네 주요 행사</h2>
            <span className="section-count">{events.length}건</span>
          </div>
        </div>
        <div className="card-grid">
          {events.map((item) => {
            const slug = FIXED_SLUGS[item.id] || (allPosts.find(p => p.title.includes(item.name))?.slug);
            return <InfoCard key={item.id} item={item} slug={slug} />;
          })}
        </div>
      </section>

      <AdBanner />

      {/* [3] 복지/혜택 섹션 */}
      <section className="my-24 pb-20">
        <div className="section-header">
          <div className="section-title-wrap">
            <span className="text-2xl">💎</span>
            <h2 className="section-title">정부 및 지자체 지원금</h2>
            <span className="section-count">{benefits.length}건</span>
          </div>
        </div>
        <div className="card-grid">
          {benefits.map((item) => {
            const slug = FIXED_SLUGS[item.id] || (allPosts.find(p => p.title.includes(item.name))?.slug);
            return <InfoCard key={item.id} item={item} slug={slug} />;
          })}
        </div>
      </section>

      <AdBanner />
    </main>
  );
}
