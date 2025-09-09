import { Metadata } from 'next';

import { BlogPageClient } from './_components/blog-page-client';
import { getAllBlogPosts } from '~/lib/blog';

export const metadata: Metadata = {
  title: 'Blog | Neuroleaf - Study Tips & Learning Strategies',
  description: 'Discover evidence-based study techniques and learning strategies to improve your academic performance.',
  keywords: ['study tips', 'learning techniques', 'academic success', 'study strategies'],
  openGraph: {
    title: 'Blog | Neuroleaf',
    description: 'Study tips and learning strategies',
    type: 'website',
    url: '/blog',
  },
};

export default function BlogPage() {
  const posts = getAllBlogPosts();
  return <BlogPageClient initialPosts={posts} />;
}