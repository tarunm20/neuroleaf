import React, { Suspense } from 'react';
import { DeckEditPage } from './_components/deck-edit-page';
import { PageWithDeckBreadcrumbs } from '~/components/page-with-deck-breadcrumbs';
import { LoadingPage } from '@kit/ui/loading-page';

interface PageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function EditDeckPage({ params }: PageProps) {
  const { deckId } = await params;

  return (
    <PageWithDeckBreadcrumbs 
      title="Edit Deck"
      description="Edit your flashcard deck and manage your cards."
    >
      <Suspense fallback={<LoadingPage message="Loading deck editor..." />}>
        <DeckEditPage deckId={deckId} />
      </Suspense>
    </PageWithDeckBreadcrumbs>
  );
}

export const metadata = {
  title: 'Edit Deck - Neuroleaf',
  description: 'Edit your flashcard deck and manage your cards.',
};