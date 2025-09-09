'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
}

interface BlogFiltersProps {
  posts: BlogPost[];
  onFilteredPosts: (posts: BlogPost[]) => void;
}

export function BlogFilters({ posts, onFilteredPosts }: BlogFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Extract unique categories from posts
  const categories = Array.from(new Set(posts.map(post => post.category))).filter(Boolean);

  // Filter posts based on search and category
  const filterPosts = (query: string, category: string | null) => {
    let filtered = posts;

    // Filter by search query
    if (query.trim()) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(post => post.category === category);
    }

    onFilteredPosts(filtered);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    filterPosts(query, selectedCategory);
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    filterPosts(searchQuery, category);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    onFilteredPosts(posts);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== null;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-4 py-3 rounded-full border-muted/30 focus:border-primary/50 bg-card/50 backdrop-blur"
        />
      </div>

      {/* Filter Toggle for Mobile */}
      <div className="flex items-center justify-center md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Categories
        </Button>
      </div>

      {/* Category Filters */}
      <div className={`space-y-4 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* All Categories Button */}
          <button
            onClick={() => handleCategorySelect(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All Articles
          </button>

          {/* Category Buttons */}
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-center">
        <span className="text-sm text-muted-foreground">
          {hasActiveFilters && (
            <>Showing filtered results • </>
          )}
          {posts.length} {posts.length === 1 ? 'article' : 'articles'}
        </span>
      </div>
    </div>
  );
}