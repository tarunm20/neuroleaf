// Dynamic imports for client-side PDF generation

export interface Flashcard {
  id: string;
  front_content: string;
  back_content: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  position: number;
  created_at: string;
  ai_generated?: boolean;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  total_cards: number;
}

export interface ExportOptions {
  format: 'pdf' | 'json' | 'csv';
  includeTags?: boolean;
  includeDifficulty?: boolean;
  includeMetadata?: boolean;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  pdfLayout?: 'cards' | 'study-guide' | 'print-cards';
}

export class FlashcardExportService {
  private cleanText(text: string): string {
    // Remove HTML tags and clean up text for PDF export
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private splitText(text: string, maxWidth: number, fontSize: number = 12): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Approximate character width for the font size
    const charWidth = fontSize * 0.6;
    const maxCharsPerLine = Math.floor(maxWidth / charWidth);
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, break it
          lines.push(word.substring(0, maxCharsPerLine));
          currentLine = word.substring(maxCharsPerLine);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  // Minimalistic color scheme
  private getColorTheme() {
    return {
      primary: [70, 70, 70],        // Dark gray
      secondary: [120, 120, 120],   // Medium gray
      light: [180, 180, 180],       // Light gray
      text: [40, 40, 40],           // Almost black
      background: [250, 250, 250],  // Very light gray
      accent: [70, 130, 180],       // Steel blue accent
      easy: [100, 150, 100],        // Muted green
      medium: [180, 140, 70],       // Muted orange
      hard: [180, 100, 100],        // Muted red
    };
  }

  async exportToPDF(
    deck: Deck, 
    flashcards: Flashcard[], 
    options: ExportOptions = { format: 'pdf' }
  ): Promise<void> {
    // Dynamically import jsPDF for client-side use
    const { jsPDF } = await import('jspdf');
    
    const {
      pageSize = 'a4',
      orientation = 'portrait',
      includeTags = true,
      includeDifficulty = true,
      includeMetadata = true,
      pdfLayout = 'cards'
    } = options;

    const colors = this.getColorTheme();
    const doc = new jsPDF(orientation, 'mm', pageSize);
    
    // Page dimensions
    const pageWidth = orientation === 'portrait' ? 210 : 297;
    const pageHeight = orientation === 'portrait' ? 297 : 210;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Create professional cover page
    this.createCoverPage(doc, deck, flashcards, colors, pageWidth, pageHeight, margin, includeMetadata);
    
    // Add flashcards based on layout
    doc.addPage();
    
    switch (pdfLayout) {
      case 'cards':
        this.createCardLayout(doc, flashcards, colors, pageWidth, pageHeight, margin, contentWidth, includeTags, includeDifficulty);
        break;
      case 'study-guide':
        this.createStudyGuideLayout(doc, flashcards, colors, pageWidth, pageHeight, margin, contentWidth, includeTags, includeDifficulty);
        break;
      case 'print-cards':
        this.createPrintCardsLayout(doc, flashcards, colors, pageWidth, pageHeight, includeTags, includeDifficulty);
        break;
      default:
        this.createCardLayout(doc, flashcards, colors, pageWidth, pageHeight, margin, contentWidth, includeTags, includeDifficulty);
    }
    
    // Save the PDF
    const fileName = `${deck.name.replace(/[^a-zA-Z0-9]/g, '_')}_flashcards.pdf`;
    doc.save(fileName);
  }

  private createCoverPage(
    doc: any, 
    deck: Deck, 
    flashcards: Flashcard[], 
    colors: ReturnType<typeof this.getColorTheme>, 
    pageWidth: number, 
    pageHeight: number, 
    margin: number, 
    includeMetadata: boolean
  ) {
    // Simple header line
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1);
    doc.line(margin, 40, pageWidth - margin, 40);
    
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...colors.text);
    doc.text(deck.name, pageWidth / 2, 60, { align: 'center' });
    
    // Subtitle
    if (deck.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(...colors.secondary);
      const descLines = this.splitText(deck.description, pageWidth - 2 * margin, 12);
      let yPos = 75;
      descLines.slice(0, 2).forEach(line => {
        doc.text(line, pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;
      });
    }
    
    if (includeMetadata) {
      // Simple statistics
      const startY = 110;
      const lineHeight = 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...colors.text);
      
      const stats = [
        `Total Cards: ${flashcards.length}`,
        `Export Date: ${new Date().toLocaleDateString()}`,
        `Format: PDF`
      ];
      
      stats.forEach((stat, index) => {
        doc.text(stat, pageWidth / 2, startY + (index * lineHeight), { align: 'center' });
      });
      
      // Bottom line
      const bottomY = startY + (stats.length * lineHeight) + 10;
      doc.setDrawColor(...colors.light);
      doc.setLineWidth(0.5);
      doc.line(margin + 40, bottomY, pageWidth - margin - 40, bottomY);
    }
    
    // Simple footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...colors.light);
    doc.text('Generated by Neuroleaf', pageWidth / 2, pageHeight - 20, { align: 'center' });
  }


  private createCardLayout(
    doc: any, 
    flashcards: Flashcard[], 
    colors: ReturnType<typeof this.getColorTheme>, 
    pageWidth: number, 
    pageHeight: number, 
    margin: number, 
    contentWidth: number, 
    includeTags: boolean, 
    includeDifficulty: boolean
  ) {
    let currentY = margin;
    const cardPadding = 8;
    const cardMargin = 10;
    
    flashcards.forEach((flashcard, index) => {
      const cardHeight = this.calculateCardHeight(flashcard, contentWidth, cardPadding, includeTags);
      
      // Check if we need a new page
      if (currentY + cardHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        this.addPageHeader(doc, `Flashcards (Page ${doc.internal.getCurrentPageInfo().pageNumber - 1})`, colors, pageWidth, margin);
        currentY += 20;
      }
      
      // Simple card border
      doc.setDrawColor(...colors.light);
      doc.setLineWidth(0.5);
      doc.rect(margin, currentY, contentWidth, cardHeight, 'S');
      
      // Difficulty accent line (left side)
      if (includeDifficulty) {
        const difficultyColor = flashcard.difficulty === 'easy' ? colors.easy : 
                               flashcard.difficulty === 'medium' ? colors.medium : colors.hard;
        doc.setDrawColor(...difficultyColor);
        doc.setLineWidth(3);
        doc.line(margin, currentY, margin, currentY + cardHeight);
      }
      
      let cardY = currentY + cardPadding;
      
      // Card header with number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...colors.primary);
      doc.text(`Card ${index + 1}`, margin + cardPadding, cardY);
      
      if (includeDifficulty) {
        const difficultyColor = flashcard.difficulty === 'easy' ? colors.easy : 
                               flashcard.difficulty === 'medium' ? colors.medium : colors.hard;
        doc.setTextColor(...difficultyColor);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(flashcard.difficulty.toUpperCase(), margin + contentWidth - cardPadding - 30, cardY);
      }
      
      cardY += 12;
      
      // Front content section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...colors.secondary);
      doc.text('Q:', margin + cardPadding, cardY);
      
      cardY += 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...colors.text);
      
      const frontLines = this.splitText(this.cleanText(flashcard.front_content), contentWidth - 2 * cardPadding - 10, 11);
      frontLines.forEach(line => {
        doc.text(line, margin + cardPadding + 10, cardY);
        cardY += 6;
      });
      
      cardY += 4;
      
      // Back content section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...colors.secondary);
      doc.text('A:', margin + cardPadding, cardY);
      
      cardY += 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...colors.text);
      
      const backLines = this.splitText(this.cleanText(flashcard.back_content), contentWidth - 2 * cardPadding - 10, 11);
      backLines.forEach(line => {
        doc.text(line, margin + cardPadding + 10, cardY);
        cardY += 6;
      });
      
      // Simple tags
      if (includeTags && flashcard.tags.length > 0) {
        cardY += 4;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...colors.light);
        const tagsText = flashcard.tags.slice(0, 5).join(' • ');
        doc.text(tagsText, margin + cardPadding, cardY);
      }
      
      currentY += cardHeight + cardMargin;
    });
  }

  private calculateCardHeight(flashcard: Flashcard, contentWidth: number, cardPadding: number, _includeTags: boolean): number {
    const frontLines = this.splitText(this.cleanText(flashcard.front_content), contentWidth - 2 * cardPadding, 11).length;
    const backLines = this.splitText(this.cleanText(flashcard.back_content), contentWidth - 2 * cardPadding, 11).length;
    const baseHeight = 40; // Header + labels + spacing
    const contentHeight = (frontLines + backLines) * 6;
    const tagsHeight = (flashcard.tags.length > 0) ? 12 : 0;
    return baseHeight + contentHeight + tagsHeight;
  }

  private createStudyGuideLayout(
    doc: any, 
    flashcards: Flashcard[], 
    colors: ReturnType<typeof this.getColorTheme>, 
    pageWidth: number, 
    pageHeight: number, 
    margin: number, 
    contentWidth: number, 
    _includeTags: boolean, 
    _includeDifficulty: boolean
  ) {
    // Compact list format for quick reference
    let currentY = margin + 20;
    this.addPageHeader(doc, 'Study Guide', colors, pageWidth, margin);
    
    flashcards.forEach((flashcard, index) => {
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = margin + 20;
        this.addPageHeader(doc, 'Study Guide (Continued)', colors, pageWidth, margin);
      }
      
      // Question
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...colors.primary);
      const questionText = `${index + 1}. ${this.cleanText(flashcard.front_content)}`;
      const questionLines = this.splitText(questionText, contentWidth, 11);
      
      questionLines.forEach(line => {
        doc.text(line, margin, currentY);
        currentY += 6;
      });
      
      // Answer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      const answerLines = this.splitText(this.cleanText(flashcard.back_content), contentWidth - 10, 10);
      
      answerLines.forEach(line => {
        doc.text(line, margin + 5, currentY);
        currentY += 5;
      });
      
      currentY += 8;
    });
  }

  private createPrintCardsLayout(
    doc: any, 
    flashcards: Flashcard[], 
    colors: ReturnType<typeof this.getColorTheme>, 
    pageWidth: number, 
    pageHeight: number, 
    _includeTags: boolean, 
    _includeDifficulty: boolean
  ) {
    // 4x6 inch cards, 2 per page
    const cardWidth = 101.6; // 4 inches in mm
    const cardHeight = 152.4; // 6 inches in mm
    const cardSpacing = 10;
    
    for (let i = 0; i < flashcards.length; i += 2) {
      if (i > 0) doc.addPage();
      
      // First card
      const firstCard = flashcards[i];
      if (firstCard) {
        this.drawPrintCard(doc, firstCard, colors, (pageWidth - cardWidth) / 2, 20, cardWidth, cardHeight, _includeTags, _includeDifficulty);
      }
      
      // Second card if exists
      const secondCard = flashcards[i + 1];
      if (secondCard) {
        this.drawPrintCard(doc, secondCard, colors, (pageWidth - cardWidth) / 2, 20 + cardHeight + cardSpacing, cardWidth, cardHeight, _includeTags, _includeDifficulty);
      }
    }
  }

  private drawPrintCard(
    doc: any, 
    flashcard: Flashcard, 
    colors: ReturnType<typeof this.getColorTheme>, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    _includeTags: boolean, 
    _includeDifficulty: boolean
  ) {
    // Card border
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1);
    doc.rect(x, y, width, height, 'S');
    
    // Front section
    doc.setFillColor(...colors.background);
    doc.rect(x, y, width, height / 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.text('FRONT', x + 5, y + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    const frontLines = this.splitText(this.cleanText(flashcard.front_content), width - 10, 12);
    let textY = y + 20;
    frontLines.slice(0, 8).forEach(line => {
      doc.text(line, x + 5, textY);
      textY += 8;
    });
    
    // Divider line
    doc.setDrawColor(...colors.secondary);
    doc.setLineWidth(0.5);
    doc.line(x + 5, y + height / 2, x + width - 5, y + height / 2);
    
    // Back section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...colors.accent);
    doc.text('BACK', x + 5, y + height / 2 + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    const backLines = this.splitText(this.cleanText(flashcard.back_content), width - 10, 12);
    textY = y + height / 2 + 20;
    backLines.slice(0, 8).forEach(line => {
      doc.text(line, x + 5, textY);
      textY += 8;
    });
  }

  private addPageHeader(doc: any, title: string, colors: ReturnType<typeof this.getColorTheme>, pageWidth: number, margin: number) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...colors.primary);
    doc.text(title, pageWidth / 2, margin, { align: 'center' });
    
    // Simple underline
    doc.setDrawColor(...colors.light);
    doc.setLineWidth(0.3);
    doc.line(margin + 20, margin + 3, pageWidth - margin - 20, margin + 3);
  }

  exportToJSON(deck: Deck, flashcards: Flashcard[], options: ExportOptions = { format: 'json' }): void {
    const {
      includeTags = true,
      includeDifficulty = true,
      includeMetadata = true
    } = options;

    const exportData = {
      ...(includeMetadata && {
        metadata: {
          deck_name: deck.name,
          deck_description: deck.description,
          total_cards: flashcards.length,
          export_date: new Date().toISOString(),
          difficulties: flashcards.reduce((acc, card) => {
            acc[card.difficulty] = (acc[card.difficulty] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          ai_generated_count: flashcards.filter(card => card.ai_generated).length
        }
      }),
      flashcards: flashcards.map(card => ({
        id: card.id,
        front_content: card.front_content,
        back_content: card.back_content,
        position: card.position,
        created_at: card.created_at,
        ...(includeDifficulty && { difficulty: card.difficulty }),
        ...(includeTags && { tags: card.tags }),
        ...(includeMetadata && { ai_generated: card.ai_generated })
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${deck.name.replace(/[^a-zA-Z0-9]/g, '_')}_flashcards.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToCSV(deck: Deck, flashcards: Flashcard[], options: ExportOptions = { format: 'csv' }): void {
    const {
      includeTags = true,
      includeDifficulty = true,
      includeMetadata = true
    } = options;

    // Define headers
    const headers = ['Position', 'Front', 'Back'];
    if (includeDifficulty) headers.push('Difficulty');
    if (includeTags) headers.push('Tags');
    if (includeMetadata) headers.push('Created Date', 'AI Generated');

    // Create CSV content
    const csvContent = [
      // Headers
      headers.join(','),
      // Data rows
      ...flashcards.map(card => {
        const row = [
          card.position.toString(),
          `"${this.cleanText(card.front_content).replace(/"/g, '""')}"`,
          `"${this.cleanText(card.back_content).replace(/"/g, '""')}"`
        ];
        
        if (includeDifficulty) row.push(card.difficulty);
        if (includeTags) row.push(`"${card.tags.join('; ')}"`);
        if (includeMetadata) {
          row.push(new Date(card.created_at).toLocaleDateString());
          row.push(card.ai_generated ? 'Yes' : 'No');
        }
        
        return row.join(',');
      })
    ].join('\n');

    // Download CSV
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${deck.name.replace(/[^a-zA-Z0-9]/g, '_')}_flashcards.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async exportFlashcards(
    deck: Deck,
    flashcards: Flashcard[],
    options: ExportOptions
  ): Promise<void> {
    if (flashcards.length === 0) {
      throw new Error('No flashcards to export');
    }

    switch (options.format) {
      case 'pdf':
        await this.exportToPDF(deck, flashcards, options);
        break;
      case 'json':
        this.exportToJSON(deck, flashcards, options);
        break;
      case 'csv':
        this.exportToCSV(deck, flashcards, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }
}

// Singleton instance
export const flashcardExportService = new FlashcardExportService();