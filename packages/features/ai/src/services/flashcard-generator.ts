import { GeminiClient } from '../gemini/client';
import {
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse,
  FlashcardGeneration,
  GenerateFlashcardsRequestSchema,
  ContentAnalysis,
} from '../types';

export class FlashcardGenerator {
  constructor(private client: GeminiClient) {}

  async generateFlashcards(
    request: GenerateFlashcardsRequest
  ): Promise<GenerateFlashcardsResponse> {
    // Validate request
    const validatedRequest = GenerateFlashcardsRequestSchema.parse(request);

    // Analyze content to determine optimal card count and complexity
    const contentAnalysis = this.analyzeContent(validatedRequest.content);
    
    // Use AI-determined card count instead of user input
    const optimizedRequest = {
      ...validatedRequest,
      numberOfCards: contentAnalysis.recommendedCardCount,
    };

    const prompt = this.buildFlashcardPrompt(optimizedRequest, contentAnalysis);
    const startTime = Date.now();

    console.log(`[FlashcardGenerator] Content Analysis Results:`, {
      wordCount: contentAnalysis.wordCount,
      sentenceCount: contentAnalysis.sentenceCount,
      paragraphCount: contentAnalysis.paragraphCount,
      complexity: contentAnalysis.complexity,
      originalRequest: validatedRequest.numberOfCards,
      aiRecommended: contentAnalysis.recommendedCardCount,
      usingCount: optimizedRequest.numberOfCards
    });

    try {
      const result = await this.client.generateContent(prompt);
      const processingTime = Date.now() - startTime;

      // Parse the AI response to extract flashcards
      const flashcards = this.parseFlashcardsFromResponse(result.text);

      return {
        flashcards,
        contentAnalysis,
        metadata: {
          tokensUsed: result.tokensUsed,
          estimatedCost: result.estimatedCost,
          processingTime,
          model: 'gemini',
        },
      };
    } catch (error) {
      throw error;
    }
  }

  private analyzeContent(content: string): ContentAnalysis {
    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Detect complexity indicators
    const technicalTerms = (content.match(/[A-Z][a-z]+(?:[A-Z][a-z]+)+|[a-z]+(?:-[a-z]+)+/g) || []).length;
    const numbersAndStats = (content.match(/\d+(?:\.\d+)?%?|\$\d+/g) || []).length;
    const lists = (content.match(/^[\s]*[-*•]\s+/gm) || []).length;
    
    // Determine complexity level
    let complexity: 'simple' | 'moderate' | 'complex';
    const complexityScore = 
      (wordCount > 500 ? 1 : 0) +
      (technicalTerms > 10 ? 1 : 0) +
      (numbersAndStats > 5 ? 1 : 0) +
      (paragraphs.length > 5 ? 1 : 0);
    
    if (complexityScore >= 3) complexity = 'complex';
    else if (complexityScore >= 1) complexity = 'moderate';
    else complexity = 'simple';
    
    // Calculate recommended card count based on content analysis
    let recommendedCardCount: number;
    
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
    
    console.log(`[FlashcardGenerator] Content Analysis Debug:`, {
      wordCount,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      technicalTerms,
      complexity,
      complexityScore,
      recommendedCardCount
    });
    
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

  private buildFlashcardPrompt(request: GenerateFlashcardsRequest, analysis?: ContentAnalysis): string {
    const {
      content,
      numberOfCards,
      language,
      subject,
    } = request;

    const analysisInfo = analysis ? 
      `Content Analysis: ${analysis.wordCount} words, ${analysis.complexity} complexity, estimated ${analysis.estimatedDifficulty} difficulty` :
      '';
    
    let prompt = `You are an expert educator creating flashcards for optimal learning. Create approximately ${numberOfCards} flashcards from the provided content.

${analysisInfo}

CONTENT TO ANALYZE:
${content.slice(0, 4000)}

FLASHCARD EXTRACTION STRATEGY:

1. IDENTIFY KEY ELEMENTS:
   - Core facts and definitions
   - Important concepts and principles  
   - Cause-and-effect relationships
   - Examples and applications
   - Key terms and their meanings
   - Process steps or sequences

2. QUESTION VARIETY (create different types):
   - Definition questions: "What is X?" or "Define X"
   - Factual questions: "What/When/Where/Who..." 
   - Conceptual questions: "Why does X happen?" or "How does X work?"
   - Application questions: "What is an example of X?"
   - Relationship questions: "How are X and Y related?"

3. CONTENT MAXIMIZATION RULES:
   - For short content (< 50 words): Extract every distinct fact, even if basic
   - For medium content: Break down into sub-concepts and relationships
   - For long content: Focus on main ideas but include supporting details
   - Create cards about implications, examples, and connections even if not explicitly stated

4. MINIMUM REQUIREMENT: 
   - Always create at least 1 flashcard, even from very brief content
   - If content seems limited, create cards about context, implications, or related concepts
   - Aim for the target number ${numberOfCards} but prioritize quality over exact count

EXAMPLES:
Content: "The capital of France is Paris. Paris is located in northern France."
Good flashcards:
- {"q":"What is the capital of France?","a":"Paris","difficulty":"easy"}
- {"q":"Where is Paris located within France?","a":"Northern France","difficulty":"easy"}

Content: "Water boils at 100°C."
Good flashcards:
- {"q":"At what temperature does water boil?","a":"100 degrees Celsius (100°C)","difficulty":"easy"}

RESPONSE FORMAT:
Respond ONLY with a JSON array in this exact format:
[{"q":"question text","a":"answer text","difficulty":"easy|medium|hard"}]

Generate approximately ${numberOfCards} flashcards. Start your response with [ and end with ]`;

    return prompt.trim();
  }

  private parseFlashcardsFromResponse(response: string): FlashcardGeneration[] {
    console.log('[FlashcardGenerator] Raw response:', response.substring(0, 500));
    
    // Try multiple parsing strategies in order of preference
    const strategies = [
      () => this.parseSimpleJSON(response),
      () => this.parseFromAnyFormat(response),
      () => this.extractQAPatterns(response),
    ];

    for (const strategy of strategies) {
      try {
        const cards = strategy();
        if (cards.length > 0) {
          console.log(`[FlashcardGenerator] Successfully parsed ${cards.length} flashcards`);
          return cards;
        }
      } catch (error) {
        console.warn('[FlashcardGenerator] Strategy failed:', error);
      }
    }

    console.warn('[FlashcardGenerator] All parsing strategies failed');
    return [];
  }

  private parseSimpleJSON(response: string): FlashcardGeneration[] {
    // Try to find and parse simple JSON format like [{"q":"...","a":"..."}]
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];

    let jsonStr = jsonMatch[0]
      .replace(/```json|```/g, '') // Remove markdown
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
      .trim();

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: any) => ({
      front: item.q || item.question || item.front || '',
      back: item.a || item.answer || item.back || '',
      tags: [],
      difficulty: (item.difficulty === 'easy' || item.difficulty === 'medium' || item.difficulty === 'hard') 
        ? item.difficulty as 'easy' | 'medium' | 'hard'
        : 'medium' as 'easy' | 'medium' | 'hard',
    })).filter((card: any) => card.front && card.back);
  }

  private parseFromAnyFormat(response: string): FlashcardGeneration[] {
    // Handle any JSON-like structure, even if malformed
    const cards: FlashcardGeneration[] = [];
    
    // Look for question-answer-difficulty patterns in various formats
    const patternsWithDifficulty = [
      /"q":\s*"([^"]+)"\s*,\s*"a":\s*"([^"]+)"\s*,\s*"difficulty":\s*"([^"]+)"/g,
      /"question":\s*"([^"]+)"\s*,\s*"answer":\s*"([^"]+)"\s*,\s*"difficulty":\s*"([^"]+)"/g,
      /"front":\s*"([^"]+)"\s*,\s*"back":\s*"([^"]+)"\s*,\s*"difficulty":\s*"([^"]+)"/g,
    ];

    // Try patterns with difficulty first
    for (const pattern of patternsWithDifficulty) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        if (match[1] && match[2]) {
          const difficulty = (match[3] === 'easy' || match[3] === 'medium' || match[3] === 'hard') 
            ? match[3] as 'easy' | 'medium' | 'hard'
            : 'medium' as 'easy' | 'medium' | 'hard';
          cards.push({
            front: match[1].trim(),
            back: match[2].trim(),
            tags: [],
            difficulty,
          });
        }
      }
    }

    // Fallback to patterns without difficulty if no cards found
    if (cards.length === 0) {
      const basicPatterns = [
        /"q":\s*"([^"]+)"\s*,\s*"a":\s*"([^"]+)"/g,
        /"question":\s*"([^"]+)"\s*,\s*"answer":\s*"([^"]+)"/g,
        /"front":\s*"([^"]+)"\s*,\s*"back":\s*"([^"]+)"/g,
      ];

      for (const pattern of basicPatterns) {
        let match;
        while ((match = pattern.exec(response)) !== null) {
          if (match[1] && match[2]) {
            cards.push({
              front: match[1].trim(),
              back: match[2].trim(),
              tags: [],
              difficulty: 'medium',
            });
          }
        }
      }
    }

    return cards;
  }

  private extractQAPatterns(response: string): FlashcardGeneration[] {
    // Extract Q&A patterns from plain text
    const cards: FlashcardGeneration[] = [];
    const lines = response.split('\n').map(line => line.trim()).filter(Boolean);
    
    let currentQuestion = '';
    let currentAnswer = '';
    
    for (const line of lines) {
      if (line.match(/^(Q|Question|q)[\d\s]*[:.]?\s*/i)) {
        if (currentQuestion && currentAnswer) {
          cards.push({
            front: currentQuestion,
            back: currentAnswer,
            tags: [],
            difficulty: 'medium',
          });
        }
        currentQuestion = line.replace(/^(Q|Question|q)[\d\s]*[:.]?\s*/i, '').trim();
        currentAnswer = '';
      } else if (line.match(/^(A|Answer|a)[\d\s]*[:.]?\s*/i)) {
        currentAnswer = line.replace(/^(A|Answer|a)[\d\s]*[:.]?\s*/i, '').trim();
      } else if (currentQuestion && !currentAnswer) {
        currentQuestion += ' ' + line;
      } else if (currentAnswer) {
        currentAnswer += ' ' + line;
      }
    }
    
    // Add the last card
    if (currentQuestion && currentAnswer) {
      cards.push({
        front: currentQuestion,
        back: currentAnswer,
        tags: [],
        difficulty: 'medium',
      });
    }
    
    return cards;
  }

  private fallbackParsing(response: string): FlashcardGeneration[] {
    console.log('[FlashcardGenerator] Attempting fallback parsing');
    
    // Try multiple parsing strategies
    const strategies = [
      () => this.parseQAFormat(response),
      () => this.parseNumberedFormat(response),
      () => this.parseGenericFormat(response),
    ];

    for (const strategy of strategies) {
      try {
        const cards = strategy();
        if (cards.length > 0) {
          console.log(`[FlashcardGenerator] Fallback parsing successful: ${cards.length} cards`);
          return cards;
        }
      } catch (error) {
        console.warn('[FlashcardGenerator] Fallback strategy failed:', error);
      }
    }

    // Last resort: create a single card from the content
    return this.createEmergencyCard(response);
  }

  private parseQAFormat(response: string): FlashcardGeneration[] {
    const flashcards: FlashcardGeneration[] = [];
    const qaPairs = response.split(/(?=\b(?:Q\d*:?|Question\d*:?|A\d*:?|Answer\d*:?))/i);

    let currentCard: Partial<FlashcardGeneration> = {};

    for (const section of qaPairs) {
      const trimmed = section.trim();
      if (!trimmed) continue;

      if (trimmed.match(/^(Q\d*:?|Question\d*:?)/i)) {
        if (currentCard.front && currentCard.back) {
          flashcards.push({
            front: currentCard.front,
            back: currentCard.back,
            tags: [],
            difficulty: 'medium',
          });
        }
        currentCard = {
          front: this.cleanText(trimmed.replace(/^(Q\d*:?|Question\d*:?)/i, '')),
        };
      } else if (trimmed.match(/^(A\d*:?|Answer\d*:?)/i) && currentCard.front) {
        currentCard.back = this.cleanText(trimmed.replace(/^(A\d*:?|Answer\d*:?)/i, ''));
      }
    }

    if (currentCard.front && currentCard.back) {
      flashcards.push({
        front: currentCard.front,
        back: currentCard.back,
        tags: [],
        difficulty: 'medium',
      });
    }

    return flashcards.filter(card => card.front.length > 5 && card.back.length > 5);
  }

  private parseNumberedFormat(response: string): FlashcardGeneration[] {
    const flashcards: FlashcardGeneration[] = [];
    const sections = response.split(/(?=\d+\.)/);

    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed || !trimmed.match(/^\d+\./)) continue;

      const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) continue;

      const front = this.cleanText(lines[0]?.replace(/^\d+\./, '') || '');
      const back = this.cleanText(lines.slice(1).join(' '));

      if (front.length > 5 && back.length > 5) {
        flashcards.push({
          front,
          back,
          tags: [],
          difficulty: 'medium',
        });
      }
    }

    return flashcards;
  }

  private parseGenericFormat(response: string): FlashcardGeneration[] {
    const flashcards: FlashcardGeneration[] = [];
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);

    for (let i = 0; i < sentences.length - 1; i++) {
      const front = this.cleanText(sentences[i] || '');
      const back = this.cleanText(sentences[i + 1] || '');

      if (front.length > 10 && back.length > 10) {
        flashcards.push({
          front: `What can you tell me about: ${front}?`,
          back,
          tags: ['general'],
          difficulty: 'medium',
        });
      }

      if (flashcards.length >= 3) break; // Limit generic parsing
    }

    return flashcards;
  }

  private createEmergencyCard(response: string): FlashcardGeneration[] {
    const cleanResponse = this.cleanText(response);
    if (cleanResponse.length < 10) {
      throw new Error('Response too short to create any flashcards');
    }

    console.warn('[FlashcardGenerator] Creating emergency fallback card');
    
    return [{
      front: 'What is the main concept from the provided content?',
      back: cleanResponse.substring(0, 300) + (cleanResponse.length > 300 ? '...' : ''),
      tags: ['fallback', 'general'],
      difficulty: 'medium',
    }];
  }

  private cleanText(text: string): string {
    return text
      .replace(/^\s*[-*•]\s*/, '') // Remove bullet points
      .replace(/^\s*\d+\.\s*/, '') // Remove numbered lists
      .replace(/[""]/g, '"') // Normalize quotes
      .replace(/['']/g, "'") // Normalize apostrophes
      .trim();
  }

}