import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';

import { TestHistoryPageContainer } from './_components/test-history-page-container';

export const metadata = {
  title: 'Test History',
};

export default async function TestHistoryPage() {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);

  if (result.error) {
    redirect('/');
  }

  return <TestHistoryPageContainer user={result.data} />;
}