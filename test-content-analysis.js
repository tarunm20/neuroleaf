// Test script to verify content analysis logic
// Run this in browser console or Node.js to test the analysis algorithm

function analyzeContent(content) {
  const wordCount = content.split(/\s+/).length;
  const charCount = content.length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // Detect complexity indicators
  const technicalTerms = (content.match(/[A-Z][a-z]+(?:[A-Z][a-z]+)+|[a-z]+(?:-[a-z]+)+/g) || []).length;
  const numbersAndStats = (content.match(/\d+(?:\.\d+)?%?|\$\d+/g) || []).length;
  const lists = (content.match(/^[\s]*[-*•]\s+/gm) || []).length;
  
  // Determine complexity level
  let complexity;
  const complexityScore = 
    (wordCount > 500 ? 1 : 0) +
    (technicalTerms > 10 ? 1 : 0) +
    (numbersAndStats > 5 ? 1 : 0) +
    (paragraphs.length > 5 ? 1 : 0);
  
  if (complexityScore >= 3) complexity = 'complex';
  else if (complexityScore >= 1) complexity = 'moderate';
  else complexity = 'simple';
  
  // Calculate recommended card count based on content analysis
  let recommendedCardCount;
  
  if (wordCount < 100) {
    recommendedCardCount = Math.min(3, Math.max(1, Math.floor(sentences.length / 2)));
  } else if (wordCount < 300) {
    recommendedCardCount = Math.min(8, Math.max(3, Math.floor(sentences.length / 3)));
  } else if (wordCount < 800) {
    recommendedCardCount = Math.min(15, Math.max(5, Math.floor(paragraphs.length * 2)));
  } else {
    recommendedCardCount = Math.min(25, Math.max(8, Math.floor(paragraphs.length * 3)));
  }
  
  // Cap at 50 for free tier consideration
  recommendedCardCount = Math.min(50, recommendedCardCount);
  
  return {
    wordCount,
    charCount,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    complexity,
    technicalTerms,
    numbersAndStats,
    lists,
    recommendedCardCount,
    estimatedDifficulty: complexity === 'complex' ? 'hard' : 
                        complexity === 'moderate' ? 'medium' : 'easy'
  };
}

// Test cases
const testCases = [
  {
    name: "Minimal Content",
    content: "The capital of France is Paris. Paris is located in northern France on the River Seine.",
    expected: "1-3 cards"
  },
  {
    name: "Brief List",
    content: `The three primary colors are:
1. Red
2. Blue  
3. Yellow`,
    expected: "2-4 cards"
  },
  {
    name: "Short Educational",
    content: `Photosynthesis is the process by which plants convert sunlight into energy. During photosynthesis, plants use chlorophyll to absorb light energy. They combine carbon dioxide from the air with water from the soil to produce glucose (sugar) and oxygen. The chemical equation for photosynthesis is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. This process occurs mainly in the leaves of plants, specifically in structures called chloroplasts.`,
    expected: "5-8 cards"
  },
  {
    name: "Very Brief",
    content: "Water boils at 100°C.",
    expected: "1 card"
  }
];

console.log("=== Content Analysis Test Results ===");
testCases.forEach((test, index) => {
  const result = analyzeContent(test.content);
  console.log(`\nTest ${index + 1}: ${test.name}`);
  console.log(`Content: "${test.content.substring(0, 100)}${test.content.length > 100 ? '...' : ''}"`);
  console.log(`Words: ${result.wordCount}, Sentences: ${result.sentenceCount}, Paragraphs: ${result.paragraphCount}`);
  console.log(`Complexity: ${result.complexity}, Technical Terms: ${result.technicalTerms}`);
  console.log(`Recommended Cards: ${result.recommendedCardCount} (Expected: ${test.expected})`);
});

console.log("\n=== Copy one of these test contents to verify in the app ===");
testCases.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}:`);
  console.log(`"${test.content}"`);
  console.log("");
});