import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  readingTime: string;
}

const contentDirectory = path.join(process.cwd(), 'content/blog');

export function getAllBlogPosts(): BlogPost[] {
  // Check if directory exists
  if (!fs.existsSync(contentDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(contentDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(contentDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      const matterResult = matter(fileContents);
      const readingTimeResult = readingTime(matterResult.content);

      return {
        slug,
        title: matterResult.data.title || 'Untitled',
        date: matterResult.data.date || new Date().toISOString().split('T')[0],
        excerpt: matterResult.data.excerpt || '',
        content: matterResult.content,
        category: matterResult.data.category || 'Uncategorized',
        tags: matterResult.data.tags || [],
        author: matterResult.data.author || 'Neuroleaf Team',
        readingTime: readingTimeResult.text,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return allPostsData;
}

export function getBlogPost(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.mdx`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);
    const readingTimeResult = readingTime(matterResult.content);

    return {
      slug,
      title: matterResult.data.title || 'Untitled',
      date: matterResult.data.date || new Date().toISOString().split('T')[0],
      excerpt: matterResult.data.excerpt || '',
      content: matterResult.content,
      category: matterResult.data.category || 'Uncategorized',
      tags: matterResult.data.tags || [],
      author: matterResult.data.author || 'Neuroleaf Team',
      readingTime: readingTimeResult.text,
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}


export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}