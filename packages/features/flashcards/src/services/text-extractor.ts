import mammoth from 'mammoth';

export interface TextExtractionResult {
  text: string;
  success: boolean;
  error?: string;
  wordCount: number;
}

export class TextExtractor {
  static async extractFromFile(file: File): Promise<TextExtractionResult> {
    try {
      let text = '';
      
      if (file.type === 'application/pdf') {
        text = await this.extractFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await this.extractFromDOCX(file);
      } else if (file.type === 'text/plain') {
        text = await this.extractFromTXT(file);
      } else {
        throw new Error('Unsupported file type');
      }

      const cleanedText = this.cleanText(text);
      const wordCount = this.countWords(cleanedText);

      return {
        text: cleanedText,
        success: true,
        wordCount,
      };
    } catch (error) {
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract text',
        wordCount: 0,
      };
    }
  }

  private static async extractFromPDF(_file: File): Promise<string> {
    // PDF support disabled for now due to browser compatibility issues
    throw new Error('PDF support is temporarily disabled. Please use DOCX or TXT files instead.');
  }

  private static async extractFromDOCX(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  private static async extractFromTXT(file: File): Promise<string> {
    return await file.text();
  }

  private static cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private static countWords(text: string): number {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }
}