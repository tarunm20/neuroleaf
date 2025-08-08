import React, { Suspense } from 'react';
import { StudySessionPage } from './_components/study-session-page';
import { PageWithDeckBreadcrumbs } from '~/components/page-with-deck-breadcrumbs';
import { LoadingPage } from '@kit/ui/loading-page';

interface PageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function StudyPage({ params }: PageProps) {
  const { deckId } = await params;

  return (
    <PageWithDeckBreadcrumbs 
      title="Study Session"
      description="Study your flashcards with spaced repetition."
    >
      <Suspense fallback={<LoadingPage message="Loading study session..." />}>
        <StudySessionPage deckId={deckId} />
      </Suspense>
    </PageWithDeckBreadcrumbs>
  );
}

export const metadata = {
  title: 'Study Session - Neuroleaf',
  description: 'Study your flashcards with spaced repetition.',
};