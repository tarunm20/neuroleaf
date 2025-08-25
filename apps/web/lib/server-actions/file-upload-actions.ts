'use server';

import PDFParser from 'pdf2json';
import mammoth from 'mammoth';

export interface TextExtractionResult {
  text: string;
  success: boolean;
  error?: string;
  tokenCount: number;
  wordCount?: number; // Keep for backward compatibility during transition
  fileInfo: {
    name: string;
    size: number;
    type: string;
  };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function extractTextFromFileAction(formData: FormData): Promise<TextExtractionResult> {
  console.log('Starting file extraction...');
  
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('No file provided in form data');
      return {
        text: '',
        success: false,
        error: 'No file provided',
        tokenCount: 0,
        wordCount: 0, // Keep for compatibility
        fileInfo: { name: '', size: 0, type: '' }
      };
    }

    console.log('File details:', { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    });

    // Basic validation
    if (file.size > MAX_FILE_SIZE) {
      console.log('File too large:', file.size);
      return {
        text: '',
        success: false,
        error: 'File too large. Maximum size is 10MB.',
        tokenCount: 0,
        wordCount: 0, // Keep for compatibility
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
      console.log('Unsupported file type:', file.type);
      return {
        text: '',
        success: false,
        error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.',
        tokenCount: 0,
        wordCount: 0, // Keep for compatibility
        fileInfo: { name: file.name, size: file.size, type: file.type }
      };
    }

    let extractedText = '';

    // Extract text based on file type
    try {
      if (file.type === 'application/pdf') {
        console.log('Processing PDF file:', file.name);
        extractedText = await extractFromPDF(file);
        console.log('PDF processed successfully, text length:', extractedText.length);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.log('Processing DOCX file:', file.name);
        extractedText = await extractFromDOCX(file);
        console.log('DOCX processed successfully, text length:', extractedText.length);
      } else if (file.type === 'text/plain') {
        console.log('Processing TXT file:', file.name);
        extractedText = await extractFromTXT(file);
        console.log('TXT processed successfully, text length:', extractedText.length);
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      
      // For PDFs, provide a helpful error message
      if (file.type === 'application/pdf') {
        return {
          text: '',
          success: false,
          error: 'Failed to extract text from PDF. The PDF might be scanned/image-based or corrupted. Please try a text-based PDF or convert it to a text file.',
          tokenCount: 0,
          wordCount: 0, // Keep for compatibility
          fileInfo: { name: file.name, size: file.size, type: file.type }
        };
      }
      
      throw extractionError; // Re-throw for other types
    }

    // Clean and count words and tokens
    const cleanedText = cleanText(extractedText);
    const wordCount = countWords(cleanedText);
    const tokenCount = countTokens(cleanedText);

    console.log('Final processed text length:', cleanedText.length, 'word count:', wordCount, 'token count:', tokenCount);

    if (cleanedText.length === 0) {
      return {
        text: '',
        success: false,
        error: 'No text content could be extracted from this file. The file might be empty, image-based, or corrupted.',
        tokenCount: 0,
        wordCount: 0, // Keep for compatibility
        fileInfo: { name: file.name, size: file.size, type: file.type }
      };
    }

    return {
      text: cleanedText,
      success: true,
      tokenCount,
      wordCount, // Keep for compatibility
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    };

  } catch (error) {
    console.error('File extraction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract text from file';
    console.error('Error details:', errorMessage);
    
    return {
      text: '',
      success: false,
      error: errorMessage,
      tokenCount: 0,
      wordCount: 0, // Keep for compatibility
      fileInfo: { name: '', size: 0, type: '' }
    };
  }
}

async function extractFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, true);
      
      // Set a timeout to avoid hanging
      const timeout = setTimeout(() => {
        reject(new Error('PDF parsing timed out'));
      }, 30000); // 30 second timeout
      
      pdfParser.on('pdfParser_dataError', (errData) => {
        clearTimeout(timeout);
        reject(new Error(`PDF parsing error: ${errData?.parserError || 'Unknown PDF error'}`));
      });
      
      pdfParser.on('pdfParser_dataReady', () => {
        try {
          clearTimeout(timeout);
          const text = pdfParser.getRawTextContent();
          if (!text || text.trim().length === 0) {
            reject(new Error('No text content found in PDF'));
          } else {
            resolve(text);
          }
        } catch {
          clearTimeout(timeout);
          reject(new Error('Failed to extract text from PDF'));
        }
      });

      try {
        pdfParser.parseBuffer(buffer);
      } catch (error) {
        clearTimeout(timeout);
        reject(new Error(`Failed to parse PDF buffer: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  } catch (error) {
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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

function countTokens(text: string): number {
  if (!text.trim()) return 0;
  // Google Gemini: approximately 4 characters = 1 token
  return Math.ceil(text.length / 4);
}

