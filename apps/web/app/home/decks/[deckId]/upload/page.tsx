import { redirect } from 'next/navigation';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { UploadPageContainer } from './_components/upload-page-container';
import { PageWithDeckBreadcrumbs } from '~/components/page-with-deck-breadcrumbs';
import type { Metadata } from 'next';

interface UploadPageProps {
  params: {
    deckId: string;
  };
}

export async function generateMetadata({ params }: UploadPageProps): Promise<Metadata> {
  const supabase = getSupabaseServerClient();
  const userResult = await requireUser(supabase);
  
  if (userResult.error) {
    return { title: 'Upload Content - Neuroleaf' };
  }

  const { data: deck } = await supabase
    .from('decks')
    .select('name')
    .eq('id', params.deckId)
    .eq('user_id', userResult.data.id)
    .single();

  return {
    title: `Upload Content - ${deck?.name || 'Deck'} - Neuroleaf`,
    description: 'Upload documents to generate AI-powered flashcards',
  };
}

export default async function UploadPage({ params }: UploadPageProps) {
  const supabase = getSupabaseServerClient();
  const userResult = await requireUser(supabase);

  if (userResult.error) {
    redirect('/auth/sign-in');
  }

  // Verify deck exists and user has access
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('id')
    .eq('id', params.deckId)
    .eq('user_id', userResult.data.id)
    .single();

  if (deckError || !deck) {
    redirect('/home/decks');
  }

  return (
    <PageWithDeckBreadcrumbs 
      title="Upload Content"
      description="Upload documents to generate AI-powered flashcards"
    >
      <UploadPageContainer deckId={params.deckId} />
    </PageWithDeckBreadcrumbs>
  );
}