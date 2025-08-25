'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Type, Upload, Loader2, Plus, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@kit/supabase/hooks/use-user';
import { useSubscription } from '@kit/subscription/hooks';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Textarea } from '@kit/ui/textarea';
import { z } from 'zod';
import { FileUploadButton, TextExtractionResult, MultiFileExtractionResult } from '@kit/flashcards/components';

const FormSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  content: z.string().optional(), // Make optional since we handle file content separately
});

type FormData = z.infer<typeof FormSchema>;

interface CreateDeckDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: any) => Promise<{ id: string } | void>;
  onDeckCreated?: (deckId: string) => void;
  extractTextAction: (formData: globalThis.FormData) => Promise<TextExtractionResult>;
}

export function CreateDeckDialog({ 
  trigger, 
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSubmit,
  onDeckCreated,
  extractTextAction
}: CreateDeckDialogProps) {
  const user = useUser();
  const { data: subscriptionInfo } = useSubscription(user?.data?.id || '');
  
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  
  // For development/testing, default to Pro. In production, check actual subscription.
  const isPro = process.env.NODE_ENV === 'development' 
    ? true // Default to Pro in development for testing
    : subscriptionInfo?.tier === 'pro';
    
  // Get plan limits for file restrictions
  const userTier = isPro ? 'pro' : 'free';
  const maxFilesPerDeck = isPro ? 20 : 3;
  
  const [inputMode, setInputMode] = useState<'text' | 'upload'>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'creating' | 'analyzing' | 'generating' | 'complete'>('idle');
  const [fileExtractedContent, setFileExtractedContent] = useState(''); // Hidden file content
  const [extractedFileInfo, setExtractedFileInfo] = useState<TextExtractionResult | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    text: string;
    tokenCount: number;
    wordCount?: number; // Keep for compatibility
    fileInfo: {
      name: string;
      size: number;
      type: string;
    };
  }>>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      content: '',
    },
  });

  // Get the current content for deck creation (file content takes priority over manual input)
  const getCurrentContent = (): string => {
    return fileExtractedContent.trim() || form.watch('content')?.trim() || '';
  };

  // Reactive validation state for text content only
  const isFormValid = useMemo(() => {
    const formName = form.watch('name')?.trim() || '';
    const textContent = getCurrentContent();
    const hasValidText = textContent.length >= 5; // Temporarily lower for debugging
    const hasValidName = formName.length >= 1;
    
    console.log('Form validation check:', {
      formName,
      textContentLength: textContent.length,
      hasValidText,
      hasValidName,
      isValid: hasValidName && hasValidText
    });
    
    // Valid if we have a name AND valid text content
    return hasValidName && hasValidText;
  }, [form.watch('name'), fileExtractedContent, form.watch('content')]);

  const handleSubmit = async (data: FormData) => {
    console.log('Create deck form submitted:', {
      name: data.name,
      hasFileContent: fileExtractedContent.length > 0,
      fileContentLength: fileExtractedContent.length,
      isFormValid
    });
    
    // Use the same validation logic as the button
    if (!isFormValid) {
      console.log('Form validation failed');
      toast.error('Please provide content by uploading a file/image or entering text (minimum 5 characters)');
      return;
    }
    
    const currentContent = getCurrentContent();
    const maxCharacters = isPro ? 200000 : 50000;
    
    // Check character limit
    if (currentContent.length > maxCharacters) {
      const limit = maxCharacters.toLocaleString();
      const current = currentContent.length.toLocaleString();
      toast.error(`Content too long (maximum ${limit} characters). Your content has ${current} characters.`);
      return;
    }
    
    setIsLoading(true);
    setLoadingState('creating');
    
    try {
      // Show analyzing state if content is provided
      if (currentContent && currentContent.length > 0) {
        setLoadingState('analyzing');
        // Small delay to show the analyzing state
        await new Promise(resolve => setTimeout(resolve, 800));
        setLoadingState('generating');
      }
      
      const result = await onSubmit({
        name: data.name,
        description: '',
        visibility: 'private',
        tags: [],
        content: currentContent
      });
      
      setLoadingState('complete');
      
      // Show success state briefly before closing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOpen(false);
      form.reset();
      setFileExtractedContent('');
      setExtractedFileInfo(null);
      setUploadedFiles([]);
      setLoadingState('idle');
      
      if (result && 'id' in result && onDeckCreated) {
        onDeckCreated(result.id);
      }
    } catch (error) {
      console.error('Failed to create deck:', error);
      setLoadingState('idle');
      // Keep dialog open on error so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (result: TextExtractionResult) => {
    console.log('File upload result:', result);
    if (result.success) {
      // Store file content separately - DON'T put it in the visible form content
      setFileExtractedContent(result.text);
      setExtractedFileInfo(result);
      setUploadedFiles([{
        text: result.text,
        tokenCount: result.tokenCount,
        wordCount: result.wordCount, // Keep for compatibility
        fileInfo: result.fileInfo
      }]);
      // Clear any existing content in the form
      form.setValue('content', '');
      if (!form.getValues('name')) {
        const fileName = result.fileInfo.name.replace(/\.[^/.]+$/, '');
        form.setValue('name', fileName);
        console.log('Set deck name to:', fileName);
      }
      console.log('File extracted successfully, content length:', result.text.length);
      toast.success(`Successfully extracted ${result.tokenCount.toLocaleString()} tokens from ${result.fileInfo.name}`);
    } else {
      console.log('File upload failed:', result.error);
      toast.error(result.error || 'Failed to extract text from file');
    }
  };

  const handleMultipleFilesUpload = (result: MultiFileExtractionResult) => {
    if (result.success) {
      // Store combined file content separately
      setFileExtractedContent(result.combinedText);
      setUploadedFiles(result.files);
      // Create a summary file info for the extractedFileInfo state
      setExtractedFileInfo({
        text: result.combinedText,
        success: true,
        tokenCount: result.totalTokenCount,
        wordCount: result.totalWordCount, // Keep for compatibility
        fileInfo: {
          name: `${result.files.length} files`,
          size: result.totalSize,
          type: 'multiple'
        }
      });
      // Clear any existing content in the form
      form.setValue('content', '');
      if (!form.getValues('name') && result.files.length === 1) {
        const fileName = result.files[0]?.fileInfo.name.replace(/\.[^/.]+$/, '') || '';
        form.setValue('name', fileName);
      }
      toast.success(`Successfully extracted ${result.totalTokenCount.toLocaleString()} tokens from ${result.files.length} files`);
    }
  };

  const handleFileUploadError = (error: string) => {
    console.error('File upload error:', error);
    toast.error(error, {
      duration: 5000,
      description: 'Please try a different file or check the file size/format.',
    });
  };

  const getLoadingMessage = () => {
    switch (loadingState) {
      case 'creating':
        return 'Creating deck...';
      case 'analyzing':
        return 'AI is analyzing your content...';
      case 'generating':
        return 'Generating flashcards...';
      case 'complete':
        return 'Deck created successfully!';
      default:
        return 'Creating...';
    }
  };

  const getLoadingIcon = () => {
    if (loadingState === 'complete') {
      return <CheckCircle className="mr-2 h-4 w-4" />;
    }
    return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen);
      if (!newOpen) {
        form.reset();
        setFileExtractedContent('');
        setExtractedFileInfo(null);
        setUploadedFiles([]);
        setInputMode('text');
        setLoadingState('idle');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Deck</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Loading Progress Indicator */}
          {isLoading && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                {getLoadingIcon()}
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {getLoadingMessage()}
                  </p>
                  {loadingState === 'analyzing' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      This may take a few moments...
                    </p>
                  )}
                  {loadingState === 'generating' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Creating optimized flashcards for your content...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Name Input */}
          <div>
            <Input
              {...form.register('name')}
              placeholder="Deck name"
              disabled={isLoading}
              className="text-lg h-12"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Content Input Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={inputMode === 'text' ? 'default' : 'outline'}
              onClick={() => setInputMode('text')}
              disabled={isLoading}
              className="flex-1"
            >
              <Type className="h-4 w-4 mr-2" />
              Text
            </Button>
            <Button
              type="button"
              variant={inputMode === 'upload' ? 'default' : 'outline'}
              onClick={() => setInputMode('upload')}
              disabled={isLoading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>

          {/* Content Input */}
          {inputMode === 'text' ? (
            <div>
              <Textarea
                {...form.register('content')}
                placeholder="Paste your content here..."
                rows={8}
                disabled={isLoading}
                className="resize-none"
              />
              {form.formState.errors.content && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.content.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <FileUploadButton
                onTextExtracted={handleFileUpload}
                onMultipleFilesExtracted={handleMultipleFilesUpload}
                onError={handleFileUploadError}
                extractTextAction={extractTextAction}
                disabled={isLoading}
                multiple={true} // Allow multiple files for all users
                isPro={isPro}
                maxTotalCharacters={isPro ? 200000 : 50000} // 200K for Pro, 50K for Free
                maxFilesPerDeck={maxFilesPerDeck}
                currentFileCount={uploadedFiles.length}
              />
              
              {/* Show uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {uploadedFiles.length === 1 ? 'File uploaded' : `${uploadedFiles.length} files uploaded`}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setExtractedFileInfo(null);
                        setFileExtractedContent('');
                        setUploadedFiles([]);
                      }}
                      disabled={isLoading}
                      className="h-6 px-2 text-xs text-green-600 hover:text-green-800"
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-medium text-green-700 truncate">
                              {file.fileInfo.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-green-600 shrink-0">
                            <span>
                              {file.fileInfo.size < 1024 * 1024 
                                ? `${Math.round(file.fileInfo.size / 1024)} KB`
                                : `${(file.fileInfo.size / (1024 * 1024)).toFixed(1)} MB`
                              }
                            </span>
                            <span>
                              {file.tokenCount.toLocaleString()} tokens
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Add content via text if no files uploaded */}
              {uploadedFiles.length === 0 && (
                <div>
                  <Textarea
                    {...form.register('content')}
                    placeholder="Or paste your content here..."
                    rows={6}
                    disabled={isLoading}
                    className="resize-none text-sm"
                  />
                  {form.formState.errors.content && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.content.message}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !isFormValid}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  {getLoadingIcon()}
                  {getLoadingMessage()}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}