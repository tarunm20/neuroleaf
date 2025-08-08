import React, { Suspense } from 'react';
import { FlashcardManagementPage } from './_components/flashcard-management-page';
import { PageWithDeckBreadcrumbs } from '~/components/page-with-deck-breadcrumbs';
import { LoadingPage } from '@kit/ui/loading-page';

interface PageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function FlashcardsPage({ params }: PageProps) {
  const { deckId } = await params;

  return (
    <PageWithDeckBreadcrumbs 
      title="Manage Flashcards"
    >
      <Suspense fallback={<LoadingPage message="Loading flashcards..." />}>
        <FlashcardManagementPage deckId={deckId} />
      </Suspense>
    </PageWithDeckBreadcrumbs>
  );
}

export const metadata = {
  title: 'Manage Flashcards',
};