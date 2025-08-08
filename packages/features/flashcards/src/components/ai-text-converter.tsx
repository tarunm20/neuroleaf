'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain, Loader2, FileText, Zap, Type } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Textarea } from '@kit/ui/textarea';
import { Label } from '@kit/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Badge } from '@kit/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { generateFlashcardsWithAIAction } from '../server';
import { FileUploadButton, TextExtractionResult } from './file-upload-button';

const FormSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  numberOfCards: z.number().min(1).max(5).optional().default(5),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

type FormData = z.infer<typeof FormSchema>;

interface AITextConverterProps {
  deckId: string;
  onFlashcardsGenerated?: (count: number) => void;
  onError?: (error: string) => void;
  extractTextAction: (formData: globalThis.FormData) => Promise<TextExtractionResult>;
}

interface GeneratedFlashcard {
  front: string;
  back: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

export function AITextConverter({ 
  deckId, 
  onFlashcardsGenerated,
  onError,
  extractTextAction
}: AITextConverterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedFlashcard[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; wordCount: number } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema) as any,
    defaultValues: {
      content: '',
      numberOfCards: 5,
      difficulty: undefined,
    },
  });

  const handleGenerate = async (data: FormData) => {
    setIsLoading(true);
    setGeneratedCards([]);
    setShowPreview(false);

    try {
      const result = await generateFlashcardsWithAIAction({
        deck_id: deckId,
        content: data.content,
        number_of_cards: data.numberOfCards,
        card_type: 'basic',
        difficulty: data.difficulty,
        language: 'en',
        subject: undefined,
      });

      if (result.success && result.flashcards) {
        setGeneratedCards(result.flashcards);
        setShowPreview(true);
        onFlashcardsGenerated?.(result.flashcards.length);
      } else {
        onError?.(result.error || 'Failed to generate flashcards');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (result: TextExtractionResult) => {
    if (result.success) {
      form.setValue('content', result.text);
      setUploadedFile({ name: result.fileInfo.name, wordCount: result.wordCount });
    }
  };

  const handleFileError = (error: string) => {
    onError?.(error);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Text to Flashcards Converter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4">
            {/* Input Method Tabs */}
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Text Input
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  File Upload
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="space-y-2 mt-4">
                <Label htmlFor="content">Text Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your text content here... (e.g., lecture notes, study materials, articles)"
                  rows={8}
                  className="resize-none"
                  {...form.register('content')}
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-red-600">{form.formState.errors.content.message}</p>
                )}
              </TabsContent>
              
              <TabsContent value="file" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Upload Document</Label>
                  <FileUploadButton
                    onTextExtracted={handleFileUpload}
                    onError={handleFileError}
                    extractTextAction={extractTextAction}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload PDF, DOCX, or TXT files to extract text content
                  </p>
                </div>
                
                {uploadedFile && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{uploadedFile.name}</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      {uploadedFile.wordCount} words extracted successfully
                    </p>
                  </div>
                )}
                
                {form.watch('content') && (
                  <div className="space-y-2">
                    <Label>Extracted Text Preview</Label>
                    <Textarea
                      value={form.watch('content')}
                      onChange={(e) => form.setValue('content', e.target.value)}
                      rows={6}
                      className="resize-none text-sm"
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfCards">Number of Cards</Label>
                <Select 
                  value={form.watch('numberOfCards')?.toString()}
                  onValueChange={(value) => form.setValue('numberOfCards', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 card</SelectItem>
                    <SelectItem value="2">2 cards</SelectItem>
                    <SelectItem value="3">3 cards</SelectItem>
                    <SelectItem value="4">4 cards</SelectItem>
                    <SelectItem value="5">5 cards</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty (Optional)</Label>
                <Select 
                  value={form.watch('difficulty') || 'auto'}
                  onValueChange={(value) => form.setValue('difficulty', value === 'auto' ? undefined : value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              type="submit" 
              disabled={isLoading || !form.watch('content')}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating up to 5 flashcards...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Flashcards with AI
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <div>
                <h3 className="text-lg font-medium">AI is processing your content...</h3>
                <p className="text-muted-foreground">This may take a few moments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Flashcards Preview */}
      {showPreview && generatedCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generated Flashcards ({generatedCards.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {generatedCards.map((card, index) => (
                <Card key={index} className="border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Card {index + 1}
                      </span>
                      {card.difficulty && (
                        <Badge className={getDifficultyColor(card.difficulty)}>
                          {card.difficulty}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Front</p>
                      <p className="text-sm">{card.front}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Back</p>
                      <p className="text-sm">{card.back}</p>
                    </div>
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {card.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {card.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{card.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {showPreview && generatedCards.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="text-center py-6">
            <div className="space-y-2">
              <div className="text-green-600">
                <Brain className="h-8 w-8 mx-auto mb-2" />
              </div>
              <h3 className="text-lg font-medium text-green-800">
                Success! {generatedCards.length} flashcards generated
              </h3>
              <p className="text-green-700">
                Your flashcards have been automatically saved to the deck and are ready for study.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}