'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AITextConverter } from '@kit/flashcards/components';
import { extractTextFromFileAction } from '../../../../../../lib/server-actions/file-upload-actions';

interface AIConvertPageContainerProps {
  deckId: string;
}

export function AIConvertPageContainer({ deckId }: AIConvertPageContainerProps) {
  const router = useRouter();

  const handleFlashcardsGenerated = (count: number) => {
    toast.success(`Successfully generated ${count} flashcards!`);
    // Redirect back to deck overview page after a short delay
    setTimeout(() => {
      router.push(`/home/decks/${deckId}`);
    }, 2000);
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  return (
    <AITextConverter
      deckId={deckId}
      onFlashcardsGenerated={handleFlashcardsGenerated}
      onError={handleError}
      extractTextAction={extractTextFromFileAction}
    />
  );
}