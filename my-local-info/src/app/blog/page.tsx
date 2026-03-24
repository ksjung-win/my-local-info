import Link from 'next/link';
import { getSortedPostsData } from '@/lib/posts';

export default function BlogPage() {
  const allPostsData = getSortedPostsData();

  return (
    <main className="main-content" style={{ marginTop: '40px' }}>
      <header className="section-header">
        <span className="section-icon">📝</span>
        <h2 className="section-title">블로그 소식</h2>
        <span className="section-count">{allPostsData.length}개의 포스트</span>
      </header>

      <div className="card-grid">
        {allPostsData.map(({ slug, date, title, summary, category }) => (
          <Link href={`/blog/${slug}`} key={slug} className="card">
            <span className="card-badge badge-event">
              {category}
            </span>
            <p className="card-name">{title}</p>
            <p className="card-summary">{summary}</p>
            <div className="card-meta">
              <div className="meta-row">
                <span className="meta-icon">📅</span>
                <span>{date}</span>
              </div>
            </div>
          </Link>
        ))}
        {allPostsData.length === 0 && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            아직 올라온 포스트가 없습니다.
          </p>
        )}
      </div>
    </main>
  );
}
