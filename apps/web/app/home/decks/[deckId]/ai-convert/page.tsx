import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { AIConvertPageContainer } from './_components/ai-convert-page-container';
import { PageWithDeckBreadcrumbs } from '~/components/page-with-deck-breadcrumbs';

interface AIConvertPageProps {
  params: {
    deckId: string;
  };
}

export default async function AIConvertPage({ params }: AIConvertPageProps) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);

  if (result.error) {
    redirect('/auth/sign-in');
  }

  return (
    <PageWithDeckBreadcrumbs 
      title="AI Text Converter"
      description="Convert any text content into flashcards using AI"
    >
      <AIConvertPageContainer deckId={params.deckId} />
    </PageWithDeckBreadcrumbs>
  );
}