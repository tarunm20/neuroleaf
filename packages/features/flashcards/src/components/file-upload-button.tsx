'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, FileText } from 'lucide-react';
import { Button } from '@kit/ui/button';
// We'll import the server action and TextExtractionResult from the web app
// since server actions need to be defined there

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

export interface MultiFileExtractionResult {
  files: Array<{
    text: string;
    wordCount: number;
    fileInfo: {
      name: string;
      size: number;
      type: string;
    };
  }>;
  combinedText: string;
  totalWordCount: number;
  totalSize: number;
  success: boolean;
  error?: string;
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
}

export function FileUploadButton({ 
  onTextExtracted, 
  onMultipleFilesExtracted,
  onError, 
  extractTextAction,
  disabled = false,
  multiple = false,
  isPro = false,
  maxTotalCharacters = 50000 // 50K characters for Free, 200K for Pro
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Reset input value so same file can be selected again
    event.target.value = '';

    // Client-side file type validation
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    // Validate file types
    for (const file of files) {
      if (!supportedTypes.includes(file.type)) {
        onError(`Unsupported file type: ${file.name}. Please upload PDF, DOCX, or TXT files.`);
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
        const formData = new FormData();
        formData.append('file', file);
        
        const result = await extractTextAction(formData);
        
        if (result.success) {
          combinedText += `\n\n--- From ${file.name} ---\n\n${result.text}`;
          processedFiles.push({
            text: result.text,
            wordCount: result.wordCount,
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
          wordCount: processedFiles[0]?.wordCount || 0,
          fileInfo: processedFiles[0]?.fileInfo || { name: 'Unknown', size: 0, type: 'unknown' }
        };
        
        onTextExtracted?.(singleFileResult);
      } else {
        // Multiple files - use new callback
        const multiFileResult: MultiFileExtractionResult = {
          files: processedFiles,
          combinedText: combinedText.trim(),
          totalWordCount: processedFiles.reduce((sum, file) => sum + file.wordCount, 0),
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
        accept=".pdf,.docx,.txt"
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
              ? `Upload Files (PDF, DOCX, TXT) - Max ${maxCharsFormatted} characters`
              : `Upload File (PDF, DOCX, TXT) - Max ${maxCharsFormatted} characters`
            }
          </>
        )}
      </Button>
    </>
  );
}