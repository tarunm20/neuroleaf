'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const [isScrollingToSection, setIsScrollingToSection] = useState(false);

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

  const handleScroll = useCallback(() => {
    if (isScrollingToSection) return; // Don't update active section while programmatically scrolling

    const headings = tocItems.map(item => document.getElementById(item.id)).filter(Boolean);
    const scrollPosition = window.scrollY + 150; // Increased offset for better detection

    // Find the current section by checking which heading is closest to the top
    let currentSection = '';
    let minDistance = Infinity;

    headings.forEach((heading, index) => {
      if (heading) {
        const distance = Math.abs(heading.offsetTop - scrollPosition);
        if (heading.offsetTop <= scrollPosition + 100 && distance < minDistance) {
          minDistance = distance;
          currentSection = tocItems[index]?.id || '';
        }
      }
    });

    // If no section is close enough, find the last visible section
    if (!currentSection) {
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        const tocItem = tocItems[i];
        if (heading && tocItem && heading.offsetTop <= scrollPosition) {
          currentSection = tocItem.id;
          break;
        }
      }
    }

    if (currentSection && currentSection !== activeSection) {
      setActiveSection(currentSection);
    }
  }, [tocItems, activeSection, isScrollingToSection]);

  useEffect(() => {
    // Throttle scroll events for better performance
    let ticking = false;
    
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [handleScroll]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      setIsScrollingToSection(true);
      setActiveSection(id); // Immediately update active section
      
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Reset the scrolling flag after animation completes
      setTimeout(() => {
        setIsScrollingToSection(false);
      }, 1000);
    }
  };

  if (tocItems.length === 0) return null;

  return (
    <div className="sticky top-8 bg-card/95 backdrop-blur-lg border border-muted/20 rounded-xl p-6 max-h-[calc(100vh-6rem)] overflow-y-auto shadow-xl ring-1 ring-primary/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-primary/15 to-primary/10 rounded-lg ring-1 ring-primary/20">
          <Book className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-lg">Table of Contents</h3>
      </div>
      
      {/* Progress indicator */}
      <div className="mb-4 h-1 bg-muted/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out rounded-full"
          style={{
            width: activeSection ? `${((tocItems.findIndex(item => item.id === activeSection) + 1) / tocItems.length) * 100}%` : '0%'
          }}
        />
      </div>
      
      <nav className="space-y-1" role="navigation" aria-label="Table of contents">
        {tocItems.map((item, index) => {
          const isActive = activeSection === item.id;
          const isPrevious = tocItems.findIndex(tocItem => tocItem.id === activeSection) > index;
          
          return (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              aria-label={`Navigate to ${item.text}`}
              className={`group block w-full text-left py-3 px-4 rounded-lg text-sm transition-all duration-300 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50 relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold border-l-4 border-primary shadow-md scale-[1.02] transform'
                  : isPrevious
                  ? 'text-muted-foreground/80 bg-muted/20'
                  : 'text-muted-foreground hover:text-foreground hover:scale-[1.01] transform'
              } ${
                item.level === 3 ? 'ml-6' : item.level === 4 ? 'ml-10' : ''
              }`}
            >
              {/* Active section background animation */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              )}
              
              <div className="flex items-center gap-3 relative z-10">
                {isActive && (
                  <div className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 flex-shrink-0 animate-bounce text-primary" />
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                  </div>
                )}
                {isPrevious && !isActive && (
                  <div className="h-2 w-2 bg-primary/40 rounded-full flex-shrink-0" />
                )}
                <span className={`leading-relaxed ${isActive ? 'font-semibold' : 'font-medium'} transition-all duration-200`}>
                  {item.text}
                </span>
              </div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" />
            </button>
          );
        })}
      </nav>
      
      {/* Reading progress text */}
      <div className="mt-6 pt-4 border-t border-muted/20">
        <div className="text-xs text-muted-foreground/80 text-center">
          {activeSection ? (
            <>
              Section {tocItems.findIndex(item => item.id === activeSection) + 1} of {tocItems.length}
            </>
          ) : (
            'Scroll to see progress'
          )}
        </div>
      </div>
    </div>
  );
}