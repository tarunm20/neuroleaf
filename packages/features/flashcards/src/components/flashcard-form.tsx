'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';
import { Input } from '@kit/ui/input';
import { Badge } from '@kit/ui/badge';
import { Card } from '@kit/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { RichTextEditor } from './rich-text-editor';
import { CreateFlashcardData, UpdateFlashcardData } from '../schemas/flashcard.schema';
import { X, Plus, Save } from 'lucide-react';
import { cn } from '@kit/ui/utils';

const FlashcardFormSchema = z.object({
  front_content: z.string().min(1, 'Front content is required').max(5000),
  back_content: z.string().min(1, 'Back content is required').max(5000),
  tags: z.array(z.string()).max(20, 'Maximum 20 tags allowed'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

type FlashcardFormData = z.infer<typeof FlashcardFormSchema>;

interface FlashcardFormProps {
  deckId: string;
  initialData?: Partial<FlashcardFormData> & { id?: string };
  isEditing?: boolean;
  onSubmit: (data: CreateFlashcardData | UpdateFlashcardData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function FlashcardForm({
  deckId,
  initialData,
  isEditing = false,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: FlashcardFormProps) {
  const [newTag, setNewTag] = React.useState('');
  const [previewMode, setPreviewMode] = React.useState<'front' | 'back' | null>(null);

  const form = useForm<FlashcardFormData>({
    resolver: zodResolver(FlashcardFormSchema),
    defaultValues: {
      front_content: initialData?.front_content || '',
      back_content: initialData?.back_content || '',
      tags: initialData?.tags || [],
      difficulty: initialData?.difficulty || 'medium',
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = form;

  const watchedValues = watch();

  const addTag = () => {
    if (newTag.trim() && !watchedValues.tags.includes(newTag.trim())) {
      const updatedTags = [...watchedValues.tags, newTag.trim()];
      if (updatedTags.length <= 20) {
        setValue('tags', updatedTags, { shouldDirty: true });
        setNewTag('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      'tags',
      watchedValues.tags.filter(tag => tag !== tagToRemove),
      { shouldDirty: true }
    );
  };

  const handleFormSubmit = async (data: FlashcardFormData) => {
    if (isEditing && initialData?.id) {
      await onSubmit({
        id: initialData.id,
        front_content: data.front_content,
        back_content: data.back_content,
        tags: data.tags,
        difficulty: data.difficulty,
        front_media_urls: [],
        back_media_urls: [],
        ai_generated: false,
        public_data: {},
      });
    } else {
      await onSubmit({
        deck_id: deckId,
        front_content: data.front_content,
        back_content: data.back_content,
        tags: data.tags,
        difficulty: data.difficulty,
        front_media_urls: [],
        back_media_urls: [],
        ai_generated: false,
        public_data: {},
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-6', className)}>
      {/* Front Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="front_content" className="text-sm font-medium">
            Front Content
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(previewMode === 'front' ? null : 'front')}
          >
            {previewMode === 'front' ? 'Edit' : 'Preview'}
          </Button>
        </div>
        
        {previewMode === 'front' ? (
          <Card className="p-4 min-h-[120px]">
            <RichTextEditor
              content={watchedValues.front_content}
              editable={false}
              className="border-none"
            />
          </Card>
        ) : (
          <RichTextEditor
            content={watchedValues.front_content}
            placeholder="Enter the front content of your flashcard..."
            onChange={(html) => setValue('front_content', html, { shouldDirty: true })}
            minimal
          />
        )}
        
        {errors.front_content && (
          <p className="text-sm text-destructive">{errors.front_content.message}</p>
        )}
      </div>

      {/* Back Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="back_content" className="text-sm font-medium">
            Back Content
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(previewMode === 'back' ? null : 'back')}
          >
            {previewMode === 'back' ? 'Edit' : 'Preview'}
          </Button>
        </div>
        
        {previewMode === 'back' ? (
          <Card className="p-4 min-h-[120px]">
            <RichTextEditor
              content={watchedValues.back_content}
              editable={false}
              className="border-none"
            />
          </Card>
        ) : (
          <RichTextEditor
            content={watchedValues.back_content}
            placeholder="Enter the back content of your flashcard..."
            onChange={(html) => setValue('back_content', html, { shouldDirty: true })}
            minimal
          />
        )}
        
        {errors.back_content && (
          <p className="text-sm text-destructive">{errors.back_content.message}</p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tags</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            maxLength={30}
          />
          <Button
            type="button"
            onClick={addTag}
            variant="outline"
            size="sm"
            disabled={!newTag.trim() || watchedValues.tags.length >= 20}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {watchedValues.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {watchedValues.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          {watchedValues.tags.length}/20 tags
        </p>
        
        {errors.tags && (
          <p className="text-sm text-destructive">{errors.tags.message}</p>
        )}
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Difficulty</Label>
        <Select
          value={watchedValues.difficulty}
          onValueChange={(value: 'easy' | 'medium' | 'hard') =>
            setValue('difficulty', value, { shouldDirty: true })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Easy
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Medium
              </div>
            </SelectItem>
            <SelectItem value="hard">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Hard
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !isDirty}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'} Flashcard
        </Button>
      </div>
    </form>
  );
}