import { Suspense } from 'react';
import { PageWithBreadcrumbs } from '@kit/ui/page-with-breadcrumbs';
import { DecksPageClient } from './decks-page-client';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export const metadata = {
  title: 'My Decks - Neuroleaf',
  description: 'Manage your flashcard decks and track your learning progress.',
};

async function DecksContent() {
  const supabase = getSupabaseServerClient();
  const { data: user } = await requireUser(supabase);

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold mb-2">Please log in to view your decks</h2>
        <p className="text-muted-foreground">You need to be logged in to access your flashcard decks.</p>
      </div>
    );
  }

  return <DecksPageClient accountId={user.id} />;
}

export default function DecksPage() {
  return (
    <PageWithBreadcrumbs
      title="My Decks"
      description="Manage your flashcard decks and track your learning progress."
      breadcrumbs={[
        { label: 'Home', href: '/home' },
        { label: 'My Decks' },
      ]}
    >
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      }>
        <DecksContent />
      </Suspense>
    </PageWithBreadcrumbs>
  );
}