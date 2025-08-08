'use client';

import React from 'react';
import { Card } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@kit/ui/dialog';
import { FlashcardForm } from './flashcard-form';
import { FlashcardPreview } from './flashcard-preview';
import { useCreateFlashcard, useUpdateFlashcard } from '../hooks/use-flashcards';
import { CreateFlashcardData, UpdateFlashcardData } from '../schemas/flashcard.schema';
import { Edit, Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Flashcard {
  id: string;
  front_content: string;
  back_content: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  deck_id: string;
  position: number;
  created_at: string;
  updated_at: string;
}

interface FlashcardEditorProps {
  deckId: string;
  flashcard?: Flashcard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit' | 'view';
}

export function FlashcardEditor({
  deckId,
  flashcard,
  open,
  onOpenChange,
  mode = 'create',
}: FlashcardEditorProps) {
  
  const createFlashcard = useCreateFlashcard();
  const updateFlashcard = useUpdateFlashcard();

  const isEditing = mode === 'edit';
  const isViewing = mode === 'view';
  const isLoading = createFlashcard.isPending || updateFlashcard.isPending;

  const handleSubmit = async (data: CreateFlashcardData | UpdateFlashcardData) => {
    try {
      if (isEditing && flashcard) {
        await updateFlashcard.mutateAsync({
          id: flashcard.id,
          ...data,
        } as UpdateFlashcardData);
      } else {
        await createFlashcard.mutateAsync(data as CreateFlashcardData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to save flashcard:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create New Flashcard';
      case 'edit':
        return 'Edit Flashcard';
      case 'view':
        return 'View Flashcard';
      default:
        return 'Flashcard';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'create':
        return <Plus className="h-5 w-5" />;
      case 'edit':
        return <Edit className="h-5 w-5" />;
      case 'view':
        return <Eye className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        {isViewing && flashcard ? (
          <div className="space-y-4">
            <FlashcardPreview flashcard={flashcard} />
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <FlashcardForm
              deckId={deckId}
              initialData={flashcard ? {
                front_content: flashcard.front_content,
                back_content: flashcard.back_content,
                tags: flashcard.tags,
                difficulty: flashcard.difficulty,
              } : undefined}
              isEditing={isEditing}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CreateFlashcardButtonProps {
  deckId: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function CreateFlashcardButton({
  deckId,
  variant = 'default',
  size = 'default',
  className,
}: CreateFlashcardButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Flashcard
      </Button>

      <FlashcardEditor
        deckId={deckId}
        open={open}
        onOpenChange={setOpen}
        mode="create"
      />
    </>
  );
}

interface EditFlashcardButtonProps {
  flashcard: Flashcard;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
}

export function EditFlashcardButton({
  flashcard,
  variant = 'ghost',
  size = 'sm',
  className,
}: EditFlashcardButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        {size === 'icon' ? <Edit className="h-4 w-4" /> : (
          <>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </>
        )}
      </Button>

      <FlashcardEditor
        deckId={flashcard.deck_id}
        flashcard={flashcard}
        open={open}
        onOpenChange={setOpen}
        mode="edit"
      />
    </>
  );
}