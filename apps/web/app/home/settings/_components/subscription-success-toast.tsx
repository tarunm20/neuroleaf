'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function SubscriptionSuccessToast() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (success === 'true' && sessionId) {
      toast.success('🎉 Welcome to Neuroleaf Pro!', {
        description: 'Your subscription is now active. You have access to all Pro features.',
        duration: 5000,
      });

      // Clean up URL without causing a page reload
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
    }
  }, [success, sessionId]);

  return null;
}