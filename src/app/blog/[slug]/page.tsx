import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPostData, getSortedPostsData } from '@/lib/posts';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import AdBanner from '@/components/AdBanner';
import CoupangBanner from '@/components/CoupangBanner';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const postData = getPostData(slug);
  if (!postData) {
    return { title: "페이지를 찾을 수 없습니다" };
  }
  return {
    title: `${postData.title} | 성남시 생활 정보`,
    description: `${postData.title} - 성남시 지역 행사 및 혜택 정보를 즉시 확인하세요.`,
    openGraph: {
      title: postData.title,
      description: `${postData.title} - 성남시 지역 행사 및 혜택 정보를 즉시 확인하세요.`,
      type: "article",
      publishedTime: postData.date,
    }
  };
}

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const postData = getPostData(slug);

  if (!postData) {
    notFound();
  }

  const dataPath = path.join(process.cwd(), "public", "data", "local-info.json");
  let originLink = "#";
  try {
    const db = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const matchedItem = db.items.find((item: any) => postData.content.includes(item.name) || postData.title.includes(item.name));
    if (matchedItem && matchedItem.link && matchedItem.link !== "#") {
      originLink = matchedItem.link;
    }
  } catch (e) {}

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": postData.title,
    "datePublished": postData.date,
    "description": `${postData.title} - 성남시 지역 행사 및 혜택 정보`,
    "author": { "@type": "Organization", "name": "성남시 생활 정보" },
    "publisher": { "@type": "Organization", "name": "성남시 생활 정보" }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://infos-info.com" },
      { "@type": "ListItem", "position": 2, "name": "블로그", "item": "https://infos-info.com/blog" },
      { "@type": "ListItem", "position": 3, "name": postData.title, "item": `https://infos-info.com/blog/${slug}` }
    ]
  };

  return (
    <main className="main-content" style={{ marginTop: '40px', paddingBottom: '80px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([blogJsonLd, breadcrumbJsonLd]) }}
      />
      <article>
        <header style={{ marginBottom: '40px' }}>
          <div className="card-badge badge-event" style={{ marginBottom: '12px' }}>
            {postData.category}
          </div>
          <h1 className="header-title" style={{ color: 'var(--text-main)', fontSize: '2.5rem', marginBottom: '16px', textShadow: 'none' }}>
            {postData.title}
          </h1>
          <div className="meta-row" style={{ fontSize: '1rem' }}>
            <span className="meta-icon">📅</span>
            <span>최종 업데이트: {postData.date}</span>
          </div>
        </header>

        {/* 💡 새로 추가된 프리미엄 정보 박스 (상단 배치) */}
        <div style={{ 
          marginTop: '20px', 
          marginBottom: '40px',
          padding: '24px', 
          backgroundColor: '#f0f7ff', 
          borderRadius: '16px', 
          fontSize: '0.95rem', 
          color: '#1e293b', 
          border: '2px solid #bae6fd',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px dashed #bae6fd' }}>
            <p style={{ marginBottom: '16px', lineHeight: '1.6', display: 'flex', alignItems: 'flex-start', gap: '8px', fontWeight: 500 }}>
              <span style={{ fontSize: '1.2rem' }}>💡</span>
              <span>
                이 글은 <a href="http://data.go.kr/" target="_blank" rel="noopener noreferrer" style={{color: '#0369a1', fontWeight: 700, textDecoration: 'underline'}}>공공데이터포털</a>의 정보를 바탕으로 AI가 작성하였습니다. 정확한 내용은 아래 링크를 통해 확인해 주세요.
              </span>
            </p>
            {originLink !== "#" && (
              <div style={{ marginTop: '12px', paddingLeft: '28px' }}>
                <a href={originLink} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#ffffff', 
                  textDecoration: 'none', 
                  fontWeight: 700,
                  backgroundColor: '#0284c7',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)',
                  transition: 'transform 0.2s'
                }}>
                  📎 공식 원문 페이지 바로가기 (클릭)
                </a>
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'left' }}>
             <h3 style={{ 
               fontSize: '1.15rem', 
               fontWeight: 800, 
               color: '#0c4a6e', 
               marginBottom: '16px', 
               display: 'flex', 
               alignItems: 'center', 
               gap: '8px' 
             }}>
               <span style={{ fontSize: '1.4rem' }}>🎁</span> 오늘의 추천 상품
             </h3>
             <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px', border: '1px solid #e0f2fe' }}>
               <CoupangBanner />
             </div>
          </div>
        </div>

        <div className="prose prose-orange max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {postData.content}
          </ReactMarkdown>
        </div>

        


        <AdBanner />
      </article>
      
      <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '1px solid var(--border)' }}>
        <a href="/blog" className="card-link" style={{ fontSize: '1rem' }}>
          ← 목록으로 돌아가기
        </a>
      </div>
    </main>
  );
}
