import fs from "fs";
import path from "path";
import { getSortedPostsData } from "@/lib/posts";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import CategoryBoard, { LocalInfoItem } from "@/components/CategoryBoard";

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

// ── 메인 페이지 ──────────────────────────────────────
export default function Home() {
  const data = getLocalInfoData();
  const allPosts = getSortedPostsData();

  // ── 모든 항목에 대한 절대 링크 매핑 (무조건 연결 보장) ──
  const FIXED_SLUGS: Record<string | number, string> = {
    1: "blog-event-1", // 성남시 봄꽃 축제
    2: "blog-event-2", // 판교 청년 창업 박람회
    3: "blog-event-3", // 성남시 어린이날 큰잔치
    9: "blog-benefit-2",  // 친환경 에너지절감장비 보급
    11: "2026-04-03-NuriEducationSupport", // 유아학비
    16: "2026-04-03-NuriEducationSupport" // 신규 항목 매핑 추가
  };

  return (
    <main className="main-content">
      {/* 인터랙티브 카테고리 필터 보드 (클라이언트 컴포넌트) */}
      <CategoryBoard items={data.items} allPosts={allPosts} fixedSlugs={FIXED_SLUGS} />

      <AdBanner />
    </main>
  );
}
