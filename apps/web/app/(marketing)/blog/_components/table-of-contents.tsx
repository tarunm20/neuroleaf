'use client';

import { useEffect, useState } from 'react';
import { Book, ChevronRight } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    // Extract headings from markdown content
    const headingRegex = /^(#{2,4})\s+(.+)$/gm;
    const items: TOCItem[] = [];
    const usedIds = new Set<string>();
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1]?.length || 2;
      const text = match[2] || '';
      
      // Generate unique ID
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
      items.push({ id, text, level });
    }

    setTocItems(items);
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      const headings = tocItems.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        const tocItem = tocItems[i];
        if (heading && tocItem && heading.offsetTop <= scrollPosition) {
          setActiveSection(tocItem.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (tocItems.length === 0) return null;

  return (
    <div className="sticky top-8 bg-card/90 backdrop-blur-md border border-muted/30 rounded-xl p-6 max-h-[calc(100vh-8rem)] overflow-y-auto shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Book className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Table of Contents</h3>
      </div>
      
      <nav className="space-y-1" role="navigation" aria-label="Table of contents">
        {tocItems.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            aria-label={`Navigate to ${item.text}`}
            className={`block w-full text-left py-3 px-4 rounded-lg text-sm transition-all duration-200 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              activeSection === item.id
                ? 'bg-gradient-to-r from-primary/15 to-primary/10 text-primary font-medium border-l-3 border-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } ${
              item.level === 3 ? 'ml-4' : item.level === 4 ? 'ml-8' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {activeSection === item.id && (
                <ChevronRight className="h-3 w-3 flex-shrink-0 animate-pulse" />
              )}
              <span className="truncate leading-relaxed">{item.text}</span>
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}