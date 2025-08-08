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
import { extractTextFromFileAction } from '~/lib/server-actions';
import { 
  Brain, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
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
  const [currentStep, setCurrentStep] = useState<CreationStep>('input');
  const [sourceText, setSourceText] = useState('');
  const [extractedFileInfo, setExtractedFileInfo] = useState<any>(null);
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

  const handleFileTextExtracted = (result: any) => {
    if (result.success) {
      setSourceText(result.text);
      setExtractedFileInfo(result.fileInfo);
      toast.success(`Extracted ${result.wordCount} words from ${result.fileInfo.name}`);
    } else {
      toast.error(result.error || 'Failed to extract text');
    }
  };

  const handleFileError = (error: string) => {
    toast.error(error);
  };

  const handleGenerateFlashcards = async () => {
    if (!sourceText.trim()) {
      toast.error('Please provide text content or upload a file');
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
        content: sourceText,
        maxCards: generationOptions.maxCards,
        difficulty: generationOptions.difficulty,
        includeDefinitions: generationOptions.includeDefinitions,
        includeExamples: generationOptions.includeExamples,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (result.success && result.flashcards) {
        const flashcardsWithSelection = result.flashcards.map((card: any) => ({
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
    setExtractedFileInfo(null);
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
          Upload a file or paste text to generate flashcards from
        </p>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploadButton
            onTextExtracted={handleFileTextExtracted}
            onError={handleFileError}
            extractTextAction={extractTextFromFileAction}
          />
          {extractedFileInfo && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{extractedFileInfo.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(extractedFileInfo.size / 1024)} KB
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Text Input Section */}
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
                disabled={!sourceText.trim()}
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