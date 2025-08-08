import React, { Suspense } from 'react';
import { StudyPage } from './_components/study-page';
import { PageWithBreadcrumbs } from '@kit/ui/page-with-breadcrumbs';
import { LoadingPage } from '@kit/ui/loading-page';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

export default async function StudyHomePage() {
  const user = await requireUserInServerComponent();

  return (
    <PageWithBreadcrumbs 
      title="Study"
      description="Choose a deck to study with spaced repetition."
    >
      <Suspense fallback={<LoadingPage message="Loading study options..." />}>
        <StudyPage userId={user.id} />
      </Suspense>
    </PageWithBreadcrumbs>
  );
}

export const metadata = {
  title: 'Study - Neuroleaf',
  description: 'Choose a deck to study with spaced repetition.',
};