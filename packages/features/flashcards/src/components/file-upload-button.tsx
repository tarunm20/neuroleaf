'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@kit/ui/button';
// We'll import the server action and TextExtractionResult from the web app
// since server actions need to be defined there

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

export interface MultiFileExtractionResult {
  files: Array<{
    text: string;
    tokenCount: number;
    wordCount?: number; // Keep for backward compatibility during transition
    fileInfo: {
      name: string;
      size: number;
      type: string;
    };
  }>;
  combinedText: string;
  totalTokenCount: number;
  totalWordCount?: number; // Keep for backward compatibility during transition
  totalSize: number;
  success: boolean;
  error?: string;
}

// Client-side image processing function
async function processImageFile(file: File): Promise<TextExtractionResult> {
  try {
    // Convert image to base64
    const base64 = await fileToBase64(file);
    
    // Call Gemini Vision API directly from client
    const response = await fetch('/api/vision-ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: base64,
        fileName: file.name
      })
    });
    
    if (!response.ok) {
      throw new Error(`OCR failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'OCR processing failed');
    }
    
    // Count words and estimate tokens in extracted text
    const extractedText = data.text || '';
    const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
    const tokenCount = Math.ceil(extractedText.length / 4); // Estimate: 4 chars = 1 token
    
    return {
      text: extractedText,
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
    console.error('Image processing error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract text from image',
      tokenCount: 0,
      wordCount: 0, // Keep for compatibility
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    };
  }
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

interface FileUploadButtonProps {
  onTextExtracted?: (result: TextExtractionResult) => void; // For single file (backward compatibility)
  onMultipleFilesExtracted?: (result: MultiFileExtractionResult) => void; // For multiple files
  onError: (error: string) => void;
  extractTextAction: (formData: FormData) => Promise<TextExtractionResult>;
  disabled?: boolean;
  multiple?: boolean;
  isPro?: boolean;
  maxTotalCharacters?: number; // character limit instead of size
  maxFilesPerDeck?: number; // max files allowed per deck
  currentFileCount?: number; // current number of files already uploaded
}

export function FileUploadButton({ 
  onTextExtracted, 
  onMultipleFilesExtracted,
  onError, 
  extractTextAction,
  disabled = false,
  multiple = false,
  isPro: _isPro = false,
  maxTotalCharacters = 50000, // 50K characters for Free, 200K for Pro
  maxFilesPerDeck = 3, // Default to Free tier limit
  currentFileCount = 0 // Default to 0 files currently uploaded
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Reset input value so same file can be selected again
    event.target.value = '';

    // File count validation
    const totalFilesAfterUpload = currentFileCount + files.length;
    if (totalFilesAfterUpload > maxFilesPerDeck) {
      const remainingSlots = maxFilesPerDeck - currentFileCount;
      if (remainingSlots <= 0) {
        onError(`You've reached your file limit of ${maxFilesPerDeck} files per deck. Please remove some files before uploading more.`);
        return;
      } else {
        onError(`You can only upload ${remainingSlots} more file${remainingSlots === 1 ? '' : 's'}. Your limit is ${maxFilesPerDeck} files per deck.`);
        return;
      }
    }

    // Client-side file type validation
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    // Validate file types
    for (const file of files) {
      if (!supportedTypes.includes(file.type)) {
        onError(`Unsupported file type: ${file.name}. Please upload PDF, DOCX, TXT, or image files (JPG, PNG).`);
        return;
      }
    }

    // Calculate total file size for individual file size check
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // Individual file size check (10MB per file)
    const MAX_INDIVIDUAL_SIZE = 10 * 1024 * 1024;
    for (const file of files) {
      if (file.size > MAX_INDIVIDUAL_SIZE) {
        onError(`File "${file.name}" is too large. Maximum size per file is 10MB. This file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Process files sequentially and store individual results
      let combinedText = '';
      const processedFiles = [];
      
      for (const file of files) {
        let result: TextExtractionResult;
        
        // Check if it's an image file
        if (file.type.startsWith('image/')) {
          // Process image on client side with OCR
          result = await processImageFile(file);
        } else {
          // Process document files using server action
          const formData = new FormData();
          formData.append('file', file);
          result = await extractTextAction(formData);
        }
        
        if (result.success) {
          combinedText += `\n\n--- From ${file.name} ---\n\n${result.text}`;
          processedFiles.push({
            text: result.text,
            tokenCount: result.tokenCount,
            wordCount: result.wordCount, // Keep for compatibility
            fileInfo: result.fileInfo
          });
        } else {
          onError(`Failed to extract text from ${file.name}: ${result.error}`);
          return;
        }
      }

      // Check character limits after processing all files
      const totalCharacters = combinedText.trim().length;
      if (totalCharacters > maxTotalCharacters) {
        const maxCharsFormatted = maxTotalCharacters.toLocaleString();
        const currentCharsFormatted = totalCharacters.toLocaleString();
        onError(`Content too long. Maximum allowed is ${maxCharsFormatted} characters. Your content has ${currentCharsFormatted} characters.`);
        return;
      }

      if (files.length === 1) {
        // Single file - use existing callback for backward compatibility
        const singleFileResult: TextExtractionResult = {
          text: processedFiles[0]?.text || '',
          success: true,
          tokenCount: processedFiles[0]?.tokenCount || 0,
          wordCount: processedFiles[0]?.wordCount || 0, // Keep for compatibility
          fileInfo: processedFiles[0]?.fileInfo || { name: 'Unknown', size: 0, type: 'unknown' }
        };
        
        onTextExtracted?.(singleFileResult);
      } else {
        // Multiple files - use new callback
        const multiFileResult: MultiFileExtractionResult = {
          files: processedFiles,
          combinedText: combinedText.trim(),
          totalTokenCount: processedFiles.reduce((sum, file) => sum + file.tokenCount, 0),
          totalWordCount: processedFiles.reduce((sum, file) => sum + (file.wordCount || 0), 0), // Keep for compatibility
          totalSize: totalSize,
          success: true
        };
        
        onMultipleFilesExtracted?.(multiFileResult);
      }
      
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to process files');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const maxCharsFormatted = maxTotalCharacters.toLocaleString();
  
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        multiple={multiple}
        style={{ display: 'none' }}
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={disabled || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {multiple ? 'Processing files...' : 'Processing file...'}
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {multiple 
              ? `Upload Files (Documents & Images)`
              : `Upload File (Documents & Images)`
            }
          </>
        )}
      </Button>
    </>
  );
}