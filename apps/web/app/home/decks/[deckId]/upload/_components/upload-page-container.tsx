'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UploadPageContainerProps {
  deckId: string;
}

export function UploadPageContainer({ deckId }: UploadPageContainerProps) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the AI converter page
    router.replace(`/home/decks/${deckId}/ai-convert`);
  }, [router, deckId]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-muted-foreground">Redirecting to AI converter...</p>
    </div>
  );
}