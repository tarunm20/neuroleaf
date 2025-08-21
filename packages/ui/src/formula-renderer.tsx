'use client';

import { useMemo } from 'react';
import { MathRenderer } from './math-renderer';
import { ChemRenderer } from './chem-renderer';

interface FormulaRendererProps {
  children: string;
  className?: string;
}

type FormulaType = 'chemistry' | 'math' | 'text';

/**
 * Detects the type of formula based on content patterns
 */
function detectFormulaType(content: string): FormulaType {
  const trimmed = content.trim();
  
  // Physics patterns
  const physicsPatterns = [
    /\b(F|m|a|v|t|d|g|E|P|W|Q|I|V|R|C|L|B|H|μ|ε|σ|λ|ν|ω|φ|θ|Δ|∇)\b/, // Physics variables
    /\b(Force|Energy|Power|Voltage|Current|Resistance|Capacitance|Magnetic|Electric|Wave|Frequency|Wavelength)\b/i,
    /\b(Newton|Joule|Watt|Volt|Ampere|Ohm|Farad|Tesla|Weber|Henry|Coulomb|Pascal|Hertz)\b/i, // Units
    /\b(velocity|acceleration|momentum|kinetic|potential|electromagnetic|thermodynamic)\b/i,
    /\b(F\s*=\s*ma|E\s*=\s*mc²|V\s*=\s*IR|P\s*=\s*VI|Q\s*=\s*CV)\b/i, // Common formulas
    /\b(kg|m\/s|N|J|W|V|A|Ω|F|T|Wb|H|C|Pa|Hz)\b/, // Unit abbreviations
  ];

  // Biology patterns
  const biologyPatterns = [
    /\b(DNA|RNA|ATP|ADP|NADH|FADH2|CO₂|O₂|H₂O|glucose|protein|enzyme|amino|nucleotide)\b/i,
    /\b(mitosis|meiosis|photosynthesis|respiration|transcription|translation|replication)\b/i,
    /\b(allele|gene|chromosome|phenotype|genotype|dominant|recessive|heterozygous|homozygous)\b/i,
    /\b(species|genus|family|order|class|phylum|kingdom|domain|taxonomy)\b/i,
    /\b(C₆H₁₂O₆|6CO₂|6H₂O|36ATP|2ATP|PGAL|RuBP)\b/i, // Biochemical formulas
    /\b(ecosystem|population|community|habitat|niche|biodiversity)\b/i,
  ];
  
  // Chemistry patterns (enhanced)
  const chemPatterns = [
    /\b[A-Z][a-z]?[\d+\-]*\b/, // Chemical elements (H2O, NaCl, etc.)
    /\b(pH|pOH|Ka|Kb|Kw|Ksp|Keq|pKa|pKb)\b/i, // Chemistry constants
    /\b\d*[A-Z][a-z]?\d*\b/, // Simple chemical formulas
    /\+|\-\>|\<\-\>|⇌|→|←/, // Chemical reaction arrows
    /\([aq\)|\(s\)|\(l\)|\(g\)]/i, // State indicators
    /\b(acid|base|salt|ion|molecule|compound|reaction|equilibrium|catalyst|oxidation|reduction)\b/i,
    /\b[A-Z][a-z]?\(\w+\)\d*/,  // Complex ions like Ca(OH)2
    /\b[A-Z][a-z]?[\d]*[\+\-]+\b/, // Ions like Na+, Cl-
    /\b(molarity|molality|concentration|stoichiometry|titration|buffer)\b/i,
    /\b(organic|inorganic|polymer|isomer|functional group|benzene|alkane|alkene)\b/i,
  ];
  
  // Math patterns (enhanced, excluding basic chemical formulas)
  const mathPatterns = [
    /\b(sin|cos|tan|log|ln|exp|sqrt|sum|prod|int|lim|max|min|det|trace)\b/i,
    /[∫∑∏∆∇∞π]/,
    /\b(dx|dy|dz|dt|dθ|dr|ds)\b/,
    /[αβγδεζηθικλμνξοπρστυφχψω]/,
    /\b\d+[xy]\b/, // algebraic terms like 2x, 3y
    /[<>=≤≥≠±∓]/,
    /\^\{.*\}/,  // Complex exponents
    /\b(matrix|vector|derivative|integral|limit|function|equation|polynomial|trigonometric)\b/i,
    /\b(calculus|algebra|geometry|statistics|probability|differential|partial)\b/i,
    /\\\w+\{/, // LaTeX commands
    /\$.*\$/, // LaTeX math delimiters
  ];
  
  // Count pattern matches to determine subject
  const physicsCount = physicsPatterns.filter(pattern => pattern.test(trimmed)).length;
  const biologyCount = biologyPatterns.filter(pattern => pattern.test(trimmed)).length;
  const chemistryCount = chemPatterns.filter(pattern => pattern.test(trimmed)).length;
  const mathCount = mathPatterns.filter(pattern => pattern.test(trimmed)).length;
  
  // Determine the subject with the highest confidence
  const maxCount = Math.max(physicsCount, biologyCount, chemistryCount, mathCount);
  
  if (maxCount === 0) {
    return 'text';
  }
  
  // Return the subject with the most matches
  if (physicsCount === maxCount) {
    return 'math'; // Physics formulas use math rendering
  }
  if (biologyCount === maxCount) {
    return 'chemistry'; // Biology formulas often use chemical notation
  }
  if (chemistryCount === maxCount) {
    return 'chemistry';
  }
  if (mathCount === maxCount) {
    return 'math';
  }
  
  // Fallback logic
  if (chemistryCount > 0 && mathCount === 0) {
    return 'chemistry';
  }
  if (mathCount > 0 || /\\[a-zA-Z]+\{/.test(trimmed) || /\$/.test(trimmed)) {
    return 'math';
  }
  
  return 'text';
}

/**
 * Renders formulas with automatic detection of chemistry vs math content
 */
export function FormulaRenderer({ children, className = '' }: FormulaRendererProps) {
  const formulaType = useMemo(() => detectFormulaType(children), [children]);
  
  switch (formulaType) {
    case 'chemistry':
      return <ChemRenderer className={className}>{children}</ChemRenderer>;
    case 'math':
      return <MathRenderer className={className}>{children}</MathRenderer>;
    case 'text':
    default:
      return <span className={className}>{children}</span>;
  }
}

// Export individual renderers for specific use cases
export { MathRenderer } from './math-renderer';
export { ChemRenderer } from './chem-renderer';
export { MathContent } from './math-content';