import Link from 'next/link';
import { Calendar, Clock, User, BookOpen, TrendingUp, Star } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface BlogGridCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogGridCard({ post, featured = false }: BlogGridCardProps) {
  // Determine difficulty level based on reading time
  const getDifficultyLevel = (readingTime: string): { level: string; icon: React.ReactNode; color: string } => {
    const minutes = parseInt(readingTime.replace(/\D/g, ''));
    if (minutes <= 3) {
      return { level: 'Quick Read', icon: <TrendingUp className="h-3 w-3" />, color: 'text-green-600 bg-green-50 border-green-200' };
    } else if (minutes <= 7) {
      return { level: 'Standard', icon: <BookOpen className="h-3 w-3" />, color: 'text-blue-600 bg-blue-50 border-blue-200' };
    } else {
      return { level: 'Deep Dive', icon: <Star className="h-3 w-3" />, color: 'text-purple-600 bg-purple-50 border-purple-200' };
    }
  };

  const difficulty = getDifficultyLevel(post.readingTime);

  return (
    <article className={`group h-full ${featured ? 'md:col-span-2' : ''}`}>
      <Card className="h-full flex flex-col relative hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-muted/40 hover:border-primary/30 bg-card/80 backdrop-blur overflow-hidden">

        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardHeader className={`pb-4 relative z-10 ${featured ? 'p-8' : 'p-6'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-primary/10 border-primary/30 text-primary">
                {post.category}
              </Badge>
              <Badge 
                variant="outline" 
                className={`px-2 py-1 text-xs font-medium border ${difficulty.color}`}
              >
                <span className="flex items-center gap-1">
                  {difficulty.icon}
                  {difficulty.level}
                </span>
              </Badge>
            </div>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              {post.readingTime}
            </span>
          </div>
          
          <CardTitle className={`group-hover:text-primary transition-colors font-bold leading-tight mb-4 ${
            featured ? 'text-2xl md:text-3xl' : 'text-lg'
          }`}>
            <Link href={`/blog/${post.slug}`} className="block hover:underline decoration-primary/30 underline-offset-4">
              {post.title}
            </Link>
          </CardTitle>
          
          <p className={`text-muted-foreground leading-relaxed line-clamp-3 ${
            featured ? 'text-base md:text-lg' : 'text-sm'
          }`}>
            {post.excerpt}
          </p>
        </CardHeader>

        <CardContent className={`pt-0 relative z-10 flex-1 flex flex-col justify-end ${featured ? 'px-8 pb-8' : 'p-6 pt-0'}`}>
          {/* Author and Date */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(post.date)}</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {post.tags.slice(0, featured ? 4 : 3).map((tag) => (
                <span 
                  key={tag} 
                  className="px-2 py-1 text-xs bg-muted/50 text-muted-foreground rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Read More Link */}
          <div className="pt-4 border-t border-muted/20">
            <Link 
              href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-all duration-200 group/link"
            >
              Read Article
              <span className="group-hover/link:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}