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

        <div className="prose prose-orange max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {postData.content}
          </ReactMarkdown>
        </div>

        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '0.95rem', color: '#4b5563', border: '1px solid #e5e7eb' }}>
          <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            💡 <strong>이 글은 <a href="http://data.go.kr/" target="_blank" rel="noopener noreferrer" style={{color: '#2563eb', textDecoration: 'underline'}}>공공데이터포털(data.go.kr)</a>의 정보를 바탕으로 AI가 작성하였습니다.</strong><br/>
            정확한 내용은 원문 링크를 통해 확인해주세요.
          </p>
          {originLink !== "#" && (
            <p style={{ marginTop: '10px' }}>
              🔗 <a href={originLink} target="_blank" rel="noopener noreferrer" style={{color: '#2563eb', textDecoration: 'underline', fontWeight: 600}}>
                원문 출처 링크 (공식 안내) 바로가기
              </a>
            </p>
          )}
        </div>

        <AdBanner />
        <CoupangBanner />
      </article>
      
      <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '1px solid var(--border)' }}>
        <a href="/blog" className="card-link" style={{ fontSize: '1rem' }}>
          ← 목록으로 돌아가기
        </a>
      </div>
    </main>
  );
}
