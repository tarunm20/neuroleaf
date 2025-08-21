'use client';

import { useMemo } from 'react';
import { MathRenderer } from './math-renderer';

interface MathContentProps {
  children: string;
  className?: string;
}

interface ParsedContent {
  type: 'text' | 'math' | 'displayMath';
  content: string;
  key: string;
}

/**
 * Parses text content to identify LaTeX math expressions
 * Supports both inline ($...$) and display ($$...$$) math
 */
function parseContent(text: string): ParsedContent[] {
  const parts: ParsedContent[] = [];
  let current = text;
  let keyCounter = 0;
  
  while (current.length > 0) {
    // Look for display math first ($$...$$)
    const displayMatch = current.match(/^\$\$([^$].*?[^$])\$\$/);
    if (displayMatch && displayMatch[1]) {
      parts.push({
        type: 'displayMath',
        content: displayMatch[1].trim(),
        key: `display-${keyCounter++}`,
      });
      current = current.slice(displayMatch[0].length);
      continue;
    }
    
    // Look for inline math ($...$)
    const inlineMatch = current.match(/^\$([^$\n]+)\$/);
    if (inlineMatch && inlineMatch[1]) {
      parts.push({
        type: 'math',
        content: inlineMatch[1].trim(),
        key: `inline-${keyCounter++}`,
      });
      current = current.slice(inlineMatch[0].length);
      continue;
    }
    
    // Look for the next math delimiter
    const nextDisplay = current.search(/\$\$/);
    const nextInline = current.search(/\$[^$\n]+\$/);
    
    let nextMathPos = -1;
    if (nextDisplay !== -1 && nextInline !== -1) {
      nextMathPos = Math.min(nextDisplay, nextInline);
    } else if (nextDisplay !== -1) {
      nextMathPos = nextDisplay;
    } else if (nextInline !== -1) {
      nextMathPos = nextInline;
    }
    
    if (nextMathPos === -1) {
      // No more math, add remaining as text
      if (current.trim()) {
        parts.push({
          type: 'text',
          content: current,
          key: `text-${keyCounter++}`,
        });
      }
      break;
    }
    
    // Add text before next math
    if (nextMathPos > 0) {
      const textPart = current.slice(0, nextMathPos);
      if (textPart.trim()) {
        parts.push({
          type: 'text',
          content: textPart,
          key: `text-${keyCounter++}`,
        });
      }
    }
    
    current = current.slice(nextMathPos);
  }
  
  return parts;
}

/**
 * Renders content with automatic LaTeX math detection and rendering
 * Supports both inline ($...$) and display ($$...$$) math expressions
 */
export function MathContent({ children, className = '' }: MathContentProps) {
  const parsedContent = useMemo(() => parseContent(children), [children]);
  
  return (
    <div className={className}>
      {parsedContent.map((part) => {
        switch (part.type) {
          case 'displayMath':
            return (
              <div key={part.key} className="my-4">
                <MathRenderer displayMode>{part.content}</MathRenderer>
              </div>
            );
          case 'math':
            return (
              <MathRenderer key={part.key}>{part.content}</MathRenderer>
            );
          case 'text':
            return (
              <span 
                key={part.key} 
                dangerouslySetInnerHTML={{ __html: part.content }}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}