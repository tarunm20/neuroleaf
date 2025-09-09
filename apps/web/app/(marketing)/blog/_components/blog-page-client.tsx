'use client';

import { useState, useMemo } from 'react';
import { BookOpen } from 'lucide-react';

import { BlogHero } from './blog-hero';
import { BlogFilters } from './blog-filters';
import { BlogGridCard } from './blog-grid-card';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  date: string;
  readingTime: string;
}

interface BlogPageClientProps {
  initialPosts: BlogPost[];
}

export function BlogPageClient({ initialPosts }: BlogPageClientProps) {
  const allPosts = initialPosts;
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(allPosts);

  // Separate featured and regular posts
  const { featuredPost, regularPosts } = useMemo(() => {
    const featured = filteredPosts.length > 0 ? filteredPosts[0] : null;
    const regular = filteredPosts.slice(1);
    return { featuredPost: featured, regularPosts: regular };
  }, [filteredPosts]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <BlogHero />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Filters */}
        <div className="mb-16">
          <BlogFilters posts={allPosts} onFilteredPosts={setFilteredPosts} />
        </div>

        {/* Blog Posts */}
        {filteredPosts.length > 0 ? (
          <div className="space-y-16">
            {/* Featured Post */}
            {featuredPost && (
              <section>
                <h2 className="text-2xl font-bold mb-8 text-center text-foreground">
                  Featured Article
                </h2>
                <div className="max-w-4xl mx-auto">
                  <BlogGridCard post={featuredPost} featured />
                </div>
              </section>
            )}

            {/* Regular Posts Grid */}
            {regularPosts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-8 text-center text-foreground">
                  {featuredPost ? 'More Articles' : 'All Articles'}
                </h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {regularPosts.map((post) => (
                    <BlogGridCard key={post.slug} post={post} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted/20 rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">No articles found</h3>
              <p className="text-muted-foreground">
                {allPosts.length === 0 
                  ? "We're working on creating amazing educational content for you!"
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}