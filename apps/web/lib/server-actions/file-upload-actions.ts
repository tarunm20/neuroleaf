'use server';

import PDFParser from 'pdf2json';
import mammoth from 'mammoth';

export interface TextExtractionResult {
  text: string;
  success: boolean;
  error?: string;
  wordCount: number;
  fileInfo: {
    name: string;
    size: number;
    type: string;
  };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function extractTextFromFileAction(formData: FormData): Promise<TextExtractionResult> {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        text: '',
        success: false,
        error: 'No file provided',
        wordCount: 0,
        fileInfo: { name: '', size: 0, type: '' }
      };
    }

    // Basic validation
    if (file.size > MAX_FILE_SIZE) {
      return {
        text: '',
        success: false,
        error: 'File too large. Maximum size is 10MB.',
        wordCount: 0,
        fileInfo: { name: file.name, size: file.size, type: file.type }
      };
    }

    // Validate file type
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!supportedTypes.includes(file.type)) {
      return {
        text: '',
        success: false,
        error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.',
        wordCount: 0,
        fileInfo: { name: file.name, size: file.size, type: file.type }
      };
    }

    let extractedText = '';

    // Extract text based on file type
    if (file.type === 'application/pdf') {
      extractedText = await extractFromPDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      extractedText = await extractFromDOCX(file);
    } else if (file.type === 'text/plain') {
      extractedText = await extractFromTXT(file);
    }

    // Clean and count words
    const cleanedText = cleanText(extractedText);
    const wordCount = countWords(cleanedText);

    return {
      text: cleanedText,
      success: true,
      wordCount,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    };

  } catch (error) {
    console.error('File extraction error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract text from file',
      wordCount: 0,
      fileInfo: { name: '', size: 0, type: '' }
    };
  }
}

async function extractFromPDF(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfParser = new PDFParser(null, true);
      
      pdfParser.on('pdfParser_dataError', (errData) => {
        reject(new Error(`PDF parsing error: ${errData.parserError}`));
      });
      
      pdfParser.on('pdfParser_dataReady', () => {
        try {
          const text = pdfParser.getRawTextContent();
          resolve(text);
        } catch {
          reject(new Error('Failed to extract text from PDF'));
        }
      });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      pdfParser.parseBuffer(buffer);
    } catch (error) {
      reject(error);
    }
  });
}

async function extractFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractFromTXT(file: File): Promise<string> {
  return await file.text();
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}