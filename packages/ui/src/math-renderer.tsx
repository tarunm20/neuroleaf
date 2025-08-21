'use client';

import { ErrorBoundary } from 'react-error-boundary';
import TeX from '@matejmazur/react-katex';

interface MathRendererProps {
  children: string;
  displayMode?: boolean;
  throwOnError?: boolean;
  errorColor?: string;
  className?: string;
}

interface MathErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  originalText: string;
}

function MathErrorFallback({ error, resetErrorBoundary: _resetErrorBoundary, originalText }: MathErrorFallbackProps) {
  return (
    <span 
      className="inline-block px-2 py-1 bg-red-50 text-red-700 text-sm border border-red-200 rounded"
      title={`Math rendering error: ${error.message}`}
    >
      {originalText}
    </span>
  );
}

/**
 * Renders a single mathematical expression using KaTeX
 */
export function MathRenderer({ 
  children, 
  displayMode = false,
  throwOnError = false,
  errorColor = '#cc0000',
  className = ''
}: MathRendererProps) {
  return (
    <ErrorBoundary 
      FallbackComponent={(props) => 
        <MathErrorFallback {...props} originalText={children} />
      }
      resetKeys={[children]}
    >
      <TeX 
        math={children}
        block={displayMode}
        errorColor={errorColor}
        renderError={(error) => (
          <span 
            className="inline-block px-2 py-1 bg-red-50 text-red-700 text-sm border border-red-200 rounded"
            title={`Math error: ${error.name}`}
          >
            {children}
          </span>
        )}
        settings={{
          throwOnError: throwOnError,
          strict: false, // Allow some LaTeX extensions
        }}
        className={className}
      />
    </ErrorBoundary>
  );
}