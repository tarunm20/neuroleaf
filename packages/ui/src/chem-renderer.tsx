'use client';

import { ErrorBoundary } from 'react-error-boundary';
import TeX from '@matejmazur/react-katex';

interface ChemRendererProps {
  children: string;
  className?: string;
}

interface ChemErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  originalText: string;
}

function ChemErrorFallback({ error, resetErrorBoundary: _resetErrorBoundary, originalText }: ChemErrorFallbackProps) {
  return (
    <span 
      className="inline-block px-2 py-1 bg-orange-50 text-orange-700 text-sm border border-orange-200 rounded"
      title={`Chemistry rendering error: ${error.message}`}
    >
      {originalText}
    </span>
  );
}

/**
 * Renders chemical formulas and equations using KaTeX with mhchem extension
 * Automatically wraps content in \ce{} for chemistry notation
 */
export function ChemRenderer({ children, className = '' }: ChemRendererProps) {
  // Auto-wrap in \ce{} if not already wrapped
  const chemFormula = children.trim().startsWith('\\ce{') 
    ? children 
    : `\\ce{${children}}`;

  return (
    <ErrorBoundary 
      FallbackComponent={(props) => 
        <ChemErrorFallback {...props} originalText={children} />
      }
      resetKeys={[children]}
    >
      <TeX 
        math={chemFormula}
        block={false}
        errorColor="#ea580c"
        renderError={(error) => (
          <span 
            className="inline-block px-2 py-1 bg-orange-50 text-orange-700 text-sm border border-orange-200 rounded"
            title={`Chemistry error: ${error.name}`}
          >
            {children}
          </span>
        )}
        settings={{
          throwOnError: false,
          strict: false,
          macros: {
            // Common chemistry macros
            '\\ph': '\\mathrm{pH}',
            '\\poh': '\\mathrm{pOH}',
            '\\pka': '\\mathrm{p}K_\\mathrm{a}',
            '\\pkb': '\\mathrm{p}K_\\mathrm{b}',
            '\\kw': 'K_\\mathrm{w}',
            '\\ka': 'K_\\mathrm{a}',
            '\\kb': 'K_\\mathrm{b}',
            '\\ksp': 'K_\\mathrm{sp}',
            '\\keq': 'K_\\mathrm{eq}',
            '\\conc': '[\\mathrm{#1}]',
            '\\molarity': '\\mathrm{M}',
            '\\gas': '\\mathrm{(g)}',
            '\\liquid': '\\mathrm{(l)}',
            '\\solid': '\\mathrm{(s)}',
            '\\aqueous': '\\mathrm{(aq)}',
            '\\rightleftharpoons': '\\rightleftharpoons',
            '\\bond': '-',
            '\\dbond': '=',
            '\\tbond': '\\equiv',
          }
        }}
        className={className}
      />
    </ErrorBoundary>
  );
}