import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPostData, getSortedPostsData } from '@/lib/posts';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const postData = getPostData(slug);

  if (!postData) {
    notFound();
  }

  return (
    <main className="main-content" style={{ marginTop: '40px', paddingBottom: '80px' }}>
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
            <span>{postData.date}</span>
          </div>
        </header>

        <div className="prose prose-orange max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {postData.content}
          </ReactMarkdown>
        </div>
      </article>
      
      <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '1px solid var(--border)' }}>
        <a href="/blog" className="card-link" style={{ fontSize: '1rem' }}>
          ← 목록으로 돌아가기
        </a>
      </div>
    </main>
  );
}
