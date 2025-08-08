import { Suspense } from 'react';
import { DeckDetailPage } from './_components/deck-detail-page';
import { PageWithDeckBreadcrumbs } from '~/components/page-with-deck-breadcrumbs';
import { LoadingPage } from '@kit/ui/loading-page';

interface PageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function DeckPage({ params }: PageProps) {
  const { deckId } = await params;

  return (
    <PageWithDeckBreadcrumbs 
      title="Deck Overview"
    >
      <Suspense fallback={<LoadingPage message="Loading deck..." showCards />}>
        <DeckDetailPage deckId={deckId} />
      </Suspense>
    </PageWithDeckBreadcrumbs>
  );
}

export const metadata = {
  title: 'Deck Overview',
};