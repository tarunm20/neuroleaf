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

interface FileUploadButtonProps {
  onTextExtracted: (result: TextExtractionResult) => void;
  onError: (error: string) => void;
  extractTextAction: (formData: FormData) => Promise<TextExtractionResult>;
  disabled?: boolean;
}

export function FileUploadButton({ 
  onTextExtracted, 
  onError, 
  extractTextAction,
  disabled = false 
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be selected again
    event.target.value = '';

    // Client-side file size validation (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      onError(`File size too large. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }

    // Client-side file type validation
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!supportedTypes.includes(file.type)) {
      onError('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
      return;
    }

    setIsProcessing(true);

    try {
      // Create FormData and use server action
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await extractTextAction(formData);
      
      if (result.success) {
        onTextExtracted(result);
      } else {
        onError(result.error || 'Failed to extract text from file');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileSelect}
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
            Processing file...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload File (PDF, DOCX, TXT)
          </>
        )}
      </Button>
    </>
  );
}