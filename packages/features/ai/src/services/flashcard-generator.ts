import { GeminiClient } from '../gemini/client';
import {
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse,
  FlashcardGeneration,
  GenerateFlashcardsRequestSchema,
  ContentAnalysis,
  EducationalConcept,
  ContentType,
  ContentMetadata,
} from '../types';

export class FlashcardGenerator {
  constructor(private client: GeminiClient) {}

  // Research-based chunking strategy for quality over quantity
  private readonly CHUNK_TARGET_SIZE = 8000; // Larger chunks for better context (doubled from 4000)
  private readonly CHUNK_OVERLAP = 200; // Reduced overlap to minimize redundancy (halved from 400)
  private readonly MIN_CHUNK_SIZE = 1500; // Larger minimum chunks for meaningful content (increased from 800)
  private readonly LONG_DOCUMENT_THRESHOLD = 8000; // Higher threshold before chunking (increased from 5000)

  async generateFlashcards(
    request: GenerateFlashcardsRequest
  ): Promise<GenerateFlashcardsResponse> {
    // Validate request
    const validatedRequest = GenerateFlashcardsRequestSchema.parse(request);

    // Handle image processing differently
    if (validatedRequest.isImage && validatedRequest.imageData) {
      console.log(`[FlashcardGenerator] Image detected, using vision processing`);
      return this.generateFlashcardsFromImage(validatedRequest);
    }

    // Check if content is long enough to require chunking
    if (validatedRequest.content.length > this.LONG_DOCUMENT_THRESHOLD) {
      console.log(`[FlashcardGenerator] Long document detected (${validatedRequest.content.length} chars), using chunked processing`);
      return this.generateFlashcardsFromLongDocument(validatedRequest);
    }

    // Standard processing for shorter documents
    return this.generateFlashcardsStandard(validatedRequest);
  }

  private async generateFlashcardsStandard(
    request: GenerateFlashcardsRequest
  ): Promise<GenerateFlashcardsResponse> {
    // Analyze content to determine optimal card count and complexity
    const contentAnalysis = this.analyzeContent(request.content);
    
    // Use AI-determined card count instead of user input
    const optimizedRequest = {
      ...request,
      numberOfCards: contentAnalysis.recommendedCardCount,
    };

    const prompt = this.buildFlashcardPrompt(optimizedRequest, contentAnalysis);
    const startTime = Date.now();

    console.log(`[FlashcardGenerator] Standard processing - Content Analysis:`, {
      wordCount: contentAnalysis.wordCount,
      sentenceCount: contentAnalysis.sentenceCount,
      paragraphCount: contentAnalysis.paragraphCount,
      complexity: contentAnalysis.complexity,
      originalRequest: request.numberOfCards,
      aiRecommended: contentAnalysis.recommendedCardCount,
      usingCount: optimizedRequest.numberOfCards
    });

    try {
      const result = await this.client.generateContent(prompt);
      const processingTime = Date.now() - startTime;

      // Parse the AI response to extract flashcards
      const rawFlashcards = this.parseFlashcardsFromResponse(result.text);
      
      // Apply quality validation to filter out meta-questions
      const validatedFlashcards = this.validateFlashcardQuality(rawFlashcards, contentAnalysis);

      return {
        flashcards: validatedFlashcards,
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

  private async generateFlashcardsFromLongDocument(
    request: GenerateFlashcardsRequest
  ): Promise<GenerateFlashcardsResponse> {
    const startTime = Date.now();
    
    // Analyze the full content first
    const fullContentAnalysis = this.analyzeContent(request.content);
    
    // Split content into intelligent chunks
    const chunks = this.chunkContent(request.content);
    
    console.log(`[FlashcardGenerator] Long document processing:`, {
      totalLength: request.content.length,
      chunksCount: chunks.length,
      fullAnalysis: {
        wordCount: fullContentAnalysis.wordCount,
        complexity: fullContentAnalysis.complexity,
        recommendedCards: fullContentAnalysis.recommendedCardCount
      }
    });

    // Research-based approach: Conservative card distribution
    // Cap total target at research-backed optimal numbers
    const targetCardsTotal = Math.min(
      Math.max(fullContentAnalysis.recommendedCardCount, request.numberOfCards),
      50 // Research-backed maximum for large documents (reduced from 100)
    );
    const baseCardsPerChunk = Math.max(5, Math.floor(targetCardsTotal / chunks.length)); // Reduced minimum to 5
    
    // Process each chunk
    const allFlashcards: FlashcardGeneration[] = [];
    let totalTokensUsed = 0;
    let totalCost = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      if (!chunk) continue; // Skip if chunk is undefined
      
      try {
        console.log(`[FlashcardGenerator] Processing chunk ${i + 1}/${chunks.length} (${chunk.content.length} chars)`);
        
        // Analyze this chunk
        const chunkAnalysis = this.analyzeContent(chunk.content);
        
        // Calculate cards for this chunk based on its content density
        const chunkCardCount = this.calculateChunkCardCount(
          chunk, 
          chunkAnalysis, 
          baseCardsPerChunk,
          i === chunks.length - 1 // isLastChunk
        );
        
        // Generate flashcards for this chunk
        const chunkRequest = {
          ...request,
          content: chunk.content,
          numberOfCards: chunkCardCount,
        };
        
        const prompt = this.buildChunkedFlashcardPrompt(chunkRequest, chunkAnalysis, chunk, i + 1, chunks.length);
        const result = await this.client.generateContent(prompt);
        
        // Parse flashcards from this chunk
        const chunkFlashcards = this.parseFlashcardsFromResponse(result.text);
        
        // Keep flashcards without section context
        const contextualizedCards = chunkFlashcards.map(card => ({
          ...card,
          tags: card.tags || [], // Keep original tags without adding section info
        }));
        
        allFlashcards.push(...contextualizedCards);
        totalTokensUsed += result.tokensUsed || 0;
        totalCost += result.estimatedCost || 0;
        
        console.log(`[FlashcardGenerator] Chunk ${i + 1} completed: ${chunkFlashcards.length} cards generated`);
        
        // Add small delay between chunks to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.warn(`[FlashcardGenerator] Error processing chunk ${i + 1}:`, error);
        // Continue processing other chunks even if one fails
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    // Apply quality validation to all collected flashcards
    const validatedFlashcards = this.validateFlashcardQuality(allFlashcards, fullContentAnalysis);
    
    // Deduplicate and optimize final card set
    const optimizedFlashcards = this.deduplicateAndOptimizeCards(validatedFlashcards, targetCardsTotal);
    
    console.log(`[FlashcardGenerator] Long document processing completed:`, {
      chunksProcessed: chunks.length,
      totalCardsGenerated: allFlashcards.length,
      validatedCards: validatedFlashcards.length,
      finalCardsAfterOptimization: optimizedFlashcards.length,
      targetCount: targetCardsTotal,
      processingTimeMs: processingTime,
      totalTokensUsed
    });

    // If no flashcards were generated from chunks, try to process the entire content as a fallback
    if (optimizedFlashcards.length === 0) {
      console.warn('[FlashcardGenerator] No flashcards generated from chunks, attempting fallback processing');
      try {
        const fallbackRequest = {
          ...request,
          numberOfCards: Math.min(10, request.numberOfCards), // Limit fallback cards
        };
        const fallbackPrompt = this.buildFlashcardPrompt(fallbackRequest, fullContentAnalysis);
        const fallbackResult = await this.client.generateContent(fallbackPrompt);
        const fallbackCards = this.parseFlashcardsFromResponse(fallbackResult.text);
        
        if (fallbackCards.length > 0) {
          console.log(`[FlashcardGenerator] Fallback processing generated ${fallbackCards.length} cards`);
          return {
            flashcards: fallbackCards,
            contentAnalysis: fullContentAnalysis,
            metadata: {
              tokensUsed: totalTokensUsed + (fallbackResult.tokensUsed || 0),
              estimatedCost: totalCost + (fallbackResult.estimatedCost || 0),
              processingTime,
              model: 'gemini',
            },
          };
        }
      } catch (error) {
        console.error('[FlashcardGenerator] Fallback processing also failed:', error);
      }
    }

    return {
      flashcards: optimizedFlashcards,
      contentAnalysis: fullContentAnalysis,
      metadata: {
        tokensUsed: totalTokensUsed,
        estimatedCost: totalCost,
        processingTime,
        model: 'gemini',
      },
    };
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
    
    // Advanced semantic analysis
    const educationalConcepts = this.extractEducationalConcepts(content);
    const contentType = this.detectContentType(content);
    const metadata = this.extractContentMetadata(content);
    
    // Determine complexity level
    let complexity: 'simple' | 'moderate' | 'complex';
    const complexityScore = 
      (wordCount > 500 ? 1 : 0) +
      (technicalTerms > 10 ? 1 : 0) +
      (numbersAndStats > 5 ? 1 : 0) +
      (paragraphs.length > 5 ? 1 : 0) +
      (educationalConcepts.filter(c => c.importance === 'high').length > 3 ? 1 : 0);
    
    if (complexityScore >= 4) complexity = 'complex';
    else if (complexityScore >= 2) complexity = 'moderate';
    else complexity = 'simple';
    
    // Calculate recommended card count based on educational concepts
    let recommendedCardCount = this.calculateOptimalCardCount(
      wordCount, 
      sentences.length, 
      paragraphs.length, 
      educationalConcepts
    );
    
    console.log(`[FlashcardGenerator] Advanced Content Analysis:`, {
      wordCount,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      technicalTerms,
      complexity,
      contentType,
      educationalConcepts: educationalConcepts.length,
      highImportanceConcepts: educationalConcepts.filter(c => c.importance === 'high').length,
      mediumImportanceConcepts: educationalConcepts.filter(c => c.importance === 'medium').length,
      metadataElements: Object.values(metadata).flat().length,
      recommendedCardCount,
      topConcepts: educationalConcepts.slice(0, 3).map(c => c.concept)
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
                          complexity === 'moderate' ? 'medium' : 'easy',
      educationalConcepts,
      contentType,
      metadata
    };
  }

  /**
   * Extract educational concepts from content, avoiding metadata
   */
  private extractEducationalConcepts(content: string): EducationalConcept[] {
    const concepts: EducationalConcept[] = [];
    
    // Definition patterns - key educational content
    const definitionPatterns = [
      /(?:^|\n)\s*(.+?)\s+(?:is|are|means|refers to|defined as)\s+(.+?)(?:\.|$)/gmi,
      /(?:^|\n)\s*(.+?):\s*(.+?)(?:\n|$)/gm,
      /Definition of (.+?):\s*(.+?)(?:\n|$)/gmi,
      /(.+?)\s+can be defined as\s+(.+?)(?:\.|$)/gmi,
    ];

    // Process definition patterns
    definitionPatterns.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const concept = match[1]?.trim();
        const definition = match[2]?.trim();
        
        if (concept && definition && 
            !this.isMetadata(concept) && 
            concept.length > 2 && 
            definition.length > 10) {
          
          concepts.push({
            concept,
            definition,
            context: match[0].trim(),
            importance: this.assessConceptImportance(concept, definition, content),
            type: 'definition',
          });
        }
      });
    });

    // Process-oriented content
    const processPatterns = [
      /(?:steps?|process|procedure|method|algorithm)(?:\s+(?:to|for|of))?\s+(.+?):\s*\n((?:\d+\.|[-*]\s).+?)(?:\n\n|$)/gmi,
      /How to (.+?):\s*\n((?:\d+\.|[-*]\s).+?)(?:\n\n|$)/gmi,
    ];

    processPatterns.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const concept = match[1]?.trim();
        const process = match[2]?.trim();
        
        if (concept && process && !this.isMetadata(concept)) {
          concepts.push({
            concept: `How to ${concept}`,
            context: match[0].trim(),
            importance: 'medium',
            type: 'process',
          });
        }
      });
    });

    // Key facts and relationships
    const relationshipPatterns = [
      /(.+?)\s+(?:causes?|leads? to|results? in|affects?)\s+(.+?)(?:\.|$)/gmi,
      /(.+?)\s+(?:depends on|relies on|requires?)\s+(.+?)(?:\.|$)/gmi,
      /The relationship between (.+?) and (.+?) is (.+?)(?:\.|$)/gmi,
    ];

    relationshipPatterns.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const concept1 = match[1]?.trim();
        const concept2 = match[2]?.trim();
        
        if (concept1 && concept2 && 
            !this.isMetadata(concept1) && 
            !this.isMetadata(concept2)) {
          
          concepts.push({
            concept: `${concept1} and ${concept2} relationship`,
            context: match[0].trim(),
            importance: this.assessConceptImportance(concept1, concept2, content),
            type: 'relationship',
          });
        }
      });
    });

    // Important examples
    const examplePatterns = [
      /(?:for example|such as|including|like)\s+(.+?)(?:\.|,|$)/gmi,
      /Example[s]?:\s*(.+?)(?:\n|$)/gmi,
    ];

    examplePatterns.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const example = match[1]?.trim();
        
        if (example && !this.isMetadata(example) && example.length > 5) {
          concepts.push({
            concept: `Example: ${example}`,
            context: match[0].trim(),
            importance: 'low',
            type: 'example',
          });
        }
      });
    });

    // Remove duplicates and apply stricter filtering
    const uniqueConcepts = concepts.filter((concept, index, arr) => 
      arr.findIndex(c => c.concept.toLowerCase() === concept.concept.toLowerCase()) === index
    );

    // Research-based filtering: Only keep high and medium importance concepts
    const filteredConcepts = uniqueConcepts.filter(concept => 
      concept.importance === 'high' || concept.importance === 'medium'
    );

    // Further quality filter: Ensure concepts are substantial and educational
    const qualityConcepts = filteredConcepts.filter(concept => {
      // Must have a definition or clear context
      if (concept.type === 'definition' && (!concept.definition || concept.definition.length < 15)) {
        return false;
      }
      
      // Concept name should be meaningful (not just single words)
      if (concept.concept.split(' ').length < 2 && concept.concept.length < 8) {
        return false;
      }
      
      // Avoid overly generic concepts
      const genericTerms = ['introduction', 'overview', 'summary', 'conclusion', 'definition', 'concept', 'topic', 'subject'];
      if (genericTerms.some(term => concept.concept.toLowerCase().includes(term))) {
        return false;
      }
      
      return true;
    });

    return qualityConcepts.sort((a, b) => {
      const importanceOrder = { high: 3, medium: 2, low: 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    }).slice(0, 30); // Limit to top 30 concepts for focus
  }

  /**
   * Detect content type for specialized processing using comprehensive analysis
   */
  private detectContentType(content: string): ContentType {
    const lowerContent = content.toLowerCase();
    const contentStructure = this.analyzeContentStructure(content);
    
    // Score-based detection system
    const scores = {
      lecture_slides: this.scoreLectureSlides(lowerContent, contentStructure),
      academic_paper: this.scoreAcademicPaper(lowerContent, contentStructure),
      textbook_chapter: this.scoreTextbook(lowerContent, contentStructure),
      documentation: this.scoreDocumentation(lowerContent, contentStructure),
      notes: this.scoreNotes(lowerContent, contentStructure),
      general_text: 1 // Default fallback score
    };
    
    // Find the highest scoring content type
    const sortedScores = (Object.entries(scores) as [ContentType, number][])
      .sort(([,a], [,b]) => b - a);
    const detectedType = sortedScores[0]?.[0] || 'general_text';
    
    console.log(`[ContentTypeDetection] Detected type: ${detectedType}, scores:`, scores);
    
    return detectedType;
  }

  private analyzeContentStructure(content: string): {
    bulletPoints: number;
    numberedLists: number;
    headings: number;
    shortLines: number;
    longParagraphs: number;
    codeBlocks: number;
    citations: number;
  } {
    const lines = content.split('\n');
    
    return {
      bulletPoints: (content.match(/^\s*[-*•]\s/gm) || []).length,
      numberedLists: (content.match(/^\s*\d+[\.\)]\s/gm) || []).length,
      headings: (content.match(/^#{1,6}\s|^[A-Z][^\n]*\n[=-]{3,}/gm) || []).length,
      shortLines: lines.filter(line => line.trim().length < 50 && line.trim().length > 0).length,
      longParagraphs: (content.match(/[^\n]{200,}/g) || []).length,
      codeBlocks: (content.match(/```[\s\S]*?```|`[^`]+`/g) || []).length,
      citations: (content.match(/\[[0-9]+\]|\([0-9]{4}\)|et al\./g) || []).length
    };
  }

  private scoreLectureSlides(content: string, structure: any): number {
    let score = 0;
    
    // Strong indicators
    if (content.includes('slide')) score += 3;
    if (content.includes('lecture')) score += 2;
    if (content.match(/\b(?:slide|page)\s+\d+/)) score += 2;
    
    // Structural indicators
    if (structure.shortLines > structure.longParagraphs * 2) score += 2; // Many short lines vs paragraphs
    if (structure.bulletPoints > 5) score += 1;
    if (structure.headings > 3) score += 1;
    
    // Content patterns
    if (content.includes('objectives') || content.includes('overview')) score += 1;
    
    return score;
  }

  private scoreAcademicPaper(content: string, structure: any): number {
    let score = 0;
    
    // Strong indicators
    if (content.includes('abstract')) score += 3;
    if (content.includes('methodology') || content.includes('methods')) score += 2;
    if (content.includes('references') || content.includes('bibliography')) score += 2;
    if (content.includes('conclusion') && content.includes('introduction')) score += 2;
    
    // Academic language
    const academicMatches = content.match(/\b(?:hypothesis|research|study|analysis|findings|results)\b/g);
    if (academicMatches && academicMatches.length > 3) score += 2;
    if (structure.citations > 5) score += 2;
    
    // Structure
    if (structure.longParagraphs > structure.shortLines) score += 1; // More paragraphs than short lines
    const figureMatches = content.match(/\b(?:figure|table)\s+\d+/gi);
    if (figureMatches && figureMatches.length > 0) score += 1;
    
    return score;
  }

  private scoreTextbook(content: string, structure: any): number {
    let score = 0;
    
    // Strong indicators
    if (content.includes('exercises') || content.includes('problems')) score += 3;
    if (content.includes('unit')) score += 1;
    if (content.includes('example') && content.includes('solution')) score += 2;
    
    // Educational patterns
    const educationalMatches = content.match(/\b(?:definition|theorem|principle|law)\b/gi);
    if (educationalMatches && educationalMatches.length > 2) score += 2;
    const reminderMatches = content.match(/\b(?:recall|remember|note that|important)\b/gi);
    if (reminderMatches && reminderMatches.length > 1) score += 1;
    
    // Structure
    if (structure.numberedLists > 2) score += 1;
    if (structure.headings > 2 && structure.bulletPoints > 3) score += 1;
    
    return score;
  }

  private scoreDocumentation(content: string, structure: any): number {
    let score = 0;
    
    // Strong indicators
    if (content.includes('api') || content.includes('function')) score += 3;
    if (content.includes('parameter') || content.includes('returns')) score += 2;
    if (content.includes('usage') || content.includes('example')) score += 1;
    
    // Code patterns
    if (structure.codeBlocks > 2) score += 2;
    const codeMatches = content.match(/\b(?:class|method|property|attribute)\b/g);
    if (codeMatches && codeMatches.length > 3) score += 1;
    
    // Technical language
    const techMatches = content.match(/\b(?:syntax|implementation|configuration|install)\b/gi);
    if (techMatches && techMatches.length > 1) score += 1;
    
    return score;
  }

  private scoreNotes(content: string, structure: any): number {
    let score = 0;
    
    // Strong indicators
    if (content.includes('notes') && content.length < 2000) score += 2; // Notes tend to be shorter
    if (structure.bulletPoints > structure.longParagraphs * 2) score += 2; // Lots of bullet points
    
    // Informal patterns
    const informalMatches = content.match(/\b(?:remember|todo|note|important|key point)\b/gi);
    if (informalMatches && informalMatches.length > 2) score += 1;
    const abbreviationMatches = content.match(/\b(?:i\.e\.|e\.g\.|etc\.)\b/gi);
    if (abbreviationMatches && abbreviationMatches.length > 1) score += 1;
    
    // Structure
    if (structure.shortLines > 10 && structure.longParagraphs < 3) score += 1;
    
    return score;
  }

  /**
   * Extract metadata elements that should NOT become flashcards
   */
  private extractContentMetadata(content: string): ContentMetadata {
    const metadata: ContentMetadata = {
      titles: [],
      headings: [],
      pageNumbers: [],
      chapterReferences: [],
      tableOfContents: [],
      authorInfo: [],
      citations: [],
      navigationElements: []
    };

    // Page numbers
    metadata.pageNumbers = [...content.matchAll(/(?:page|p\.)\s*\d+/gmi)]
      .map(match => match[0]);

    // Chapter references (meta-questions we want to avoid)
    metadata.chapterReferences = [];

    // Table of contents elements
    metadata.tableOfContents = [...content.matchAll(/^\s*\d+\.\s+[^.]+$/gm)]
      .map(match => match[0].trim());

    // Author information
    metadata.authorInfo = [...content.matchAll(/(?:author|by|written by):\s*(.+?)(?:\n|$)/gmi)]
      .map(match => match[1]?.trim())
      .filter((item): item is string => Boolean(item));

    // Citations
    metadata.citations = [...content.matchAll(/\[\d+\]|\(\d{4}\)|et al\./g)]
      .map(match => match[0]);

    // Navigation elements
    metadata.navigationElements = [...content.matchAll(/(?:next|previous|back to|continue to|see also)/gmi)]
      .map(match => match[0]);

    return metadata;
  }

  /**
   * Check if a concept is metadata rather than educational content
   */
  private isMetadata(text: string): boolean {
    const metadataPatterns = [
      /^(?:page)\s*\d+/i,
      /^(?:lecture|slide)\s*\d+/i,
      /main topics covered/i,
      /overview of/i,
      /introduction to/i,
      /^topics?$/i,
      /^outline$/i,
      /^agenda$/i,
      /learning objectives/i,
      /what (?:are|is) the main/i,
      /(?:next|previous|back)/i,
    ];

    return metadataPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Assess the importance of a concept for flashcard creation
   */
  private assessConceptImportance(concept: string, definition: string, fullContent: string): 'high' | 'medium' | 'low' {
    // High importance indicators
    const highImportancePatterns = [
      /(?:key|important|critical|essential|fundamental|core|primary)/i,
      /definition|principle|law|theory|concept/i,
      /formula|equation|theorem/i,
    ];

    if (highImportancePatterns.some(pattern => 
        pattern.test(concept) || pattern.test(definition))) {
      return 'high';
    }

    // Check frequency in content (escape regex special characters)
    const escapedConcept = concept.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const conceptFrequency = (fullContent.toLowerCase().match(new RegExp(escapedConcept, 'g')) || []).length;
    if (conceptFrequency > 3) {
      return 'high';
    } else if (conceptFrequency > 1) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Calculate optimal card count based on educational concepts and research-based limits
   */
  private calculateOptimalCardCount(
    wordCount: number, 
    sentenceCount: number, 
    paragraphCount: number, 
    educationalConcepts: EducationalConcept[]
  ): number {
    // Research-based approach: Focus on high-quality concepts only
    const highImportanceConcepts = educationalConcepts.filter(c => c.importance === 'high');
    const mediumImportanceConcepts = educationalConcepts.filter(c => c.importance === 'medium');
    
    // Prioritize high and medium importance concepts only (ignore low importance)
    let conceptBasedCount = 
      (highImportanceConcepts.length * 1.5) + // 1.5 cards per high-importance concept (reduced from 2)
      (mediumImportanceConcepts.length * 0.8); // 0.8 cards per medium-importance concept (reduced from 1)

    // Research-based fallback: Much more conservative ratios
    const fallbackCount = Math.max(
      Math.floor(wordCount / 200), // 1 card per 200 words (doubled from 100)
      Math.floor(sentenceCount / 5), // 1 card per 5 sentences (increased from 3)
      Math.floor(paragraphCount * 0.8) // Reduced paragraph-based count
    );

    // Use the higher of concept-based or fallback calculation
    let recommendedCount = Math.max(conceptBasedCount, fallbackCount);

    // Apply content-type specific limits based on research
    recommendedCount = this.applyContentTypeSpecificLimits(recommendedCount, wordCount);

    // Research-backed bounds: 8-25 cards optimal for learning
    return Math.max(8, Math.min(25, Math.round(recommendedCount)));
  }

  /**
   * Apply content-type specific limits based on educational research
   */
  private applyContentTypeSpecificLimits(baseCount: number, wordCount: number): number {
    // Research-based limits by content type for optimal learning
    if (wordCount > 2000) {
      return Math.min(baseCount, 25); // Max 25 for long content (books, papers)
    } else if (wordCount > 1000) {
      return Math.min(baseCount, 20); // Max 20 for medium content (articles, documents)
    } else if (wordCount > 500) {
      return Math.min(baseCount, 15); // Max 15 for short content (notes, summaries)
    } else {
      return Math.min(baseCount, 12); // Max 12 for very short content (definitions, concepts)
    }
  }

  /**
   * Get content-type specific guidance for flashcard creation
   */
  private getContentTypeSpecificGuidance(contentType: ContentType): string {
    switch (contentType) {
      case 'lecture_slides':
        return `\n\nLECTURE SLIDES OPTIMIZATION:
- Focus on key points from each slide, not slide numbers or navigation
- Extract main concepts, definitions, and examples presented
- Convert bullet points into question-answer pairs
- Prioritize formulas, diagrams, and key takeaways
- Avoid questions about "what slide covers X" - focus on the actual content`;

      case 'academic_paper':
        return `\n\nACADEMIC PAPER OPTIMIZATION:
- Extract key findings, methodologies, and conclusions
- Focus on research results, not paper structure
- Create cards for important statistics, dates, and figures
- Include key terminology and theoretical concepts
- Focus on scientific content and avoid meta-questions`;

      case 'textbook_chapter':
        return `\n\nTEXTBOOK OPTIMIZATION:
- Extract definitions, principles, and laws presented
- Focus on examples and problem-solving methods
- Create cards for formulas, equations, and key concepts
- Include historical context and important figures
- Convert exercises into learning questions about the concepts`;

      case 'documentation':
        return `\n\nDOCUMENTATION OPTIMIZATION:
- Focus on functionality, syntax, and usage patterns
- Extract parameter definitions and return values
- Create cards for code examples and implementation details
- Include configuration options and best practices
- Avoid meta-questions about documentation structure`;

      case 'notes':
        return `\n\nNOTES OPTIMIZATION:
- Extract key facts and important points highlighted
- Focus on definitions and concepts noted
- Convert informal explanations into formal Q&A
- Prioritize actionable information and key insights
- Include examples and clarifications provided`;

      default:
        return '';
    }
  }

  private buildFlashcardPrompt(request: GenerateFlashcardsRequest, analysis?: ContentAnalysis): string {
    const {
      content,
      numberOfCards,
      language,
      subject,
    } = request;

    // Build enhanced analysis info with content-type specific guidance
    let analysisInfo = '';
    let contentTypeGuidance = '';
    
    if (analysis) {
      const conceptSummary = analysis.educationalConcepts ? 
        `Educational concepts found: ${analysis.educationalConcepts.length} (${analysis.educationalConcepts.filter(c => c.importance === 'high').length} high-priority)` :
        '';
      
      analysisInfo = `Content Analysis: 
- ${analysis.wordCount} words, ${analysis.complexity} complexity, ${analysis.estimatedDifficulty} difficulty
- Content type: ${analysis.contentType || 'general'}
- ${conceptSummary}`;
      
      contentTypeGuidance = this.getContentTypeSpecificGuidance(analysis.contentType);
    }

    // Build concept-focused guidelines if we have educational concepts
    let conceptGuidelines = '';
    if (analysis?.educationalConcepts && analysis.educationalConcepts.length > 0) {
      const highPriorityConcepts = analysis.educationalConcepts
        .filter(c => c.importance === 'high')
        .slice(0, 5)
        .map(c => `- ${c.concept}${c.type === 'definition' ? ' (definition)' : ''}`)
        .join('\n');
      
      if (highPriorityConcepts) {
        conceptGuidelines = `\nPRIORITY EDUCATIONAL CONCEPTS IDENTIFIED:
${highPriorityConcepts}
\nFocus primarily on these concepts when creating flashcards.`;
      }
    }
    
    let prompt = `You are an expert educator creating high-quality flashcards for optimal learning. Create exactly ${numberOfCards} flashcards from the provided educational content.

${analysisInfo}${conceptGuidelines}${contentTypeGuidance}

CONTENT TO ANALYZE:
${content}

CRITICAL: AVOID META-QUESTIONS
❌ NEVER create flashcards about:
- Document structure questions
- Navigation elements
- Page numbers or organizational elements
- Table of contents information
- Learning objectives or course outlines
- "Overview" or "introduction" concepts

✅ ONLY create flashcards about EDUCATIONAL CONTENT:
- Specific facts, definitions, and concepts
- Formulas, equations, and calculations
- Processes, procedures, and methods
- Examples and applications
- Historical facts, dates, and figures
- Cause-and-effect relationships
- Technical terminology and their meanings

FLASHCARD CREATION STRATEGY:

1. CONTENT-FIRST APPROACH:
   - Extract factual knowledge that students need to memorize
   - Focus on "what", "how", "when", "where" about actual subject matter
   - Prioritize definitions, principles, formulas, and key facts
   - Include specific examples and applications

2. QUESTION TYPES (focus on substance):
   - Definition: "What is photosynthesis?" (NOT "What is covered in this document?")
   - Factual: "What year was the Declaration of Independence signed?"
   - Process: "What are the steps of cellular respiration?"
   - Application: "What is an example of a renewable energy source?"
   - Calculation: "How do you calculate acceleration?"

3. ACADEMIC RIGOR:
   - Extract ALL numerical values, formulas, and equations
   - Create cards for key terminology and technical vocabulary
   - Include historical context, dates, and important figures
   - Focus on cause-and-effect relationships between concepts
   - Cover both theoretical knowledge and practical applications

4. QUALITY OVER QUANTITY:
   - Each flashcard should test specific, actionable knowledge
   - Avoid vague or meta-level questions
   - Ensure answers are concrete and verifiable
   - Create cards that build understanding, not just awareness

GOOD EXAMPLES:
❌ BAD: {"q":"What topics are covered in Lecture 3?","a":"Various biology concepts","difficulty":"easy"}
✅ GOOD: {"q":"What is the primary function of mitochondria?","a":"To produce ATP (energy) for cellular processes","difficulty":"medium"}

❌ BAD: {"q":"What is the main focus of this document?","a":"Economics principles","difficulty":"easy"}
✅ GOOD: {"q":"What is the law of supply and demand?","a":"When supply increases and demand stays constant, prices decrease; when demand increases and supply stays constant, prices increase","difficulty":"medium"}

RESPONSE FORMAT:
Respond ONLY with a JSON array in this exact format:
[{"q":"question text","a":"answer text","difficulty":"easy|medium|hard"}]

Generate exactly ${numberOfCards} high-quality, content-focused flashcards. Start your response with [ and end with ]`;

    return prompt.trim();
  }

  private parseFlashcardsFromResponse(response: string): FlashcardGeneration[] {
    console.log('[FlashcardGenerator] Raw response length:', response.length);
    console.log('[FlashcardGenerator] Raw response preview:', response.substring(0, 500));
    console.log('[FlashcardGenerator] Raw response ending:', response.substring(Math.max(0, response.length - 200)));
    
    // Try multiple parsing strategies in order of preference
    const strategies = [
      () => this.parseSimpleJSON(response),
      () => this.parseFromAnyFormat(response),
      () => this.extractQAPatterns(response),
      () => this.emergencyFallbackParser(response),
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        const strategy = strategies[i];
        if (strategy) {
          const cards = strategy();
          if (cards && cards.length > 0) {
            console.log(`[FlashcardGenerator] Strategy ${i + 1} successfully parsed ${cards.length} flashcards`);
            return cards;
          }
          console.log(`[FlashcardGenerator] Strategy ${i + 1} returned 0 cards, trying next strategy`);
        }
      } catch (error) {
        console.warn(`[FlashcardGenerator] Strategy ${i + 1} failed:`, error);
        // Continue to next strategy
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
      .replace(/\\"/g, '"') // Handle escaped quotes
      .replace(/"\s*\n\s*"/g, '" "') // Handle line breaks in strings
      .trim();

    // Try to fix common malformed JSON issues
    try {
      // First attempt with the cleaned string
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
    } catch (error) {
      // If parsing fails, try to repair common issues
      console.warn('[FlashcardGenerator] Initial JSON parse failed, attempting repair:', error);
      
      // Try to fix unterminated strings by finding the last valid object
      try {
        const lastValidBracket = jsonStr.lastIndexOf('}');
        if (lastValidBracket > 0) {
          const repairedStr = jsonStr.substring(0, lastValidBracket + 1) + ']';
          const parsed = JSON.parse(repairedStr);
          if (Array.isArray(parsed)) {
            return parsed.map((item: any) => ({
              front: item.q || item.question || item.front || '',
              back: item.a || item.answer || item.back || '',
              tags: [],
              difficulty: (item.difficulty === 'easy' || item.difficulty === 'medium' || item.difficulty === 'hard') 
                ? item.difficulty as 'easy' | 'medium' | 'hard'
                : 'medium' as 'easy' | 'medium' | 'hard',
            })).filter((card: any) => card.front && card.back);
          }
        }
      } catch (repairError) {
        console.warn('[FlashcardGenerator] JSON repair also failed:', repairError);
      }
      
      // If all else fails, return empty array to trigger next strategy
      return [];
    }
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

  /**
   * Simple content chunking for long documents without section detection
   */
  private chunkContent(content: string): Array<{ content: string }> {
    const chunks: Array<{ content: string }> = [];
    
    // Split by size and semantic boundaries only - no section detection
    const sizeBasedChunks = this.splitBySize(content);
    chunks.push(...sizeBasedChunks);
    
    return chunks.filter(chunk => chunk.content.length >= this.MIN_CHUNK_SIZE);
  }

  /**
   * Removed section detection - content is processed without section awareness
   */
  private detectSections(content: string): Array<{ content: string; title?: string }> {
    // Return content as-is without section detection
    return [{ content: content.trim() }];
  }

  /**
   * Not used - section titles are no longer extracted
   */
  private extractTitle(_heading: string): string {
    return '';
  }

  /**
   * Split content by size while respecting semantic boundaries
   */
  private splitBySize(content: string): Array<{ content: string }> {
    const chunks: Array<{ content: string }> = [];
    
    // Try to split on paragraph boundaries first
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const wouldExceedTarget = (currentChunk.length + paragraph.length + this.CHUNK_OVERLAP) > this.CHUNK_TARGET_SIZE;
      
      if (wouldExceedTarget && currentChunk.length >= this.MIN_CHUNK_SIZE) {
        // Save current chunk and start a new one
        chunks.push({
          content: currentChunk.trim(),
        });
        
        // Start new chunk with overlap from previous chunk
        const sentences = currentChunk.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const overlapText = sentences.slice(-2).join('. ') + (sentences.length > 2 ? '.' : '');
        
        currentChunk = overlapText + '\n\n' + paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add the final chunk
    if (currentChunk.trim().length >= this.MIN_CHUNK_SIZE) {
      chunks.push({
        content: currentChunk.trim(),
      });
    }
    
    return chunks;
  }

  /**
   * Calculate optimal number of cards for a specific chunk (research-based approach)
   */
  private calculateChunkCardCount(
    chunk: { content: string },
    analysis: ContentAnalysis,
    baseCount: number,
    isLastChunk: boolean
  ): number {
    // Research-based approach: Conservative card count per chunk
    let cardCount = Math.max(baseCount, 3); // Reduced minimum to 3 cards per chunk
    
    // Conservative density scaling - focus on quality concepts
    const densityMultiplier = Math.min(1.5, analysis.wordCount / 300); // Slower, more conservative scaling
    cardCount = Math.round(cardCount * densityMultiplier);
    
    // Moderate boost for complex content only
    if (analysis.complexity === 'complex') {
      cardCount = Math.round(cardCount * 1.2); // Reduced multiplier
    }
    
    // Research-backed bounds: 3-12 cards per chunk for optimal learning
    cardCount = Math.max(3, Math.min(12, cardCount)); // Much tighter range: 3-12 cards per chunk
    
    // Small boost for last chunk only if needed
    if (isLastChunk && cardCount < 5) {
      cardCount = Math.min(cardCount + 2, 8); // Conservative boost
    }
    
    return cardCount;
  }

  /**
   * Build specialized prompt for chunked content processing
   */
  private buildChunkedFlashcardPrompt(
    request: GenerateFlashcardsRequest,
    analysis: ContentAnalysis,
    chunk: { content: string },
    chunkIndex: number,
    totalChunks: number
  ): string {
    const { numberOfCards, language, subject } = request;
    
    const contextInfo = `Processing part ${chunkIndex} of ${totalChunks} from a larger document`;
    
    // Build concept guidelines if available
    let conceptGuidelines = '';
    if (analysis?.educationalConcepts && analysis.educationalConcepts.length > 0) {
      const relevantConcepts = analysis.educationalConcepts
        ?.filter(c => chunk.content.toLowerCase().includes(c.concept.toLowerCase()))
        ?.slice(0, 3)
        ?.map(c => `- ${c.concept}`)
        ?.join('\n') || '';
      
      if (relevantConcepts) {
        conceptGuidelines = `\nKEY CONCEPTS IN THIS CONTENT:\n${relevantConcepts}\n`;
      }
    }
    
    return `You are an expert educator creating high-quality flashcards for optimal learning. You are processing educational content.

${contextInfo}
Content Analysis: ${analysis.wordCount} words, ${analysis.complexity} complexity${conceptGuidelines}

CONTENT:
${chunk.content}

CRITICAL: AVOID META-QUESTIONS
❌ NEVER create flashcards about:
- Document structure ("What topics are covered?")
- Document navigation ("What comes next?")
- Chapter or part references
- Overview or summary questions about the document itself
- Organizational elements or learning objectives

✅ ONLY create flashcards about EDUCATIONAL CONTENT:
- Specific facts, definitions, and concepts explained here
- Formulas, equations, and calculations presented
- Processes and procedures described
- Examples and applications mentioned
- Historical facts, dates, and figures cited
- Technical terminology introduced
- Cause-and-effect relationships explained

CONTENT-FOCUSED CREATION STRATEGY:

1. CONTENT-FIRST EXTRACTION:
   - Extract factual knowledge that students need to learn from this content
   - Focus on "what", "how", "when", "where" about actual subject matter
   - Prioritize definitions, principles, and key facts presented
   - Include specific examples and applications mentioned

2. SPECIFIC QUESTIONS:
   - Definition: "What is [concept] as defined in this content?"
   - Factual: "According to this content, what [specific fact]?"
   - Process: "What are the steps for [process] described?"
   - Application: "What example of [concept] is given?"
   - Calculation: "How do you calculate [formula]?"

3. QUALITY STANDARDS:
   - Each card must test specific, actionable knowledge from this content
   - Questions should be answerable entirely from the provided content
   - Avoid vague or meta-level questions about the document structure
   - Ensure answers are concrete and verifiable from the text

4. CONTENT COVERAGE:
   - Extract ALL numerical values, formulas, and key facts
   - Create cards for important terminology and definitions
   - Include historical context, dates, and figures mentioned
   - Cover both theoretical knowledge and practical applications shown

GOOD CONTENT-SPECIFIC EXAMPLES:
❌ BAD: {"q":"What is the main focus of this content?","a":"Various concepts","difficulty":"easy"}
✅ GOOD: {"q":"What is the definition of mitochondria given in this text?","a":"The powerhouse of the cell that produces ATP through cellular respiration","difficulty":"medium"}

❌ BAD: {"q":"What topics are discussed here?","a":"Economic principles","difficulty":"easy"}
✅ GOOD: {"q":"According to this content, what factors affect market price?","a":"Supply, demand, production costs, and consumer preferences","difficulty":"medium"}

RESPONSE FORMAT:
Respond ONLY with a JSON array in this exact format:
[{"q":"question text","a":"answer text","difficulty":"easy|medium|hard"}]

Generate exactly ${numberOfCards} high-quality, content-focused flashcards from this content. Start your response with [ and end with ]`;
  }

  /**
   * Validate flashcard quality and filter out meta-questions
   */
  private validateFlashcardQuality(
    flashcards: FlashcardGeneration[], 
    contentAnalysis?: ContentAnalysis
  ): FlashcardGeneration[] {
    const validatedCards: FlashcardGeneration[] = [];
    const rejectedCards: { card: FlashcardGeneration; reason: string }[] = [];
    
    console.log(`[QualityValidation] Starting validation of ${flashcards.length} cards`);
    
    for (const card of flashcards) {
      const validationResult = this.validateSingleCard(card, contentAnalysis);
      
      if (validationResult.isValid) {
        validatedCards.push(card);
      } else {
        rejectedCards.push({ card, reason: validationResult.reason });
      }
    }
    
    const rejectionRate = (rejectedCards.length / flashcards.length) * 100;
    
    if (rejectedCards.length > 0) {
      console.log(`[QualityValidation] Rejected ${rejectedCards.length} cards (${rejectionRate.toFixed(1)}%):`, 
        rejectedCards.slice(0, 5).map(r => ({ question: r.card.front.substring(0, 60) + '...', reason: r.reason })));
    }
    
    console.log(`[QualityValidation] Validation completed: ${validatedCards.length}/${flashcards.length} cards passed (${(100-rejectionRate).toFixed(1)}% pass rate)`);
    
    return validatedCards;
  }

  /**
   * Validate a single flashcard for quality and content appropriateness
   */
  private validateSingleCard(
    card: FlashcardGeneration, 
    contentAnalysis?: ContentAnalysis
  ): { isValid: boolean; reason: string } {
    const question = card.front.toLowerCase();
    const answer = card.back.toLowerCase();
    
    // Check for meta-questions (primary filter)
    const metaQuestionPatterns = [
      /what (?:are )?the main topics covered/,
      /what topics (?:are )?(?:discussed|covered)/,
      /what is (?:the )?(?:main )?(?:focus|purpose) of/,
      /what (?:does )?this (?:lecture|document|text) cover/,
      /what (?:comes|happens) (?:after|before|next)/,
      /what is (?:the )?overview of/,
      /what is (?:the )?introduction to/,
      /what are (?:the )?learning objectives/,
      /what is (?:the )?structure of/,
      /what (?:page|slide) (?:discusses|covers)/,
    ];
    
    for (const pattern of metaQuestionPatterns) {
      if (pattern.test(question)) {
        return { isValid: false, reason: `Meta-question detected: ${pattern.source}` };
      }
    }
    
    // Check for structural/navigational questions
    const structuralPatterns = [
      /(?:page|slide)\s*\d+/,
      /table of contents/,
      /learning objectives/,
      /course outline/,
      /next topic/,
      /previous topic/,
    ];
    
    for (const pattern of structuralPatterns) {
      if (pattern.test(question) || pattern.test(answer)) {
        return { isValid: false, reason: `Structural reference detected: ${pattern.source}` };
      }
    }
    
    // Check for vague or non-specific answers
    const vagueAnswerPatterns = [
      /^(?:various|different|multiple|several)\s+\w+$/,
      /^(?:many|some|few)\s+\w+$/,
      /concepts?$/,
      /topics?$/,
      /principles?$/,
      /^it (?:covers|discusses|explains)/,
    ];
    
    for (const pattern of vagueAnswerPatterns) {
      if (pattern.test(answer.trim())) {
        return { isValid: false, reason: `Vague answer detected: ${pattern.source}` };
      }
    }
    
    // Check minimum content quality
    if (card.front.trim().length < 10) {
      return { isValid: false, reason: 'Question too short' };
    }
    
    if (card.back.trim().length < 5) {
      return { isValid: false, reason: 'Answer too short' };
    }
    
    // Enhanced educational value check - stricter requirements
    const educationalIndicators = [
      /what is\s+(?:the\s+)?(?:definition|meaning|purpose|function|role)\s+of/,
      /how (?:does|do|is|are)\s+\w+.*(?:work|function|operate|affect|influence)/,
      /why (?:does|do|is|are)\s+\w+.*(?:important|necessary|effective|used)/,
      /when (?:does|do|did|was|were)\s+\w+.*(?:occur|happen|develop|discovered)/,
      /where (?:does|do|is|are)\s+\w+.*(?:located|found|used|applied)/,
      /define\s+(?:the\s+term\s+)?\w+/,
      /calculate\s+(?:the\s+)?\w+/,
      /what\s+(?:is\s+the\s+)?formula\s+for/,
      /(?:give\s+an?\s+)?example\s+of/,
      /what\s+(?:are\s+the\s+)?steps\s+(?:to|for|in)/,
      /what\s+(?:is\s+the\s+)?relationship\s+between/,
      /what\s+(?:is\s+the\s+)?difference\s+between/,
      /according\s+to.*what\s+(?:is|are)/,
      /what.*(?:primary\s+function|main\s+purpose|key\s+role|primary\s+effect)/,
      /which.*(?:type\s+of|kind\s+of|method\s+of)/,
      /name\s+(?:the\s+)?(?:main\s+)?(?:components|parts|elements|factors)/,
      /list\s+(?:the\s+)?(?:main\s+)?(?:factors|reasons|steps|components)/,
    ];
    
    const hasEducationalValue = educationalIndicators.some(pattern => pattern.test(question));
    
    // Stricter validation: Require clear educational patterns
    if (!hasEducationalValue) {
      // Check if the question contains specific educational concepts
      const hasConceptReference = contentAnalysis?.educationalConcepts
        ?.slice(0, 5) // Only check top 5 concepts
        ?.some(concept => {
          const conceptWords = concept.concept.toLowerCase().split(' ');
          return conceptWords.some(word => word.length > 3 && question.includes(word));
        });
      
      if (!hasConceptReference) {
        return { isValid: false, reason: 'No clear educational question pattern or concept reference' };
      }
    }
    
    // Additional check for answer quality
    const answerHasSubstance = answer.length >= 20 && 
      (answer.includes(' ') && answer.split(' ').length >= 4); // At least 4 words
    
    if (!answerHasSubstance) {
      return { isValid: false, reason: 'Answer lacks sufficient detail or substance' };
    }
    
    // Check for meaningful content in answer
    if (card.back.trim() === card.front.trim()) {
      return { isValid: false, reason: 'Question and answer are identical' };
    }
    
    return { isValid: true, reason: 'Valid educational flashcard' };
  }

  /**
   * Deduplicate and optimize the final set of flashcards
   */
  private deduplicateAndOptimizeCards(
    allFlashcards: FlashcardGeneration[],
    targetCount: number
  ): FlashcardGeneration[] {
    console.log(`[FlashcardGenerator] Deduplication starting: ${allFlashcards.length} cards, target: ${targetCount}`);
    
    // Remove near-duplicates based on question similarity - more aggressive filtering
    const uniqueCards: FlashcardGeneration[] = [];
    
    for (const card of allFlashcards) {
      const isDuplicate = uniqueCards.some(existing => {
        const similarity = this.calculateSimilarity(card.front, existing.front);
        const answerSimilarity = this.calculateSimilarity(card.back, existing.back);
        
        // Consider it a duplicate if either questions are very similar OR answers are very similar
        return similarity > 0.75 || answerSimilarity > 0.8; // More aggressive thresholds
      });
      
      if (!isDuplicate) {
        uniqueCards.push(card);
      }
    }
    
    console.log(`[FlashcardGenerator] After deduplication: ${uniqueCards.length} unique cards`);
    
    // Research-based optimization: Keep only the best cards if we exceed target
    // More aggressive optimization for better learning outcomes
    const optimizationThreshold = Math.max(targetCount * 1.5, 40); // Lower threshold for optimization
    
    if (uniqueCards.length > optimizationThreshold) {
      console.log(`[FlashcardGenerator] Optimizing: ${uniqueCards.length} > ${optimizationThreshold} threshold`);
      const optimized = this.selectBestCards(uniqueCards, Math.min(targetCount, 30)); // Cap at 30 cards max
      console.log(`[FlashcardGenerator] After optimization: ${optimized.length} cards`);
      return optimized;
    }
    
    console.log(`[FlashcardGenerator] No optimization needed, returning ${uniqueCards.length} cards`);
    return uniqueCards;
  }

  /**
   * Calculate text similarity between two strings
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  /**
   * Select the best cards when we have too many
   */
  private selectBestCards(cards: FlashcardGeneration[], targetCount: number): FlashcardGeneration[] {
    // Score each card based on multiple factors
    const scoredCards = cards.map(card => ({
      card,
      score: this.scoreCard(card, cards),
    }));
    
    // Sort by score and take the top cards
    scoredCards.sort((a, b) => b.score - a.score);
    
    // Ensure we have difficulty distribution
    const selected = this.ensureDifficultyDistribution(
      scoredCards.map(sc => sc.card),
      targetCount
    );
    
    return selected;
  }

  /**
   * Score a card based on quality factors
   */
  private scoreCard(card: FlashcardGeneration, allCards: FlashcardGeneration[]): number {
    let score = 0;
    
    // Question length (prefer medium-length questions)
    const questionLength = card.front.length;
    if (questionLength >= 20 && questionLength <= 100) score += 2;
    else if (questionLength >= 10 && questionLength <= 150) score += 1;
    
    // Answer completeness
    const answerLength = card.back.length;
    if (answerLength >= 20 && answerLength <= 200) score += 2;
    else if (answerLength >= 10 && answerLength <= 300) score += 1;
    
    // Difficulty distribution preference
    if (card.difficulty === 'medium') score += 1;
    
    // Tag diversity bonus
    const uniqueTags = card.tags?.filter(tag => 
      allCards.filter(c => c.tags?.includes(tag)).length <= allCards.length * 0.3
    ).length || 0;
    score += uniqueTags * 0.5;
    
    // Question word variety
    const questionWords = card.front.toLowerCase().split(/\s+/);
    const commonWords = ['what', 'when', 'where', 'who', 'why', 'how', 'is', 'are', 'the', 'a', 'an'];
    const uniqueWords = questionWords.filter(word => !commonWords.includes(word)).length;
    score += Math.min(2, uniqueWords * 0.1);
    
    return score;
  }

  /**
   * Ensure good distribution of difficulty levels
   */
  private ensureDifficultyDistribution(cards: FlashcardGeneration[], targetCount: number): FlashcardGeneration[] {
    const easyCards = cards.filter(c => c.difficulty === 'easy');
    const mediumCards = cards.filter(c => c.difficulty === 'medium');
    const hardCards = cards.filter(c => c.difficulty === 'hard');
    
    // Target distribution: 30% easy, 50% medium, 20% hard
    const targetEasy = Math.round(targetCount * 0.3);
    const targetMedium = Math.round(targetCount * 0.5);
    const targetHard = targetCount - targetEasy - targetMedium;
    
    const selected: FlashcardGeneration[] = [];
    
    // Select from each difficulty level
    selected.push(...easyCards.slice(0, Math.min(targetEasy, easyCards.length)));
    selected.push(...mediumCards.slice(0, Math.min(targetMedium, mediumCards.length)));
    selected.push(...hardCards.slice(0, Math.min(targetHard, hardCards.length)));
    
    // Fill remaining slots with best available cards
    const remaining = cards.filter(card => !selected.includes(card));
    const neededCount = targetCount - selected.length;
    selected.push(...remaining.slice(0, neededCount));
    
    return selected.slice(0, targetCount);
  }

  /**
   * Emergency fallback parser when all other strategies fail
   */
  private emergencyFallbackParser(response: string): FlashcardGeneration[] {
    console.log('[FlashcardGenerator] Using emergency fallback parser');
    
    // Look for any text that might be questions and answers
    const cards: FlashcardGeneration[] = [];
    
    // Split into sentences and look for question marks
    const sentences = response.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    
    for (let i = 0; i < sentences.length - 1; i++) {
      const current = sentences[i];
      const next = sentences[i + 1];
      
      // If current sentence ends with a question mark or contains question words
      if (current && (current.match(/\?$/) || current.match(/^(what|who|when|where|why|how|which|define|explain)/i))) {
        if (next && next.length > 10) { // Basic validation for answer length
          cards.push({
            front: current.replace(/^[^\w]*/, '').trim(), // Remove leading non-word chars
            back: next.replace(/^[^\w]*/, '').trim(),
            tags: [],
            difficulty: 'medium',
          });
        }
      }
    }
    
    // If still no cards, try to extract any meaningful content
    if (cards.length === 0) {
      const lines = response.split('\n').map(l => l.trim()).filter(l => l.length > 20);
      
      for (let i = 0; i < lines.length - 1; i += 2) {
        const line1 = lines[i];
        const line2 = lines[i + 1];
        if (line1 && line2) {
          cards.push({
            front: line1,
            back: line2,
            tags: [],
            difficulty: 'medium',
          });
        }
      }
    }
    
    console.log(`[FlashcardGenerator] Emergency parser extracted ${cards.length} cards`);
    return cards.slice(0, 5); // Limit to 5 cards max from emergency parsing
  }

  /**
   * Generate flashcards from images using Gemini Vision API
   */
  private async generateFlashcardsFromImage(
    request: GenerateFlashcardsRequest
  ): Promise<GenerateFlashcardsResponse> {
    const startTime = Date.now();
    
    console.log(`[FlashcardGenerator] Processing image for flashcard generation`);

    // Build a prompt for image-to-flashcard conversion
    const prompt = this.buildImageFlashcardPrompt(request);
    
    try {
      // Use Gemini Vision API to process the image
      const response = await this.client.generateContentWithImage({
        prompt,
        imageData: request.imageData!,
        maxTokens: 2000,
      });

      // Parse the flashcards from the response
      const flashcards = this.parseFlashcardsFromResponse(response.content);
      
      // Validate and filter the generated flashcards
      const validatedCards = this.validateFlashcardQuality(flashcards);
      
      console.log(`[FlashcardGenerator] Image processing completed:`, {
        inputImageSize: request.imageData?.length || 0,
        rawCards: flashcards.length,
        validatedCards: validatedCards.length,
        processingTime: Date.now() - startTime,
      });

      return {
        flashcards: validatedCards,
        metadata: {
          tokensUsed: response.tokensUsed || 0,
          estimatedCost: response.estimatedCost || 0,
          processingTime: Date.now() - startTime,
          model: 'gemini-vision',
        },
      };
    } catch (error) {
      console.error('[FlashcardGenerator] Image processing failed:', error);
      throw error;
    }
  }

  /**
   * Build a prompt specifically for image-to-flashcard conversion
   */
  private buildImageFlashcardPrompt(request: GenerateFlashcardsRequest): string {
    const { numberOfCards, difficulty, language, subject } = request;
    
    const difficultyInstruction = difficulty 
      ? `Target difficulty: ${difficulty}. `
      : 'Mix easy, medium, and hard questions appropriately. ';
    
    const subjectContext = subject 
      ? `Subject context: ${subject}. `
      : '';

    return `You are an expert educational content creator. Analyze this image and extract text content to create high-quality flashcards for learning.

TASK: Extract all text from this image and create exactly ${numberOfCards} educational flashcards.

INSTRUCTIONS:
1. CONTENT EXTRACTION:
   - Read ALL text visible in the image (handwritten notes, printed text, diagrams, formulas, etc.)
   - Pay attention to headings, bullet points, definitions, examples, and key concepts
   - Include any mathematical formulas, equations, or scientific notation
   - Note any diagrams, charts, or visual elements that contain educational content

2. FLASHCARD CREATION:
   - Create questions that test understanding of the extracted content
   - Focus on key concepts, definitions, facts, and relationships
   - Make questions specific and directly answerable from the image content
   - ${difficultyInstruction}
   - ${subjectContext}

3. QUESTION TYPES TO USE:
   - Definition: "What is [concept] as shown in this image?"
   - Factual: "According to this content, what [specific fact]?"
   - Process: "What steps are shown for [process]?"
   - Formula: "What is the formula shown for [calculation]?"
   - Application: "What example of [concept] is given?"

4. QUALITY STANDARDS:
   - Each card must test specific knowledge from the image
   - Questions should be answerable entirely from the visible content
   - Avoid vague questions about document structure
   - Ensure answers are concrete and verifiable from the image
   - Language: ${language}

RESPONSE FORMAT:
Respond ONLY with a JSON array in this exact format:
[{"q":"question text","a":"answer text","difficulty":"easy|medium|hard"}]

Extract content from the image and generate exactly ${numberOfCards} high-quality flashcards. Start your response with [ and end with ]`;
  }

}