import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { DeckService } from '@kit/decks/server';

import { TestModePage } from './_components/test-mode-page';

interface TestPageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export const metadata = {
  title: 'Test Mode',
  description: 'AI-powered test mode with grading and feedback',
};

export default async function TestPage({ params }: TestPageProps) {
  const { deckId } = await params;
  const supabase = getSupabaseServerClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/sign-in');
  }

  // Get deck data using service directly
  const deckService = new DeckService(supabase);
  const deck = await deckService.getDeck(deckId);
  
  if (!deck) {
    redirect('/home');
  }

  return (
    <TestModePage 
      deckId={deckId}
      userId={user.id}
    />
  );
}