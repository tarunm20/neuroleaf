import { Suspense } from 'react';
import { PageWithBreadcrumbs } from '@kit/ui/page-with-breadcrumbs';
import { LoadingPage } from '@kit/ui/loading-page';

import { UnifiedDashboard } from '~/home/_components/unified-dashboard';

export const metadata = {
  title: 'My Flashcards - Neuroleaf',
  description: 'Your AI-powered learning dashboard with flashcards and spaced repetition.',
};

export default function HomePage() {
  return (
    <PageWithBreadcrumbs 
      title="My Flashcards"
      description="Your AI-powered learning dashboard with flashcards and spaced repetition."
    >
      <Suspense fallback={<LoadingPage message="Loading your flashcards..." showCards />}>
        <UnifiedDashboard />
      </Suspense>
    </PageWithBreadcrumbs>
  );
}
