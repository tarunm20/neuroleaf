export const SUPPORTED_FILE_TYPES = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  // Check file type
  if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.',
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty.',
    };
  }

  return { valid: true };
}

export function getSupportedFileTypes(): string {
  return Object.values(SUPPORTED_FILE_TYPES)
    .flat()
    .join(', ');
}