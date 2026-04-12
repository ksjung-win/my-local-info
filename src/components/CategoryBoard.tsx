"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import CoupangBanner from "./CoupangBanner";

// ── 타입 정의 ──
export interface LocalInfoItem {
  id: number;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  target: string;
  summary: string;
  link: string;
  slug?: string;
}

interface CategoryBoardProps {
  items: LocalInfoItem[];
  allPosts: any[];
  fixedSlugs: Record<string | number, string>;
}

// ── 날짜 계산 헬퍼 ──
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

// ── 인포 카드 컴포넌트 ──
function InfoCard({ item, slug }: { item: LocalInfoItem, slug?: string }) {
  const isEvent = item.category === "행사" || item.category === "축제";
  
  // 블로그 글이 아직 렌더링되지 않은 신규 데이터 처리 (외부 링크 직접 연결)
  const isExternal = !slug && item.link && item.link !== "#";
  const targetHref = slug ? `/blog/${slug}` : isExternal ? item.link : `/blog`;
  
  const today = new Date();
  const endDate = item.endDate === "상시" ? null : new Date(item.endDate);
  const isClosingSoon = endDate && (endDate.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 7 && (endDate.getTime() - today.getTime()) > 0;
  
  return (
    <a 
      href={targetHref} 
      target={isExternal ? "_blank" : "_self"}
      rel={isExternal ? "noopener noreferrer" : ""}
      className="card" 
      data-slug={slug || "none"}
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`card-badge ${isEvent ? "badge-event" : "badge-benefit"}`}>
          {isEvent ? "🎨 행사/축제" : "🎁 복지/혜택"}
        </span>
        {isClosingSoon && <span className="card-badge badge-urgent hidden sm:inline-flex">🔥 마감임박</span>}
      </div>

      <h3 className="card-name">{item.name}</h3>
      <p className="card-summary">{item.summary}</p>

      <div className="card-meta">
        {item.target && (
          <div className="meta-row">
            <span className="meta-icon">🎯</span>
            <div className="flex flex-col">
              <span className="meta-label">대상</span>
              <span className="text-slate-800 line-clamp-1">{item.target}</span>
            </div>
          </div>
        )}
        <div className="meta-row">
          <span className="meta-icon">📅</span>
          <div className="flex flex-col">
            <span className="meta-label">기간</span>
            <span className="text-slate-800">{getDateRange(item.startDate, item.endDate)}</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <span className="card-link">{isExternal ? "공식 홈페이지 가기" : "상세 정보 보기"}</span>
        <span className="card-arrow">{isExternal ? "↗" : "→"}</span>
      </div>
    </a>
  );
}

// ── 클라이언트 필터링 보드 ──
export default function CategoryBoard({ items, allPosts, fixedSlugs }: CategoryBoardProps) {
  const [selectedTag, setSelectedTag] = useState("⭐ 전체보기");
  const tags = ["⭐ 전체보기", "🔥 청년", "💒 신혼부부", "💼 소상공인", "✈️ 여행", "🎊 축제", "🏰 지자체 랜드마크", "🍜 지역 맛집"];

  // 필터링 및 매칭 로직
  const filteredItems = items.filter(item => {
    if (selectedTag === "⭐ 전체보기") return true;
    
    // 이모지 및 특수문자 완벽 제거
    let keyword = selectedTag.replace(/[^가-힣a-zA-Z0-9\s]/g, "").trim();
    if (keyword === "지자체 랜드마크") keyword = "랜드마크";
    if (keyword === "지역 맛집") keyword = "맛집";

    const name = item.name || "";
    const summary = item.summary || "";
    const target = item.target || "";
    const category = item.category || "";
    const location = item.location || "";
    
    const searchString = `${name} ${summary} ${target} ${category} ${location}`.toLowerCase();
    
    // 직접 매칭
    if (searchString.includes(keyword)) return true;

    // 유의어 처리 로직 (직접 매칭 안 됐을 경우)
    if (keyword === "축제" && searchString.includes("행사")) return true;
    if (keyword === "여행" && (searchString.includes("명소") || searchString.includes("관광") || searchString.includes("랜드마크"))) return true;
    if (keyword === "랜드마크" && (searchString.includes("명소") || searchString.includes("여행") || searchString.includes("관광"))) return true;
    if (keyword === "맛집" && (searchString.includes("식당") || searchString.includes("음식") || searchString.includes("카페"))) return true;
    if (keyword === "청년" && (searchString.includes("대학생") || searchString.includes("취업") || searchString.includes("2030") || searchString.includes("자립"))) return true;
    if (keyword === "신혼부부" && (searchString.includes("주거") || searchString.includes("결혼") || searchString.includes("출산") || searchString.includes("육아") || searchString.includes("아동"))) return true;
    if (keyword === "소상공인" && (searchString.includes("기업") || searchString.includes("창업") || searchString.includes("지원금") || searchString.includes("상권"))) return true;
    
    return false;
  });

  return (
    <section className="mb-24 mt-12 bg-white/50 backdrop-blur-xl p-6 sm:p-10 rounded-3xl border border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
      <div className="section-header mb-8">
        <div className="section-title-wrap">
          <span className="text-3xl">🔍</span>
          <h2 className="section-title">맞춤형 정보 찾기</h2>
          <span className="section-count bg-[#7950f2] text-white">{filteredItems.length}건</span>
        </div>
      </div>

      {/* 태그 필터 바 */}
      <div className="flex gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar">
        {tags.map(tag => {
          const isSelected = selectedTag === tag;
          return (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-300 shadow-sm
                ${isSelected 
                  ? 'bg-gradient-to-r from-[#1e1e2f] to-[#7950f2] text-white shadow-md -translate-y-1' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* 카드 그리드 */}
      {filteredItems.length > 0 ? (
        <div className="card-grid">
          {filteredItems.map((item, index) => {
            // 방어적 프로그래밍 적용: p.title 이 undefined이거나 item.name 이 undefined 일 경우 대비
            const slug = fixedSlugs[item.id] || (allPosts.find(p => p?.title && item?.name && p.title.includes(item.name))?.slug);
            const cardElement = <InfoCard key={item.id} item={item} slug={slug} />;
            
            // 데스크탑 3열 레이아웃 기준, 우측(3번째 아이템 자리)에 쿠팡 상품 배너를 픽앤조이처럼 배치!
            // 혹은 기존 카드들의 흐름이 끝나는 지점(행사/축제 이전)에 배치.
            if (index === 2) {
              return (
                <Fragment key={`sponsor-banner-${index}`}>
                  <div className="card flex flex-col items-center justify-center p-4 bg-gradient-to-b from-white/80 to-white/30 border-2 border-dashed border-[#7950f2]/30 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all h-[340px]">
                    <span className="text-[10px] font-black text-[#7950f2] mb-3 bg-[#7950f2]/10 px-3 py-1 rounded-full uppercase tracking-widest">
                      ✨ 오늘의 추천
                    </span>
                    <div className="w-full flex-grow flex items-center justify-center overflow-hidden rounded-xl">
                       <CoupangBanner />
                    </div>
                  </div>
                  {cardElement}
                </Fragment>
              );
            }
            return cardElement;
          })}
          
          {/* 아이템 개수가 2개 이하일 경우에도 배너가 누락되지 않도록 맨 마지막에 배치 */}
          {filteredItems.length <= 2 && (
            <div className="card flex flex-col items-center justify-center p-4 bg-gradient-to-b from-white/80 to-white/30 border-2 border-dashed border-[#7950f2]/30 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all h-[340px]">
              <span className="text-[10px] font-black text-[#7950f2] mb-3 bg-[#7950f2]/10 px-3 py-1 rounded-full uppercase tracking-widest">
                ✨ 오늘의 추천
              </span>
              <div className="w-full flex-grow flex items-center justify-center overflow-hidden rounded-xl">
                 <CoupangBanner />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
          <span className="text-4xl block mb-4">👀</span>
          <h3 className="text-xl font-bold text-slate-700 mb-2">아직 관련된 정보가 없어요!</h3>
          <p className="text-slate-500">선택하신 태그에 맞는 새로운 혜택이나 행사가 업데이트될 예정입니다.</p>
        </div>
      )}
    </section>
  );
}
