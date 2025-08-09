'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import { Badge } from '@kit/ui/badge';
import { Progress } from '@kit/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { FileUploadButton } from '@kit/flashcards/components';
import { useCreateFlashcard } from '@kit/flashcards/hooks';
import { useUser } from '@kit/supabase/hooks/use-user';
import { useSubscription } from '@kit/subscription/hooks';
import { extractTextFromFileAction } from '~/lib/server-actions';
import { 
  Brain, 
  FileText, 
  CheckCircle, 
  Loader2,
  Wand2,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

// AI generation service (we'll implement this)
import { generateFlashcardsFromText } from '~/lib/services/ai-generation-service';

interface AIBulkCreationDialogProps {
  deckId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FileExtractionResult {
  text: string;
  success: boolean;
  error?: string;
  wordCount: number;
  fileInfo: {
    name: string;
    size: number;
    type: string;
  };
  name?: string; // For backward compatibility
  size?: number; // For backward compatibility
}

interface MultiFileExtractionResult {
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

interface GeneratedFlashcard {
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  selected: boolean;
}

type CreationStep = 'input' | 'processing' | 'review' | 'creating';

export function AIBulkCreationDialog({ 
  deckId, 
  open, 
  onOpenChange 
}: AIBulkCreationDialogProps) {
  const user = useUser();
  const { data: subscriptionInfo } = useSubscription(user?.data?.id || '');
  
  const [currentStep, setCurrentStep] = useState<CreationStep>('input');
  const [sourceText, setSourceText] = useState(''); // User manual input
  const [fileExtractedContent, setFileExtractedContent] = useState(''); // Hidden file content
  const [extractedFileInfo, setExtractedFileInfo] = useState<FileExtractionResult | null>(null);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    text: string;
    wordCount: number;
    fileInfo: {
      name: string;
      size: number;
      type: string;
    };
  }>>([]);
  
  // For development/testing, default to Pro. In production, check actual subscription.
  const isPro = process.env.NODE_ENV === 'development' 
    ? true // Default to Pro in development for testing
    : subscriptionInfo?.tier === 'pro';
  
  const [generatedFlashcards, setGeneratedFlashcards] = useState<GeneratedFlashcard[]>([]);
  const [creationProgress, setCreationProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [generationOptions, setGenerationOptions] = useState({
    maxCards: 10,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    includeDefinitions: true,
    includeExamples: true,
  });

  const createFlashcard = useCreateFlashcard();

  const handleFileTextExtracted = (result: FileExtractionResult) => {
    if (result.success) {
      // Store file content separately - DON'T put it in sourceText (which is visible to user)
      setFileExtractedContent(result.text);
      setExtractedFileInfo(result);
      setHasUploadedFile(true);
      setUploadedFiles([{
        text: result.text,
        wordCount: result.wordCount,
        fileInfo: result.fileInfo
      }]);
      // Clear any manual text input when file is uploaded
      setSourceText('');
      toast.success(`Extracted ${result.wordCount} words from ${result.fileInfo.name}`);
    } else {
      toast.error(result.error || 'Failed to extract text');
    }
  };

  const handleMultipleFilesExtracted = (result: MultiFileExtractionResult) => {
    if (result.success) {
      // Store combined file content separately
      setFileExtractedContent(result.combinedText);
      setUploadedFiles(result.files);
      // Create a summary file info for the extractedFileInfo state
      setExtractedFileInfo({
        text: result.combinedText,
        success: true,
        wordCount: result.totalWordCount,
        fileInfo: {
          name: `${result.files.length} files`,
          size: result.totalSize,
          type: 'multiple'
        }
      });
      setHasUploadedFile(true);
      // Clear any manual text input when files are uploaded
      setSourceText('');
      toast.success(`Extracted ${result.totalWordCount} words from ${result.files.length} files`);
    } else {
      toast.error(result.error || 'Failed to extract text');
    }
  };

  const handleFileError = (error: string) => {
    toast.error(error);
  };

  // Get the current content for AI generation (file content takes priority over manual input)
  const getCurrentContent = (): string => {
    return fileExtractedContent.trim() || sourceText.trim();
  };

  const handleGenerateFlashcards = async () => {
    const currentContent = getCurrentContent();
    const maxCharacters = isPro ? 200000 : 50000;
    
    if (!currentContent) {
      toast.error('Please provide text content or upload a file');
      return;
    }
    
    if (currentContent.length > maxCharacters) {
      const limit = maxCharacters.toLocaleString();
      const current = currentContent.length.toLocaleString();
      toast.error(`Content too long (maximum ${limit} characters). Your content has ${current} characters.`);
      return;
    }

    setCurrentStep('processing');
    setProcessingProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await generateFlashcardsFromText({
        content: currentContent,
        maxCards: generationOptions.maxCards,
        difficulty: generationOptions.difficulty,
        includeDefinitions: generationOptions.includeDefinitions,
        includeExamples: generationOptions.includeExamples,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (result.success && result.flashcards) {
        const flashcardsWithSelection = result.flashcards.map((card: Omit<GeneratedFlashcard, 'selected'>) => ({
          ...card,
          selected: true,
        }));
        
        setGeneratedFlashcards(flashcardsWithSelection);
        setCurrentStep('review');
        toast.success(`Generated ${result.flashcards.length} flashcards from your content`);
      } else {
        throw new Error(result.error || 'Failed to generate flashcards');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate flashcards');
      setCurrentStep('input');
    }
  };

  const handleToggleFlashcardSelection = (index: number) => {
    setGeneratedFlashcards(prev => prev.map((card, i) => 
      i === index ? { ...card, selected: !card.selected } : card
    ));
  };

  const handleSelectAll = () => {
    const allSelected = generatedFlashcards.every(card => card.selected);
    setGeneratedFlashcards(prev => prev.map(card => ({ 
      ...card, 
      selected: !allSelected 
    })));
  };

  const handleCreateSelectedFlashcards = async () => {
    const selectedCards = generatedFlashcards.filter(card => card.selected);
    
    if (selectedCards.length === 0) {
      toast.error('Please select at least one flashcard to create');
      return;
    }

    setCurrentStep('creating');
    setCreationProgress(0);

    try {
      const total = selectedCards.length;
      
      for (let i = 0; i < selectedCards.length; i++) {
        const card = selectedCards[i];
        
        if (card) {
          await createFlashcard.mutateAsync({
            deck_id: deckId,
            front_content: card.front || '',
            back_content: card.back || '',
            difficulty: card.difficulty || 'medium',
            tags: card.tags || [],
            ai_generated: true,
            front_media_urls: [],
            back_media_urls: [],
            public_data: {},
          });
        }

        setCreationProgress(Math.round(((i + 1) / total) * 100));
      }

      toast.success(`Successfully created ${selectedCards.length} flashcards!`);
      onOpenChange(false);
      resetDialog();
    } catch (error) {
      console.error('Creation error:', error);
      toast.error('Failed to create some flashcards');
      setCurrentStep('review');
    }
  };

  const resetDialog = () => {
    setCurrentStep('input');
    setSourceText('');
    setFileExtractedContent('');
    setExtractedFileInfo(null);
    setHasUploadedFile(false);
    setUploadedFiles([]);
    setGeneratedFlashcards([]);
    setCreationProgress(0);
    setProcessingProgress(0);
  };

  const handleClose = () => {
    if (currentStep === 'processing' || currentStep === 'creating') {
      return; // Prevent closing during processing
    }
    onOpenChange(false);
    resetDialog();
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="content-source" className="text-base font-medium">
          Content Source
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          {isPro 
            ? 'Upload files or paste text to generate flashcards from (up to 200,000 characters)'
            : 'Upload a file or paste text to generate flashcards from (up to 50,000 characters)'
          }
        </p>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {isPro ? 'Upload Files' : 'Upload File'}
            {isPro && (
              <Badge variant="secondary" className="text-xs ml-2">
                Pro - 200K characters
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploadButton
            onTextExtracted={handleFileTextExtracted}
            onMultipleFilesExtracted={handleMultipleFilesExtracted}
            onError={handleFileError}
            extractTextAction={extractTextFromFileAction}
            multiple={isPro}
            isPro={isPro}
            maxTotalCharacters={isPro ? 200000 : 50000} // 200K for Pro, 50K for Free
          />
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {uploadedFiles.length === 1 ? 'File uploaded' : `${uploadedFiles.length} files uploaded`}
                  </span>
                  {isPro && uploadedFiles.length > 1 && (
                    <Badge variant="secondary" className="text-xs ml-2">
                      Pro - Multi-file
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setExtractedFileInfo(null);
                    setFileExtractedContent('');
                    setHasUploadedFile(false);
                    setUploadedFiles([]);
                    // Don't clear sourceText here - let user keep their manual input if they want
                  }}
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
                          {file.wordCount.toLocaleString()} words
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Text Input Section - Only show if no file is uploaded and no source text from file */}
      {!hasUploadedFile && sourceText.length === 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Or Paste Text Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste your study material here..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              {sourceText.length > 0 && `${sourceText.trim().split(/\s+/).length} words`}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show source text summary if we have text but no file info visible */}
      {!hasUploadedFile && sourceText.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Text Content Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Manual text input</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {sourceText.trim().split(/\s+/).filter(word => word.length > 0).length.toLocaleString()} words
                </Badge>
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSourceText('')}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Generation Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max-cards" className="text-sm">Max Cards</Label>
              <Select
                value={generationOptions.maxCards.toString()}
                onValueChange={(value) => setGenerationOptions(prev => ({ 
                  ...prev, 
                  maxCards: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 cards</SelectItem>
                  <SelectItem value="10">10 cards</SelectItem>
                  <SelectItem value="15">15 cards</SelectItem>
                  <SelectItem value="20">20 cards</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty" className="text-sm">Default Difficulty</Label>
              <Select
                value={generationOptions.difficulty}
                onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                  setGenerationOptions(prev => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <Brain className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Generating Flashcards</h3>
        <p className="text-muted-foreground mb-4">
          AI is analyzing your content and creating flashcards...
        </p>
        <Progress value={processingProgress} className="w-full max-w-xs mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">
          {processingProgress}% complete
        </p>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Review Generated Flashcards</h3>
          <p className="text-sm text-muted-foreground">
            Select the flashcards you want to add to your deck
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          {generatedFlashcards.every(card => card.selected) ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-3">
        {generatedFlashcards.map((card, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-colors ${
              card.selected ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleToggleFlashcardSelection(index)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {card.selected ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-muted-foreground rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">FRONT</Label>
                      <p className="text-sm font-medium">{card.front}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">BACK</Label>
                      <p className="text-sm">{card.back}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {card.difficulty}
                      </Badge>
                      {card.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        {generatedFlashcards.filter(card => card.selected).length} of {generatedFlashcards.length} cards selected
      </div>
    </div>
  );

  const renderCreatingStep = () => (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Creating Flashcards</h3>
        <p className="text-muted-foreground mb-4">
          Adding selected flashcards to your deck...
        </p>
        <Progress value={creationProgress} className="w-full max-w-xs mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">
          {creationProgress}% complete
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Flashcard Generation
          </DialogTitle>
          <DialogDescription>
            Upload files or paste text content to automatically generate flashcards using AI
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {currentStep === 'input' && renderInputStep()}
          {currentStep === 'processing' && renderProcessingStep()}
          {currentStep === 'review' && renderReviewStep()}
          {currentStep === 'creating' && renderCreatingStep()}
        </div>

        <DialogFooter>
          {currentStep === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateFlashcards}
                disabled={!getCurrentContent() || getCurrentContent().length > (isPro ? 200000 : 50000)}
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                Generate Flashcards
              </Button>
            </>
          )}

          {currentStep === 'processing' && (
            <Button disabled className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </Button>
          )}

          {currentStep === 'review' && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep('input')}>
                Back to Edit
              </Button>
              <Button 
                onClick={handleCreateSelectedFlashcards}
                disabled={generatedFlashcards.filter(card => card.selected).length === 0}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Create Selected Cards
              </Button>
            </>
          )}

          {currentStep === 'creating' && (
            <Button disabled className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}