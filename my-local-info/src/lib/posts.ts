import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

export interface PostData {
  slug: string;
  title: string;
  date: string;
  summary: string;
  category: string;
  tags: string[];
  content: string;
}

export function getSortedPostsData(): PostData[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);

      let dateStr = matterResult.data.date;
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split('T')[0];
      }

      return {
        slug,
        title: matterResult.data.title,
        date: dateStr,
        summary: matterResult.data.summary,
        category: matterResult.data.category,
        tags: matterResult.data.tags || [],
        content: matterResult.content,
      } as PostData;
    });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostData(slug: string): PostData | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);

  let dateStr = matterResult.data.date;
  if (dateStr instanceof Date) {
    dateStr = dateStr.toISOString().split('T')[0];
  }

  return {
    slug,
    title: matterResult.data.title,
    date: dateStr,
    summary: matterResult.data.summary,
    category: matterResult.data.category,
    tags: matterResult.data.tags || [],
    content: matterResult.content,
  };
}
