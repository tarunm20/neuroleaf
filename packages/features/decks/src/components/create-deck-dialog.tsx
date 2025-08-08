'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Type, Upload, Loader2, Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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
import { FileUploadButton, TextExtractionResult } from '@kit/flashcards/components';

const FormSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  content: z.string().min(10, 'Content too short').max(50000),
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
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'creating' | 'analyzing' | 'generating' | 'complete'>('idle');
  const [inputMode, setInputMode] = useState<'text' | 'upload'>('text');

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      content: '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    setLoadingState('creating');
    
    try {
      // Show analyzing state if content is provided
      if (data.content && data.content.trim().length > 0) {
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
        content: data.content,
      });
      
      setLoadingState('complete');
      
      // Show success state briefly before closing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOpen(false);
      form.reset();
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
    if (result.success) {
      form.setValue('content', result.text);
      if (!form.getValues('name')) {
        const fileName = result.fileInfo.name.replace(/\.[^/.]+$/, '');
        form.setValue('name', fileName);
      }
      toast.success(`Successfully extracted ${result.wordCount} words from ${result.fileInfo.name}`);
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
                onError={handleFileUploadError}
                extractTextAction={extractTextAction}
                disabled={isLoading}
              />
              
              {form.watch('content') && (
                <Textarea
                  value={form.watch('content')}
                  onChange={(e) => form.setValue('content', e.target.value)}
                  rows={6}
                  className="resize-none text-sm"
                  disabled={isLoading}
                />
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
              disabled={isLoading}
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