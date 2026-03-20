import fs from "fs";
import path from "path";

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
    <a href={item.link} className="card">
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
  const events = data.items.filter((item) => item.category === "행사");
  const benefits = data.items.filter((item) => item.category === "혜택");

  return (
    <>
      {/* ── 헤더 ── */}
      <header className="site-header">
        <span className="header-emoji">🏘️</span>
        <h1 className="header-title">성남시 생활 정보</h1>
        <p className="header-subtitle">
          우리 동네 행사·축제·혜택 정보를 한곳에서 확인하세요
        </p>
        <span className="header-badge">📡 매일 자동 업데이트</span>
      </header>

      {/* ── 본문 ── */}
      <main className="main-content">

        {/* ── 행사/축제 섹션 ── */}
        <section className="section" style={{ marginTop: "32px" }}>
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

      {/* ── 푸터 ── */}
      <footer className="site-footer">
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
          <span>마지막 업데이트: {data.lastUpdated}</span>
        </div>
        <p className="footer-copy">
          © 2026 성남시 생활 정보 · 본 사이트의 데이터는 공공데이터를 기반으로 합니다.
        </p>
      </footer>
    </>
  );
}
