import Link from 'next/link';
import { Calendar, Clock, User } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import type { BlogPost } from '~/lib/blog';
import { formatDate } from '~/lib/blog';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="group">
      <Card className="relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-muted/40 hover:border-primary/20 bg-card/50 backdrop-blur overflow-hidden">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="px-3 py-1 text-sm font-medium bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 transition-colors">
              {post.category}
            </Badge>
            <span className="text-sm font-medium text-primary bg-gradient-to-r from-primary/20 to-primary/10 px-3 py-1 rounded-full border border-primary/20">
              {post.readingTime}
            </span>
          </div>
          
          <CardTitle className="group-hover:text-primary transition-colors text-xl font-bold leading-tight mb-4">
            <Link href={`/blog/${post.slug}`} className="block">
              {post.title}
            </Link>
          </CardTitle>
          
          <p className="text-muted-foreground text-base leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        </CardHeader>

        <CardContent className="pt-0 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 bg-muted/20 px-3 py-1 rounded-full">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formatDate(post.date)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
            <Link 
              href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-2 text-base font-semibold text-primary hover:text-primary/80 transition-all duration-200 group-hover:gap-3"
            >
              Read Full Article
              <span className="group-hover:translate-x-1 transition-transform text-lg">→</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}