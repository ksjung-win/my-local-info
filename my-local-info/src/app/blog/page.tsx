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
        {allPostsData.map(({ slug, date, title, summary, category, tags }) => (
          <Link href={`/blog/${slug}`} key={slug} className="blog-card">
            <div className="blog-card-header">
              <span className="blog-category">{category}</span>
              <span className="blog-date">{date}</span>
            </div>
            <h3 className="blog-title">{title}</h3>
            <p className="blog-summary">{summary}</p>
            {tags && tags.length > 0 && (
              <div className="card-tags">
                {tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
          </Link>
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
