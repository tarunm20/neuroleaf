import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, Clock, User, ArrowLeft, Book, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { getAllBlogPosts, getBlogPost, formatDate } from '~/lib/blog';
import { TableOfContents } from '../_components/table-of-contents';
import { ReadingProgress } from '../_components/reading-progress';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | Neuroleaf Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      url: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // Helper function to generate heading IDs with counter to ensure uniqueness
  const usedIds = new Set<string>();
  const generateHeadingId = (text: string): string => {
    const baseId = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    
    let id = baseId;
    let counter = 1;
    
    while (usedIds.has(id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }
    
    usedIds.add(id);
    return id;
  };

  return (
    <>
      <ReadingProgress readingTime={post.readingTime} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back to Blog */}
        <div className="mb-8 max-w-4xl mx-auto">
          <Link href="/blog">
            <Button variant="ghost" className="group hover:bg-primary/10 transition-all duration-200">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Blog
            </Button>
          </Link>
        </div>

        <div className="flex gap-12 items-start">
          {/* Main Content */}
          <div className="flex-1 max-w-4xl">
            {/* Article Header */}
            <header className="mb-16 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-2xl -z-10"></div>
              
              <Badge variant="outline" className="mb-6 px-4 py-2 text-sm font-medium bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 transition-colors">
                {post.category}
              </Badge>

              <h1 className="text-5xl font-bold mb-8 leading-tight tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                {post.title}
              </h1>

              <p className="text-2xl text-muted-foreground mb-10 leading-relaxed font-light max-w-4xl">
                {post.excerpt}
              </p>

              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-8 text-base text-muted-foreground pb-8 relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="flex items-center gap-3 bg-card/50 px-4 py-2 rounded-full border border-muted/30">
                  <User className="h-5 w-5 text-primary" />
                  <span className="font-medium">{post.author}</span>
                </div>
                <div className="flex items-center gap-3 bg-card/50 px-4 py-2 rounded-full border border-muted/30">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>{formatDate(post.date)}</span>
                </div>
                <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium text-primary">{post.readingTime}</span>
                </div>
              </div>
            </header>

            {/* Article Content */}
            <article data-reading-content className="prose prose-xl max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children, ...props }) => {
                    const text = typeof children === 'string' ? children : String(children || '');
                    const id = generateHeadingId(text);
                    return (
                      <div className="relative">
                        <h2 id={id} className="text-3xl font-bold mt-20 mb-8 text-foreground tracking-tight scroll-mt-24 relative" {...props}>
                          <span className="absolute -left-6 top-0 w-2 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></span>
                          {children}
                        </h2>
                      </div>
                    );
                  },
                  h3: ({ children, ...props }) => {
                    const text = typeof children === 'string' ? children : String(children || '');
                    const id = generateHeadingId(text);
                    return (
                      <h3 id={id} className="text-2xl font-semibold mt-16 mb-6 text-foreground scroll-mt-24 relative before:content-[''] before:absolute before:-left-4 before:top-2 before:w-1 before:h-6 before:bg-primary/40 before:rounded-full" {...props}>
                        {children}
                      </h3>
                    );
                  },
                  h4: ({ children, ...props }) => {
                    const text = typeof children === 'string' ? children : String(children || '');
                    const id = generateHeadingId(text);
                    return (
                      <h4 id={id} className="text-xl font-semibold mt-12 mb-5 text-foreground scroll-mt-24 pl-6 border-l-2 border-primary/20 bg-primary/5 py-3 rounded-r-lg" {...props}>
                        {children}
                      </h4>
                    );
                  },
                  p: ({ children }) => (
                    <p className="mb-6 leading-8 text-lg text-muted-foreground">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-4 mb-8 text-lg text-muted-foreground">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="space-y-4 mb-8 text-lg text-muted-foreground">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-8 pl-2 relative before:content-[''] before:absolute before:-left-4 before:top-3 before:w-2 before:h-2 before:bg-primary/60 before:rounded-full">
                      {children}
                    </li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="relative border-l-4 border-primary pl-8 py-8 my-10 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent italic text-xl font-medium text-foreground rounded-r-lg shadow-sm">
                      <div className="absolute -left-2 top-4 w-4 h-4 bg-primary rounded-full opacity-30"></div>
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-3 py-1 rounded-lg text-base font-mono font-medium border border-muted/50 shadow-sm">
                      {children}
                    </code>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-foreground">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-foreground">
                      {children}
                    </em>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </article>
          </div>

          {/* Table of Contents Sidebar - Desktop */}
          <aside className="hidden xl:block w-80 flex-shrink-0">
            <TableOfContents content={post.content} />
          </aside>
        </div>

        {/* Table of Contents - Mobile (collapsible) */}
        <div className="xl:hidden max-w-4xl mx-auto mt-8">
          <details className="group bg-card/80 backdrop-blur-sm border border-muted/30 rounded-xl overflow-hidden">
            <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-primary/5 transition-colors">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Book className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Table of Contents</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto group-open:rotate-90 transition-transform" />
            </summary>
            <div className="px-4 pb-4">
              <TableOfContents content={post.content} />
            </div>
          </details>
        </div>
      </div>
    </>
  );
}