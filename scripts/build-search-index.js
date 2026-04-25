const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const INFO_PATH = path.join(process.cwd(), 'public/data/local-info.json');
const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');
const OUTPUT_PATH = path.join(process.cwd(), 'public/data/search-index.json');

/**
 * 마크다운 기호를 제거하여 일반 텍스트로 변환하는 함수
 */
function stripMarkdown(md) {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '') // 이미지 제거
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 링크 텍스트 유지
    .replace(/(#+)(.*)/g, '$2') // 헤더 기호 제거
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // 굵게 제거
    .replace(/(\*|_)(.*?)\1/g, '$2') // 기울임 제거
    .replace(/(`+)(.*?)\1/g, '$2') // 코드 블록 제거
    .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
    .replace(/>/g, '') // 인용구 기호 제거
    .replace(/-|\*|\d+\./g, '') // 리스트 기호 제거
    .trim();
}

async function buildIndex() {
  const index = [];

  // 1. 공공데이터 인덱싱 (local-info.json)
  if (fs.existsSync(INFO_PATH)) {
    const infoData = JSON.parse(fs.readFileSync(INFO_PATH, 'utf8'));
    if (infoData.items) {
      infoData.items.forEach(item => {
        index.push({
          type: 'info',
          title: item.name,
          summary: item.summary,
          category: item.category,
          slug: item.slug,
          id: item.id
        });
      });
    }
  }

  // 2. 블로그 포스트 인덱싱 (src/content/posts/*.md)
  if (fs.existsSync(POSTS_DIR)) {
    const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));
    files.forEach(file => {
      const fullPath = path.join(POSTS_DIR, file);
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContent);
      
      const plainText = stripMarkdown(content).substring(0, 500);
      
      index.push({
        type: 'post',
        title: data.title || file.replace('.md', ''),
        summary: data.summary || '',
        content: plainText,
        slug: data.slug || file.replace('.md', ''),
        date: data.date
      });
    });
  }

  // 3. 결과 저장
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2));
  console.log(`Search index built: ${index.length} entries`);
}

buildIndex().catch(err => {
  console.error('Error building search index:', err);
  process.exit(1);
});
