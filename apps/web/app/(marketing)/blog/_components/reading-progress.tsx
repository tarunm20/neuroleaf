'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface ReadingProgressProps {
  readingTime: string;
}

export function ReadingProgress({ readingTime }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(readingTime);

  useEffect(() => {
    const handleScroll = () => {
      const article = document.querySelector('article[data-reading-content]') as HTMLElement;
      if (!article) return;

      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollPosition = window.scrollY;

      // Calculate progress based on article visibility
      const startReading = articleTop - windowHeight * 0.3;
      const endReading = articleTop + articleHeight - windowHeight * 0.7;
      
      if (scrollPosition < startReading) {
        setProgress(0);
      } else if (scrollPosition > endReading) {
        setProgress(100);
      } else {
        const readingProgress = ((scrollPosition - startReading) / (endReading - startReading)) * 100;
        setProgress(Math.max(0, Math.min(100, readingProgress)));
      }

      // Update time remaining
      const totalMinutes = parseInt(readingTime.replace(/\D/g, ''));
      const remainingMinutes = Math.max(0, Math.round(totalMinutes * (1 - progress / 100)));
      
      if (remainingMinutes === 0) {
        setTimeRemaining('Finished');
      } else if (remainingMinutes === 1) {
        setTimeRemaining('1 min left');
      } else {
        setTimeRemaining(`${remainingMinutes} mins left`);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readingTime]);

  return (
    <>
      {/* Progress bar at top of screen */}
      <div className="fixed top-0 left-0 w-full h-1 bg-muted/20 z-50">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating progress indicator */}
      <div 
        className="fixed bottom-6 right-6 bg-card/95 backdrop-blur-md border border-muted/30 rounded-full px-5 py-4 shadow-xl z-40 transition-all duration-300 hover:shadow-2xl hover:scale-105"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress: ${Math.round(progress)}% complete, ${timeRemaining}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="p-1 bg-primary/10 rounded-full">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium min-w-[70px]">{timeRemaining}</span>
          </div>
          
          <div className="w-20 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <span className="text-sm font-bold text-primary tabular-nums min-w-[35px]">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </>
  );
}