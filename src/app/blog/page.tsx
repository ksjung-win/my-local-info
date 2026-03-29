import Link from 'next/link';
import { getSortedPostsData } from '@/lib/posts';

export default function BlogPage() {
  const allPostsData = getSortedPostsData();

  return (
    <main className="main-content" style={{ marginTop: '40px' }}>
      <header className="section-header" style={{ marginBottom: '32px' }}>
        <span className="section-icon">📝</span>
        <h2 className="section-title">블로그</h2>
        <span className="section-count">{allPostsData.length}개의 포스트</span>
      </header>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr', gap: '24px' }}>
        {allPostsData.map((post) => (
          <a key={post.slug} href={`/blog/${post.slug}`} className="blog-card" style={{ textDecoration: 'none' }}>
            <div className="blog-card-header">
              <span className="blog-category">{post.category}</span>
              <span className="blog-date">{post.date}</span>
            </div>
            <h2 className="blog-title" style={{ fontSize: '1.25rem', marginTop: '12px' }}>
              {post.title}
            </h2>
            <p className="blog-summary" style={{ marginTop: '8px', color: '#4b5563', lineHeight: 1.6 }}>
              {post.summary}
            </p>
            {post.tags && post.tags.length > 0 && (
              <div className="card-tags" style={{ marginTop: '16px' }}>
                {post.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
          </a>
        ))}
        {allPostsData.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            아직 올라온 포스트가 없습니다.
          </p>
        )}
      </div>
    </main>
  );
}
